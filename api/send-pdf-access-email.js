const DEFAULT_ADMIN_PASSCODE = 'ZeilDhagz_0008';

const clean = (value) => String(value || '').trim();

const escapeHtml = (value) =>
  clean(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sendJson = (response, status, payload) => {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
};

const readJsonBody = async (request) => {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') {
    return request.body ? JSON.parse(request.body) : {};
  }

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
};

const getHeader = (request, name) => {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const getConfiguredOrigin = (request) => {
  const configuredOrigin = clean(process.env.SITE_URL || process.env.PUBLIC_SITE_URL);
  if (configuredOrigin) return configuredOrigin.replace(/\/+$/, '');

  const host = getHeader(request, 'x-forwarded-host') || getHeader(request, 'host');
  if (!host) return '';

  const protocol = getHeader(request, 'x-forwarded-proto') || 'https';
  return `${protocol}://${host}`;
};

const toAbsoluteUrl = (url, origin) => {
  const fileUrl = clean(url);
  if (!fileUrl) return '';
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  if (!origin) return fileUrl;

  try {
    return new URL(fileUrl, `${origin}/`).toString();
  } catch {
    return fileUrl;
  }
};

const buildEmail = ({ requesterName, fileName, fileUrl, siteOrigin }) => {
  const safeName = escapeHtml(requesterName || 'there');
  const safeFileName = escapeHtml(fileName || 'requested PDF');
  const safeFileUrl = escapeHtml(fileUrl);
  const safeSiteOrigin = escapeHtml(siteOrigin);

  const text = [
    `Hello ${requesterName || 'there'},`,
    '',
    `Your request to access "${fileName || 'the requested PDF'}" has been approved.`,
    fileUrl ? `Open the PDF here: ${fileUrl}` : '',
    siteOrigin ? `Portfolio: ${siteOrigin}` : '',
    '',
    'Thank you.',
  ].filter(Boolean).join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p>Hello ${safeName},</p>
      <p>Your request to access <strong>${safeFileName}</strong> has been approved.</p>
      ${
        safeFileUrl
          ? `<p><a href="${safeFileUrl}" style="display:inline-block;background:#00c46a;color:#001b10;padding:12px 18px;text-decoration:none;font-weight:700;border-radius:6px;">Open PDF</a></p>
             <p style="font-size:13px;color:#4b5563;">If the button does not work, copy this link:<br><a href="${safeFileUrl}">${safeFileUrl}</a></p>`
          : '<p>Please revisit the portfolio and open the approved PDF from the project section.</p>'
      }
      ${safeSiteOrigin ? `<p style="font-size:13px;color:#4b5563;">Portfolio: <a href="${safeSiteOrigin}">${safeSiteOrigin}</a></p>` : ''}
      <p>Thank you.</p>
    </div>
  `;

  return { html, text };
};

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.setHeader('Allow', 'POST, OPTIONS');
    response.end();
    return;
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { message: 'Method not allowed.' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch {
    sendJson(response, 400, { message: 'Invalid JSON body.' });
    return;
  }

  const expectedPasscode = clean(
    process.env.ADMIN_PASSCODE || process.env.VITE_ADMIN_PASSCODE || DEFAULT_ADMIN_PASSCODE,
  );
  const adminPasscode = clean(body?.adminPasscode);

  if (!adminPasscode || adminPasscode !== expectedPasscode) {
    sendJson(response, 401, { message: 'Unauthorized email request.' });
    return;
  }

  const pdfRequest = body?.request || {};
  const requesterName = clean(pdfRequest.requesterName);
  const requesterEmail = clean(pdfRequest.requesterEmail);
  const fileName = clean(pdfRequest.fileName);
  const requestId = clean(pdfRequest.id);
  const siteOrigin = getConfiguredOrigin(request);
  const fileUrl = toAbsoluteUrl(pdfRequest.fileUrl, siteOrigin);

  if (!isValidEmail(requesterEmail)) {
    sendJson(response, 400, { message: 'Requester email is missing or invalid.' });
    return;
  }

  if (!fileName || !fileUrl) {
    sendJson(response, 400, { message: 'PDF name or link is missing.' });
    return;
  }

  const resendApiKey = clean(process.env.RESEND_API_KEY);
  const emailFrom = clean(process.env.EMAIL_FROM);
  const replyTo = clean(process.env.EMAIL_REPLY_TO);

  if (!resendApiKey || !emailFrom) {
    sendJson(response, 503, {
      message: 'Email service is not configured. Add RESEND_API_KEY and EMAIL_FROM in Vercel.',
    });
    return;
  }

  const { html, text } = buildEmail({
    requesterName,
    fileName,
    fileUrl,
    siteOrigin,
  });

  const emailPayload = {
    from: emailFrom,
    to: [requesterEmail],
    subject: `PDF access approved: ${fileName}`,
    html,
    text,
  };

  if (replyTo) {
    emailPayload.reply_to = replyTo;
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      ...(requestId ? { 'Idempotency-Key': `pdf-access-approved-${requestId}` } : {}),
    },
    body: JSON.stringify(emailPayload),
  });

  const resendResult = await resendResponse.json().catch(() => ({}));

  if (!resendResponse.ok) {
    sendJson(response, 502, {
      message:
        resendResult?.message ||
        resendResult?.error ||
        'Email provider rejected the approval email.',
    });
    return;
  }

  sendJson(response, 200, {
    message: 'Approval email sent.',
    emailId: resendResult?.id || null,
    to: requesterEmail,
  });
}
