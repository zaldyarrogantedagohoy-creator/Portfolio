import nodemailer from 'nodemailer';

const clean = (value) => String(value || '').trim();

const cleanPassword = (value) => clean(value).replace(/\s+/g, '');

const parsePort = (value, fallback) => {
  const port = Number.parseInt(clean(value), 10);
  return Number.isFinite(port) ? port : fallback;
};

const parseSecure = (value, port) => {
  const normalized = clean(value).toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  // Gmail uses implicit SSL on port 465, and STARTTLS on port 587.
  if (port === 465) return true;
  return false;
};

export const getSmtpConfig = () => {
  const user = clean(process.env.GMAIL_SMTP_USER || process.env.SMTP_USER);
  const pass = cleanPassword(process.env.GMAIL_SMTP_APP_PASSWORD || process.env.SMTP_PASS);
  const host = clean(process.env.SMTP_HOST) || 'smtp.gmail.com';
  const port = parsePort(process.env.SMTP_PORT, 587);
  const secure = parseSecure(process.env.SMTP_SECURE, port);
  const from = clean(process.env.EMAIL_FROM) || user;
  const replyTo = clean(process.env.EMAIL_REPLY_TO);

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    replyTo,
  };
};

export const getSmtpConfigStatus = () => {
  const config = getSmtpConfig();

  return {
    smtpHost: Boolean(config.host),
    smtpUser: Boolean(config.user),
    smtpAppPassword: Boolean(config.pass),
    emailFrom: Boolean(config.from),
    emailReplyTo: Boolean(config.replyTo),
  };
};

export const getSmtpConfigError = () => {
  const config = getSmtpConfig();
  const missing = [];
  const hasSmtp = Boolean(config.user && config.pass);

  if (!hasSmtp) {
    return 'Email service is not configured. Add GMAIL_SMTP_USER + GMAIL_SMTP_APP_PASSWORD to .env or Vercel.';
  }

  if (!config.from) missing.push('EMAIL_FROM');

  return missing.length
    ? `Email service is not fully configured. Add ${missing.join(', ')} to .env or Vercel.`
    : '';
};

export const sendEmail = async ({ to, subject, html, text, replyTo }) => {
  const config = getSmtpConfig();

  if (!config.user || !config.pass) {
    throw new Error('No SMTP provider configured. Add GMAIL_SMTP_USER + GMAIL_SMTP_APP_PASSWORD to .env or Vercel.');
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    family: 4,
    tls: { rejectUnauthorized: true },
  });

  const info = await transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });

  return { ...info, providerUsed: 'SMTP' };
};
