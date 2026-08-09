import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;
const emailFrom = process.env.EMAIL_FROM;
const smtpPort = Number.parseInt(process.env.SMTP_PORT || '587', 10);
const smtpTransporter = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  : null;

function normalizeRecipient(to) {
  const normalized = String(to || '').trim().toLowerCase();
  return normalized.includes('@') ? normalized : null;
}

function safeProviderMessage(error) {
  return error?.message || 'Email provider rejected the message.';
}

async function deliver({ to, subject, html, idempotencyKey }) {
  const normalizedTo = normalizeRecipient(to);
  if (!normalizedTo) return { success: false, error: 'Invalid recipient email.' };
  // A test-only transport exercises routing without contacting a provider. It is
  // never enabled by application configuration in normal environments.
  if (process.env.NODE_ENV === 'test' && process.env.MOCK_EMAIL === 'true') {
    return { success: true, messageId: 'test-message', provider: 'test', recipient: normalizedTo };
  }
  if (!emailFrom) return { success: false, error: 'Email provider is not configured.', recipient: normalizedTo };

  try {
    if (smtpTransporter) {
      const info = await smtpTransporter.sendMail({ from: emailFrom, to: normalizedTo, subject, html });
      if (info?.messageId) return { success: true, messageId: info.messageId, provider: 'smtp', recipient: normalizedTo };
      return { success: false, error: 'Email provider did not accept the message.', recipient: normalizedTo };
    }

    if (!resend) return { success: false, error: 'Email provider is not configured.', recipient: normalizedTo };
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [normalizedTo],
      subject,
      html,
      ...(idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {})
    });
    if (data?.id && !error) return { success: true, messageId: data.id, provider: 'resend', recipient: normalizedTo };
    console.warn(`[EMAIL ERROR] Provider: Resend Status: ${error?.statusCode || 500} Message: ${safeProviderMessage(error)}`);
    return { success: false, error: 'Unable to send the email right now.', recipient: normalizedTo };
  } catch (error) {
    console.warn(`[EMAIL ERROR] Provider: ${smtpTransporter ? 'SMTP' : 'Resend'} Status: 500 Message: ${safeProviderMessage(error)}`);
    return { success: false, error: 'Unable to send the email right now.', recipient: normalizedTo };
  }
}

function resetTemplate(userName, resetLink, expiryMinutes) {
  return `<p>Hi ${userName || 'there'},</p><p>We received a request to reset your SpendPilot password.</p><p><a href="${resetLink}">Reset Password</a></p><p>This link expires in ${expiryMinutes} minutes. If you did not request it, you can ignore this email.</p>`;
}

export function sendPasswordResetEmail({ to, resetToken, userName, idempotencyKey }) {
  const resetLink = `${config.appUrl}/reset-password/${resetToken}`;
  return deliver({
    to,
    subject: 'Reset your SpendPilot password',
    html: resetTemplate(userName, resetLink, config.passwordResetExpiryMinutes),
    idempotencyKey
  });
}

export function sendPasswordChangedConfirmationEmail({ to, userName }) {
  return deliver({
    to,
    subject: 'SpendPilot password changed',
    html: `<p>Hi ${userName || 'there'},</p><p>Your SpendPilot password was changed successfully.</p>`
  });
}

export function sendVerificationEmail({ to, verificationToken, userName }) {
  return Promise.resolve({ success: false, error: 'Email verification is disabled.' });
}

export function sendGroupInvitationEmail({ to, inviterName, groupName, groupId }) {
  const joinLink = `${config.appUrl}/dashboard${groupId ? `?joinGroup=${encodeURIComponent(groupId)}` : ''}`;
  return deliver({
    to,
    subject: `You're invited to join ${groupName || 'a SpendPilot group'}`,
    html: `<p>${inviterName || 'A SpendPilot user'} invited you to join ${groupName || 'a group'}.</p><p><a href="${joinLink}">View Group</a></p>`
  });
}
