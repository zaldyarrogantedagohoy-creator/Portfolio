import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import logoImg from '../assets/images/logo.png';
import '../styles/AdminPage.css';

const ADMIN_SESSION_KEY = 'portfolio-admin-authenticated';
const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'ZeilDhagz_0008';
const REVIEW_SETUP_MESSAGE = 'Review table missing. Run supabase/site_reviews.sql in Supabase SQL Editor, then reload the app.';
const isMissingReviewTableError = (error) => {
  const message = error?.message || '';
  return error?.code === '42P01' || error?.code === 'PGRST205' || error?.code === 'PGRST202' || /site_reviews|schema cache|Could not find the table|function.*not found/i.test(message);
};

const formatDate = (value) => {
  if (!value) return 'not_synced';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const getMessageDate = (message) =>
  message.created_at || message.inserted_at || message.updated_at || null;

const sortByNewest = (records) =>
  [...records].sort((a, b) => {
    const dateA = getMessageDate(a);
    const dateB = getMessageDate(b);
    if (!dateA || !dateB) return 0;
    return new Date(dateB) - new Date(dateA);
  });

const IconChevronUp = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <polyline points="18,15 12,9 6,15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AdminPage = () => {
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageStatus, setMessageStatus] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewsSyncedAt, setReviewsSyncedAt] = useState(null);
  const [reviewActionId, setReviewActionId] = useState(null);

  useEffect(() => {
    const hasAdminAccess = window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    setIsAuthorized(hasAdminAccess);
    setIsCheckingAccess(false);
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!supabase) {
      setMessageStatus('Supabase env missing: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setIsLoadingMessages(true);
    setMessageStatus('');

    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .limit(50);

    let visibleMessages = data || [];
    let fetchError = error;

    if (!fetchError && visibleMessages.length === 0) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_contact_messages_for_admin');
      if (!rpcError) {
        visibleMessages = rpcData || [];
      } else if (rpcError.code !== 'PGRST202') {
        fetchError = rpcError;
      }
    }

    if (fetchError) {
      setMessageStatus(`ERROR: ${fetchError.message}`);
    } else {
      const sortedMessages = sortByNewest(visibleMessages);

      setMessages(sortedMessages);
      setMessageStatus(
        sortedMessages.length
          ? `Latest messages synced: ${sortedMessages.length} visible.`
          : 'No messages returned. If Supabase has rows, run the SELECT RLS policy in supabase/contact_messages.sql.',
      );
      setLastSyncedAt(new Date().toISOString());
    }

    setIsLoadingMessages(false);
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!supabase) {
      setReviewStatus('Supabase env missing: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setIsLoadingReviews(true);
    setReviewStatus('');

    const { data, error } = await supabase.rpc('get_site_reviews_for_admin', {
      admin_passcode: ADMIN_PASSCODE,
    });

    let visibleReviews = data || [];
    let fetchError = error;

    if (fetchError?.code === 'PGRST202') {
      const fallback = await supabase.from('site_reviews').select('*').limit(100);
      visibleReviews = fallback.data || [];
      fetchError = fallback.error;
    }

    if (fetchError) {
      setReviewStatus(isMissingReviewTableError(fetchError) ? REVIEW_SETUP_MESSAGE : `ERROR: ${fetchError.message}`);
    } else {
      const sortedReviews = sortByNewest(visibleReviews);
      setReviews(sortedReviews);
      setReviewStatus(
        sortedReviews.length
          ? `Latest reviews synced: ${sortedReviews.length} visible.`
          : 'No reviews submitted yet.',
      );
      setReviewsSyncedAt(new Date().toISOString());
    }

    setIsLoadingReviews(false);
  }, []);

  const updateReviewStatus = async (reviewId, nextStatus) => {
    if (!supabase || !reviewId) return;

    setReviewActionId(reviewId);
    setReviewStatus('');

    const { error } = await supabase.rpc('set_site_review_status', {
      review_id: reviewId,
      new_status: nextStatus,
      admin_passcode: ADMIN_PASSCODE,
    });

    if (error && error.code === 'PGRST202') {
      const fallback = await supabase
        .from('site_reviews')
        .update({ status: nextStatus })
        .eq('id', reviewId);
      if (fallback.error) {
        setReviewStatus(isMissingReviewTableError(fallback.error) ? REVIEW_SETUP_MESSAGE : `ERROR: ${fallback.error.message}`);
      } else {
        await fetchReviews();
      }
    } else if (error) {
      setReviewStatus(isMissingReviewTableError(error) ? REVIEW_SETUP_MESSAGE : `ERROR: ${error.message}`);
    } else {
      await fetchReviews();
    }

    setReviewActionId(null);
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchMessages();
      fetchReviews();
    }
  }, [fetchMessages, fetchReviews, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized || !supabase) return undefined;

    const channel = supabase
      .channel('admin-contact-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_messages' },
        () => fetchMessages(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized || !supabase) return undefined;

    const channel = supabase
      .channel('admin-site-reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_reviews' },
        () => fetchReviews(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReviews, isAuthorized]);

  const stats = useMemo(() => {
    const pending = messages.filter((message) => message.status === 'pending').length;
    const pendingReviews = reviews.filter((review) => review.status === 'pending').length;
    const approvedReviews = reviews.filter((review) => review.status === 'approved').length;
    return [
      { label: 'messages', value: messages.length },
      { label: 'pending', value: pending },
      { label: 'review queue', value: pendingReviews },
      { label: 'posted reviews', value: approvedReviews },
    ];
  }, [messages, reviews]);

  const handleLogout = () => {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.assign('/');
  };

  if (isCheckingAccess) {
    return (
      <main className="admin-page admin-page-centered">
        <div className="admin-terminal-card">
          <span className="admin-kicker">$ checking_session</span>
          <h1>loading_admin</h1>
        </div>
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="admin-page admin-page-centered">
        <div className="admin-terminal-card">
          <span className="admin-kicker">$ access_denied</span>
          <h1>admin_locked</h1>
          <p>Open the admin login from the site footer first.</p>
          <a className="admin-btn" href="/">return_home()</a>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="admin-brand" href="/">
          <img src={logoImg} alt="Zaldy Dagohoy logo" />
          <span>admin_console</span>
        </a>
        <button className="admin-btn admin-btn-muted" type="button" onClick={handleLogout}>
          logout()
        </button>
      </header>

      <section className="admin-hero">
        <span className="admin-kicker">$ portfolio_control</span>
        <h1>dashboard</h1>
        <p>Review contact messages and approve visitor reviews before they appear on the site.</p>
      </section>

      <section className="admin-stats" aria-label="Admin overview">
        {stats.map((item) => (
          <article className="admin-stat-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <span className="admin-kicker">$ contact_messages</span>
            <h2>inbox</h2>
            {lastSyncedAt && <p className="admin-sync-time">last_sync: {formatDate(lastSyncedAt)}</p>}
          </div>
          <button className="admin-btn" type="button" onClick={fetchMessages} disabled={isLoadingMessages}>
            {isLoadingMessages ? 'syncing...' : 'refresh()'}
          </button>
        </div>

        {messageStatus && <p className="admin-status">{messageStatus}</p>}

        <div className="admin-message-list">
          {messages.length === 0 ? (
            <div className="admin-empty-state">No messages available.</div>
          ) : (
            messages.map((message) => (
              <article className="admin-message-card" key={message.id || `${message.name}-${getMessageDate(message) || message.message}`}>
                <div className="admin-message-meta">
                  <strong>{message.name || 'anonymous'}</strong>
                  <span>{message.email || 'no_email'}</span>
                  <span>{message.phone || 'no_phone'}</span>
                  <span>{formatDate(getMessageDate(message))}</span>
                </div>
                <p>{message.message}</p>
                <span className={`admin-message-status ${message.status || 'pending'}`}>
                  {message.status || 'pending'}
                </span>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <span className="admin-kicker">$ site_reviews</span>
            <h2>review_queue</h2>
            {reviewsSyncedAt && <p className="admin-sync-time">last_sync: {formatDate(reviewsSyncedAt)}</p>}
          </div>
          <button className="admin-btn" type="button" onClick={fetchReviews} disabled={isLoadingReviews}>
            {isLoadingReviews ? 'syncing...' : 'refresh()'}
          </button>
        </div>

        {reviewStatus && <p className="admin-status">{reviewStatus}</p>}

        <div className="admin-message-list">
          {reviews.length === 0 ? (
            <div className="admin-empty-state">No reviews available.</div>
          ) : (
            reviews.map((review) => (
              <article className="admin-message-card admin-review-card" key={review.id || `${review.name}-${getMessageDate(review) || review.comment}`}>
                <div className="admin-message-meta">
                  <strong>{review.name || 'anonymous'}</strong>
                  <span>{formatDate(getMessageDate(review))}</span>
                  <span className="admin-review-stars" aria-label={`${review.rating} of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= Number(review.rating) ? 'star-on' : 'star-off'}>★</span>
                    ))}
                  </span>
                </div>
                <p>{review.comment}</p>
                <div className="admin-review-controls">
                  <span className={`admin-message-status ${review.status || 'pending'}`}>
                    {review.status || 'pending'}
                  </span>
                  <div className="admin-review-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-small"
                      onClick={() => updateReviewStatus(review.id, 'approved')}
                      disabled={reviewActionId === review.id || review.status === 'approved'}
                    >
                      post()
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-small admin-btn-muted"
                      onClick={() => updateReviewStatus(review.id, 'rejected')}
                      disabled={reviewActionId === review.id || review.status === 'rejected'}
                    >
                      hide()
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <button className="admin-scroll-top" type="button" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <IconChevronUp size={16} color="currentColor" />
      </button>
    </main>
  );
};

export default AdminPage;
