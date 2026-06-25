import { createClient } from '@supabase/supabase-js';
import { getSmtpConfigError, getSmtpConfigStatus, sendEmail } from './email-smtp.js';

const OTP_EXPIRY_MINUTES = 10;

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

const getJwtRole = (token) => {
  const jwtParts = clean(token).split('.');
  if (jwtParts.length < 2) return '';

  try {
    const payload = JSON.parse(
      Buffer.from(jwtParts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    );

    return clean(payload?.role);
  } catch {
    return '';
  }
};

const getEmailConfigStatus = () => {
  const serviceRoleKeyRole = getJwtRole(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return {
    ...getSmtpConfigStatus(),
    supabaseUrl: Boolean(clean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)),
    supabaseServiceRoleKey: Boolean(clean(process.env.SUPABASE_SERVICE_ROLE_KEY)),
    supabaseServiceRoleKeyRole: serviceRoleKeyRole || null,
    supabaseServiceRoleKeyIsServiceRole: serviceRoleKeyRole
      ? serviceRoleKeyRole === 'service_role'
      : null,
  };
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

const buildEmail = ({ otp, siteOrigin }) => {
  const safeOtp = escapeHtml(otp);
  const safeSiteOrigin = escapeHtml(siteOrigin);

  const text = [
    'Your admin login code is:',
    otp,
    '',
    `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    siteOrigin ? `Portfolio: ${siteOrigin}` : '',
    '',
    'If you did not request this code, you can ignore this email.',
  ].filter(Boolean).join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p>Your admin login code is:</p>
      <p style="font-size:32px;letter-spacing:6px;font-weight:800;margin:16px 0;color:#001b10;">${safeOtp}</p>
      <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      ${safeSiteOrigin ? `<p style="font-size:13px;color:#4b5563;">Portfolio: <a href="${safeSiteOrigin}">${safeSiteOrigin}</a></p>` : ''}
      <p style="font-size:13px;color:#4b5563;">If you did not request this code, you can ignore this email.</p>
    </div>
  `;

  return { html, text };
};

const createSupabaseAdminClient = () => {
  const supabaseUrl = clean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const serviceRoleKeyRole = getJwtRole(serviceRoleKey);

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error: 'Supabase server credentials are not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.',
    };
  }

  if (serviceRoleKeyRole && serviceRoleKeyRole !== 'service_role') {
    return {
      error: `SUPABASE_SERVICE_ROLE_KEY is using the "${serviceRoleKeyRole}" role. Replace it with the Supabase service_role key, then restart or redeploy.`,
    };
  }

  return {
    client: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
  };
};

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.setHeader('Allow', 'GET, POST, OPTIONS');
    response.end();
    return;
  }

  if (request.method === 'GET') {
    sendJson(response, 200, {
      message: 'Admin OTP email API is reachable.',
      config: getEmailConfigStatus(),
    });
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

  const adminEmail = clean(body?.adminEmail).toLowerCase();

  if (!isValidEmail(adminEmail)) {
    sendJson(response, 400, { message: 'Admin email is missing or invalid.' });
    return;
  }

  const smtpConfigError = getSmtpConfigError();
  if (smtpConfigError) {
    sendJson(response, 503, { message: smtpConfigError });
    return;
  }

  const { client: supabaseAdmin, error: supabaseConfigError } = createSupabaseAdminClient();
  if (supabaseConfigError) {
    sendJson(response, 503, { message: supabaseConfigError });
    return;
  }

  const { data: otp, error: otpError } = await supabaseAdmin.rpc('generate_admin_otp', {
    admin_email: adminEmail,
  });

  if (otpError) {
    const otpErrorMessage = otpError.message || '';
    const status = /not found|inactive/i.test(otpErrorMessage) ? 404 : 400;
    const message = /permission denied.*generate_admin_otp/i.test(otpErrorMessage)
      ? 'Supabase denied generate_admin_otp. Rerun supabase/admin_auth.sql and confirm SUPABASE_SERVICE_ROLE_KEY is the service_role key, not the anon key.'
      : otpErrorMessage || 'Unable to generate admin OTP.';

    sendJson(response, status, {
      message,
    });
    return;
  }

  if (!/^\d{6}$/.test(String(otp || ''))) {
    sendJson(response, 500, {
      message: 'Admin OTP generator returned an invalid code.',
    });
    return;
  }

  const siteOrigin = getConfiguredOrigin(request);
  const { html, text } = buildEmail({ otp: String(otp), siteOrigin });

  let emailResult;
  try {
    emailResult = await sendEmail({
      to: adminEmail,
      subject: 'Your admin login code',
      html,
      text,
    });
  } catch (error) {
    const errMsg = String(error?.message || 'SMTP request failed');

    // Provide actionable guidance for common network/auth issues
    if (/ETIMEDOUT|EAI_AGAIN|ECONNREFUSED|ENETUNREACH/i.test(errMsg) || error?.code === 'ETIMEDOUT') {
      sendJson(response, 502, {
        message: `Could not deliver the OTP email. Provider errors: ${errMsg}. Common causes: outbound SMTP is blocked by your network or ISP, a local firewall/antivirus is blocking the connection, or the environment cannot reach smtp.gmail.com on port 465/587.`,
      });
      return;
    }

    if (/No SMTP provider configured|No email provider configured/i.test(errMsg)) {
      sendJson(response, 502, {
        message: `Email service is not configured. Add GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD for Gmail SMTP.`,
      });
      return;
    }

    if (/Invalid login|Authentication failed|535/i.test(errMsg)) {
      sendJson(response, 502, {
        message: `SMTP authentication failed (${errMsg}). Confirm you are using a 16-character Google App Password (not your normal Gmail password) and that the GMAIL_SMTP_USER / GMAIL_SMTP_APP_PASSWORD environment variables are correct in Vercel or your .env file.`,
      });
      return;
    }

    sendJson(response, 502, {
      message: `Could not send OTP email: ${errMsg}`,
    });
    return;
  }

  sendJson(response, 200, {
    message: `OTP sent to ${adminEmail}. Check your Gmail inbox.`,
    emailId: emailResult?.messageId || null,
    to: adminEmail,
  });
}
