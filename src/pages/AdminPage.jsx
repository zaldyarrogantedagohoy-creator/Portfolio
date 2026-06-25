import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import logoImg from '../assets/images/logo.png';
import '../styles/AdminPage.css';

const ADMIN_SESSION_KEY = 'portfolio-admin-authenticated';
const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'ZeilDhagz_0008';
const PDF_ACCESS_EMAIL_ENDPOINT = '/api/send-pdf-access-email';
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

const sendPdfAccessApprovalEmail = async (request) => {
  const response = await fetch(PDF_ACCESS_EMAIL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      adminPasscode: ADMIN_PASSCODE,
      request: {
        id: request.id,
        requesterName: request.requester_name,
        requesterEmail: request.requester_email,
        fileName: request.file_name,
        fileUrl: request.file_url,
        fileType: request.file_type || 'PDF',
      },
    }),
  });

  const responseText = await response.text();
  const contentType = response.headers.get('content-type') || '';
  let payload = {};

  if (contentType.includes('application/json')) {
    payload = responseText ? JSON.parse(responseText) : {};
  } else {
    throw new Error(
      'Email API route was not reached. Use Vercel/`vercel dev` or add a backend email function for this host.',
    );
  }

  if (!response.ok) {
    throw new Error(payload.message || 'Approval email failed.');
  }

  if (payload.message !== 'Approval email sent.') {
    throw new Error(payload.message || 'Email API did not confirm delivery request.');
  }

  return payload;
};

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
  const [reviewDeletingId, setReviewDeletingId] = useState(null);
  const [pdfRequests, setPdfRequests] = useState([]);
  const [isLoadingPdfRequests, setIsLoadingPdfRequests] = useState(false);
  const [pdfRequestStatus, setPdfRequestStatus] = useState('');
  const [pdfRequestsSyncedAt, setPdfRequestsSyncedAt] = useState(null);
  const [pdfRequestActionId, setPdfRequestActionId] = useState(null);
  const [messageDeletingId, setMessageDeletingId] = useState(null);
  const [pdfRequestDeletingId, setPdfRequestDeletingId] = useState(null);

  useEffect(() => {
    const hasAdminAccess = window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    const adminEmail = window.sessionStorage.getItem('admin-email');
    setIsAuthorized(hasAdminAccess && !!adminEmail);
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

  const deleteReview = async (reviewId) => {
    if (!supabase || !reviewId) return;
    if (!window.confirm('Delete this review permanently?')) return;

    setReviewDeletingId(reviewId);
    setReviewStatus('');

    try {
      const { error } = await supabase.rpc('delete_site_review_for_admin', {
        admin_passcode: ADMIN_PASSCODE,
        review_id: reviewId,
      });

      if (error) {
        setReviewStatus(`ERROR: ${error.message}`);
      } else {
        await fetchReviews();
        setReviewStatus('Review deleted successfully.');
      }
    } finally {
      setReviewDeletingId(null);
    }
  };

  const fetchPdfRequests = useCallback(async () => {
    if (!supabase) {
      setPdfRequestStatus('Supabase env missing: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setIsLoadingPdfRequests(true);
    setPdfRequestStatus('');

    const { data, error } = await supabase.rpc('get_pdf_access_requests_for_admin', {
      admin_passcode: ADMIN_PASSCODE,
    });

    let visibleRequests = data || [];
    let fetchError = error;

    if (fetchError?.code === 'PGRST202') {
      const fallback = await supabase.from('pdf_access_requests').select('*').limit(100);
      visibleRequests = fallback.data || [];
      fetchError = fallback.error;
    }

    if (fetchError) {
      setPdfRequestStatus(/pdf_access_requests|schema cache|Could not find|function.*not found/i.test(fetchError.message || '')
        ? 'PDF request table missing. Run supabase/pdf_access_requests.sql in Supabase SQL Editor, then reload the app.'
        : `ERROR: ${fetchError.message}`);
    } else {
      const sortedRequests = sortByNewest(visibleRequests);
      setPdfRequests(sortedRequests);
      setPdfRequestStatus(
        sortedRequests.length
          ? `Latest PDF requests synced: ${sortedRequests.length} visible.`
          : 'No PDF access requests yet.',
      );
      setPdfRequestsSyncedAt(new Date().toISOString());
    }

    setIsLoadingPdfRequests(false);
  }, []);

  const updatePdfRequestStatus = async (request, nextStatus) => {
    const requestRecord = typeof request === 'object'
      ? request
      : pdfRequests.find((item) => item.id === request);
    const requestId = requestRecord?.id || request;

    if (!supabase || !requestId) return;

    setPdfRequestActionId(requestId);
    setPdfRequestStatus('');

    const { error } = await supabase.rpc('set_pdf_access_request_status', {
      request_id: requestId,
      new_status: nextStatus,
      admin_passcode: ADMIN_PASSCODE,
    });

    let statusUpdated = false;
    let actionMessage = `PDF request marked ${nextStatus}.`;

    if (error && error.code === 'PGRST202') {
      const fallback = await supabase
        .from('pdf_access_requests')
        .update({ status: nextStatus })
        .eq('id', requestId);
      if (fallback.error) {
        setPdfRequestStatus(`ERROR: ${fallback.error.message}`);
      } else {
        statusUpdated = true;
      }
    } else if (error) {
      setPdfRequestStatus(`ERROR: ${error.message}`);
    } else {
      statusUpdated = true;
    }

    if (statusUpdated && nextStatus === 'approved' && requestRecord) {
      try {
        const emailResult = await sendPdfAccessApprovalEmail(requestRecord);
        actionMessage = `Request approved and email sent to ${emailResult.to || requestRecord.requester_email}.`;
      } catch (emailError) {
        actionMessage = `Request approved, but email was not sent: ${emailError.message}`;
      }
    }

    if (statusUpdated) {
      await fetchPdfRequests();
      setPdfRequestStatus(actionMessage);
    }

    setPdfRequestActionId(null);
  };

  const deleteMessage = async (messageId) => {
    if (!supabase || !messageId) return;
    if (!window.confirm('Delete this message permanently?')) return;

    setMessageDeletingId(messageId);
    setMessageStatus('');

    try {
      const { error } = await supabase.rpc('delete_contact_message_for_admin', {
        admin_passcode: ADMIN_PASSCODE,
        message_id: messageId,
      });

      if (error) {
        setMessageStatus(`ERROR: ${error.message}`);
      } else {
        await fetchMessages();
        setMessageStatus('Message deleted successfully.');
      }
    } finally {
      setMessageDeletingId(null);
    }
  };

  const deletePdfRequest = async (requestId) => {
    if (!supabase || !requestId) return;
    if (!window.confirm('Delete this PDF access request permanently?')) return;

    setPdfRequestDeletingId(requestId);
    setPdfRequestStatus('');

    try {
      const { error } = await supabase.rpc('delete_pdf_access_request_for_admin', {
        request_id: requestId,
        admin_passcode: ADMIN_PASSCODE,
      });

      if (error) {
        setPdfRequestStatus(`ERROR: ${error.message}`);
      } else {
        await fetchPdfRequests();
        setPdfRequestStatus('PDF access request deleted successfully.');
      }
    } finally {
      setPdfRequestDeletingId(null);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchMessages();
      fetchReviews();
      fetchPdfRequests();
    }
  }, [fetchMessages, fetchReviews, fetchPdfRequests, isAuthorized]);

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

  useEffect(() => {
    if (!isAuthorized || !supabase) return undefined;

    const channel = supabase
      .channel('admin-pdf-access-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pdf_access_requests' },
        () => fetchPdfRequests(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPdfRequests, isAuthorized]);

  const stats = useMemo(() => {
    const pending = messages.filter((message) => message.status === 'pending').length;
    const pendingReviews = reviews.filter((review) => review.status === 'pending').length;
    const pendingPdfRequests = pdfRequests.filter((request) => request.status === 'pending').length;
    return [
      { label: 'messages', value: messages.length },
      { label: 'pending', value: pending },
      { label: 'review queue', value: pendingReviews },
      { label: 'pdf requests', value: pendingPdfRequests },
    ];
  }, [messages, pdfRequests, reviews]);

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
                <div className="admin-message-footer">
                  <span className={`admin-message-status ${message.status || 'pending'}`}>
                    {message.status || 'pending'}
                  </span>
                  <button
                    type="button"
                    className="admin-btn admin-btn-small admin-btn-danger"
                    onClick={() => deleteMessage(message.id)}
                    disabled={messageDeletingId === message.id}
                  >
                    {messageDeletingId === message.id ? 'deleting...' : 'delete()'}
                  </button>
                </div>
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
                    <button
                      type="button"
                      className="admin-btn admin-btn-small admin-btn-danger"
                      onClick={() => deleteReview(review.id)}
                      disabled={reviewDeletingId === review.id}
                    >
                      {reviewDeletingId === review.id ? 'deleting...' : 'delete()'}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <span className="admin-kicker">$ pdf_access_requests</span>
            <h2>unlock_queue</h2>
            {pdfRequestsSyncedAt && <p className="admin-sync-time">last_sync: {formatDate(pdfRequestsSyncedAt)}</p>}
          </div>
          <button className="admin-btn" type="button" onClick={fetchPdfRequests} disabled={isLoadingPdfRequests}>
            {isLoadingPdfRequests ? 'syncing...' : 'refresh()'}
          </button>
        </div>

        {pdfRequestStatus && <p className="admin-status">{pdfRequestStatus}</p>}

        <div className="admin-message-list">
          {pdfRequests.length === 0 ? (
            <div className="admin-empty-state">No PDF access requests available.</div>
          ) : (
            pdfRequests.map((request) => (
              <article className="admin-message-card admin-review-card admin-pdf-request-card" key={request.id || `${request.file_name}-${getMessageDate(request)}`}>
                <div className="admin-message-meta">
                  <strong>{request.requester_name || 'anonymous'}</strong>
                  <span>{request.requester_email || 'no_email'}</span>
                  <span>{request.requester_phone || 'no_number'}</span>
                  <span>{formatDate(getMessageDate(request))}</span>
                </div>
                <div className="admin-pdf-request-body">
                  <span className="admin-pdf-request-label">requested_file</span>
                  <strong>{request.file_name || 'unknown_pdf'}</strong>
                  <span>{request.file_type || 'PDF'}</span>
                  <p>{request.request_reason || 'No reason provided.'}</p>
                  <small>{request.file_url || 'No file URL recorded.'}</small>
                </div>
                <div className="admin-review-controls">
                  <span className={`admin-message-status ${request.status || 'pending'}`}>
                    {request.status || 'pending'}
                  </span>
                  <div className="admin-review-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-small"
                      onClick={() => updatePdfRequestStatus(request, 'approved')}
                      disabled={pdfRequestActionId === request.id || request.status === 'approved'}
                    >
                      approve()
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-small admin-btn-muted"
                      onClick={() => updatePdfRequestStatus(request, 'rejected')}
                      disabled={pdfRequestActionId === request.id || request.status === 'rejected'}
                    >
                      reject()
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-small admin-btn-danger"
                      onClick={() => deletePdfRequest(request.id)}
                      disabled={pdfRequestDeletingId === request.id}
                    >
                      {pdfRequestDeletingId === request.id ? 'deleting...' : 'delete()'}
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
