import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

// Initialize Resend Client
const resendApiKey = config.emailApiKey || config.resendApiKey || process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const emailFrom = process.env.EMAIL_FROM || 'SpendPilot <onboarding@resend.dev>';

// Initialize Optional Nodemailer Transporter if SMTP configured
const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

const smtpTransporter = (smtpHost && smtpUser && smtpPass)
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass }
    })
  : null;

// Helper: Wrap promise with timeout to prevent server hanging
function withTimeout(promise, ms = 3500) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Email dispatch timed out after ${ms}ms`)), ms))
  ]);
}

/**
 * 1. Sends a Password Reset Email via Resend SDK or Nodemailer with Graceful Fallback
 */
export async function sendPasswordResetEmail(options, tokenParam, nameParam) {
  let toEmail, resetToken, userName;
  if (typeof options === 'object' && options !== null) {
    toEmail = options.to;
    resetToken = options.resetToken;
    userName = options.userName || 'Valued User';
  } else {
    toEmail = options;
    resetToken = tokenParam;
    userName = nameParam || 'Valued User';
  }

  if (!toEmail) {
    throw new Error('Recipient email is required for password reset.');
  }

  const normalizedTo = toEmail.trim().toLowerCase();
  const maskedTo = normalizedTo.substring(0, 1) + '***@' + (normalizedTo.split('@')[1] || 'domain.com');

  const appUrl = config.appUrl || 'http://localhost:5173';
  const resetLink = `${appUrl}/reset-password/${resetToken}`;
  const expiryMinutes = config.passwordResetExpiryMinutes || 30;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your SpendPilot password</title>
      <style>
        body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F7F6F0; color: #092B20; margin: 0; padding: 32px 16px; }
        .wrapper { max-width: 540px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #DDE5DF; border-radius: 24px; padding: 40px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
        .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #19B86A 0%, #129A57 100%); border-radius: 14px; font-weight: 900; font-size: 22px; color: #FFFFFF; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 44px; }
        .brand-name { font-size: 22px; font-weight: 800; color: #092B20; letter-spacing: -0.5px; }
        .title { font-size: 22px; font-weight: 800; color: #092B20; margin-bottom: 12px; letter-spacing: -0.3px; }
        .text { font-size: 14px; color: #53635B; line-height: 1.6; margin-bottom: 24px; }
        .cta-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; padding: 14px 32px; background: #19B86A; color: #FFFFFF; font-weight: 800; text-decoration: none; border-radius: 16px; font-size: 14px; box-shadow: 0 10px 25px rgba(25, 184, 106, 0.3); }
        .alert-box { background: #EEF9F2; border: 1px solid #DDF5E8; border-radius: 14px; padding: 14px 18px; margin-top: 24px; font-size: 13px; color: #092B20; font-weight: 600; }
        .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #DDE5DF; font-size: 12px; color: #747B76; text-align: center; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="brand">
          <div class="logo-icon">S</div>
          <span class="brand-name">SpendPilot</span>
        </div>

        <div class="title">Reset your SpendPilot password</div>
        <p class="text">Hi ${userName},</p>
        <p class="text">We received a request to reset your SpendPilot password.</p>

        <div class="cta-container">
          <a href="${resetLink}" class="btn" target="_blank">Reset Password</a>
        </div>

        <div class="alert-box">
          ⏰ This link expires in <strong>${expiryMinutes} minutes</strong>.
        </div>

        <p class="text" style="margin-top: 24px; font-size: 13px;">If you did not request this reset, you can safely ignore this email.</p>

        <div class="footer">
          SpendPilot • Track. Split. Save.
        </div>
      </div>
    </body>
    </html>
  `;

  console.log('\n[EMAIL DEBUG]');
  console.log(`From: ${emailFrom}`);
  console.log(`To: ${maskedTo}`);
  console.log('Purpose: PASSWORD_RESET\n');

  if (smtpTransporter) {
    try {
      const info = await withTimeout(smtpTransporter.sendMail({
        from: emailFrom,
        to: normalizedTo,
        subject: 'Reset your SpendPilot password',
        html: htmlContent
      }));
      console.log(`[RESET EMAIL] Recipient: ${maskedTo} Provider: SMTP Status: accepted Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, provider: 'smtp', recipient: normalizedTo };
    } catch (err) {
      console.log(`[EMAIL ERROR] Provider: SMTP Status: 500 Message: ${err.message}`);
    }
  }

  if (resend) {
    try {
      const data = await withTimeout(resend.emails.send({
        from: emailFrom,
        to: normalizedTo,
        subject: 'Reset your SpendPilot password',
        html: htmlContent
      }));

      if (data && data.data && data.data.id) {
        console.log(`[RESET EMAIL] Recipient: ${maskedTo} Provider: Resend Status: accepted Message ID: ${data.data.id}`);
        return { success: true, messageId: data.data.id, provider: 'resend', recipient: normalizedTo };
      } else if (data && data.error) {
        const statusCode = data.error.statusCode || (data.error.name === 'validation_error' ? 403 : 500);
        console.log(`[EMAIL ERROR] Provider: Resend Status: ${statusCode} Message: ${data.error.message}`);

        if (config.env === 'development' && (data.error.name === 'validation_error' || statusCode === 422 || statusCode === 403)) {
          return { success: true, devMode: true, provider: 'resend-dev-sandbox', recipient: normalizedTo };
        }

        return { success: false, error: data.error.message, httpStatus: statusCode, provider: 'resend', recipient: normalizedTo };
      }
    } catch (err) {
      console.log(`[EMAIL ERROR] Provider: Resend Status: 500 Message: ${err.message}`);

      if (config.env === 'development') {
        return { success: true, devMode: true, provider: 'resend-dev-sandbox', recipient: normalizedTo };
      }

      return { success: false, error: err.message, httpStatus: 500, provider: 'resend', recipient: normalizedTo };
    }
  }

  return { success: false, error: 'Email provider not configured or unavailable', recipient: normalizedTo };
}

/**
 * 2. Sends Password Changed Confirmation Email
 */
export async function sendPasswordChangedConfirmationEmail(toEmail, userName = 'Valued User') {
  if (!toEmail) return { success: false, error: 'Recipient email required' };
  const normalizedTo = toEmail.trim().toLowerCase();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; background-color: #F7F6F0; color: #092B20; padding: 24px;">
      <div style="max-width: 500px; margin: 0 auto; background: #FFFFFF; border: 1px solid #DDE5DF; border-radius: 20px; padding: 32px;">
        <div style="font-size: 20px; font-weight: 900; color: #19B86A; margin-bottom: 20px;">SpendPilot</div>
        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 12px;">Password Changed Successfully</h3>
        <p style="font-size: 13px; color: #53635B;">Hi ${userName},</p>
        <p style="font-size: 13px; color: #53635B;">Your SpendPilot account password was changed successfully.</p>
      </div>
    </body>
    </html>
  `;

  try {
    if (resend) {
      await withTimeout(resend.emails.send({ from: emailFrom, to: normalizedTo, subject: '✅ SpendPilot Password Changed Successfully', html: htmlContent }), 2500);
    }
  } catch (err) {
    console.log(`[EMAIL ERROR] Provider: Resend Status: 500 Message: ${err.message}`);
  }
  return { success: true, recipient: normalizedTo };
}

/**
 * 3. Sends Account Verification Email
 */
export async function sendVerificationEmail(options, tokenParam, nameParam) {
  let toEmail, verificationToken, userName;
  if (typeof options === 'object' && options !== null) {
    toEmail = options.to;
    verificationToken = options.verificationToken;
    userName = options.userName || 'Valued User';
  } else {
    toEmail = options;
    verificationToken = tokenParam;
    userName = nameParam || 'Valued User';
  }

  if (!toEmail) return { success: false, error: 'Recipient email required' };
  const normalizedTo = toEmail.trim().toLowerCase();
  const appUrl = config.appUrl || 'http://localhost:5173';
  const verifyLink = `${appUrl}/verify-email?token=${verificationToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; background-color: #F7F6F0; color: #092B20; padding: 32px 16px;">
      <div style="max-width: 500px; margin: 0 auto; background: #FFFFFF; border: 1px solid #DDE5DF; border-radius: 24px; padding: 40px 32px;">
        <h2 style="color: #19B86A;">SpendPilot</h2>
        <h3>Verify your SpendPilot Email</h3>
        <p>Hi ${userName},</p>
        <p>Welcome to SpendPilot! Click the button below to verify your email address and activate your account.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${verifyLink}" style="display: inline-block; padding: 14px 32px; background: #19B86A; color: #FFFFFF; font-weight: 800; text-decoration: none; border-radius: 16px;">Verify Email Address</a>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    if (resend) {
      const data = await withTimeout(resend.emails.send({ from: emailFrom, to: normalizedTo, subject: 'Verify your SpendPilot email address', html: htmlContent }));
      if (data && data.data && data.data.id) return { success: true, messageId: data.data.id, provider: 'resend', recipient: normalizedTo };
    }
  } catch (err) {
    console.log(`[EMAIL ERROR] Provider: Resend Status: 500 Message: ${err.message}`);
  }
  return { success: true, devMode: true, recipient: normalizedTo };
}

/**
 * 4. Sends Group Invitation Email
 */
export async function sendGroupInvitationEmail(options, groupParam, inviterParam) {
  let toEmail, inviterName, groupName, groupId;
  if (typeof options === 'object' && options !== null) {
    toEmail = options.to;
    inviterName = options.inviterName || 'A SpendPilot user';
    groupName = options.groupName || 'Expense Group';
    groupId = options.groupId;
  } else {
    toEmail = options;
    groupName = groupParam || 'Expense Group';
    inviterName = inviterParam || 'A SpendPilot user';
  }

  if (!toEmail) return { success: false, error: 'Recipient email required' };
  const normalizedTo = toEmail.trim().toLowerCase();
  const appUrl = config.appUrl || 'http://localhost:5173';
  const joinLink = groupId ? `${appUrl}/dashboard?joinGroup=${groupId}` : `${appUrl}/dashboard`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; background-color: #F7F6F0; color: #092B20; padding: 24px;">
      <div style="max-width: 500px; margin: 0 auto; background: #FFFFFF; border: 1px solid #DDE5DF; border-radius: 24px; padding: 32px;">
        <h2 style="color: #19B86A;">SpendPilot Group Invitation</h2>
        <p>Hi,</p>
        <p><strong>${inviterName}</strong> invited you to join the group <strong>"${groupName}"</strong> on SpendPilot!</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${joinLink}" style="display: inline-block; padding: 14px 32px; background: #19B86A; color: #FFFFFF; font-weight: 800; text-decoration: none; border-radius: 16px;">View Group</a>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    if (resend) {
      const data = await withTimeout(resend.emails.send({ from: emailFrom, to: normalizedTo, subject: `👥 You're invited to join "${groupName}" on SpendPilot`, html: htmlContent }));
      if (data && data.data && data.data.id) return { success: true, messageId: data.data.id, provider: 'resend', recipient: normalizedTo };
    }
  } catch (err) {
    console.log(`[EMAIL ERROR] Provider: Resend Status: 500 Message: ${err.message}`);
  }
  return { success: true, devMode: true, recipient: normalizedTo };
}

/**
 * 5. Sends a Standalone Test Email
 */
export async function sendTestEmail(toEmail) {
  if (!toEmail) return { success: false, error: 'Recipient email required' };
  const normalizedTo = toEmail.trim().toLowerCase();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body>
      <h2>SpendPilot Test Email</h2>
      <p>This is a test email from SpendPilot.</p>
    </body>
    </html>
  `;

  if (resend) {
    try {
      const data = await withTimeout(resend.emails.send({
        from: emailFrom,
        to: normalizedTo,
        subject: 'SpendPilot Test Email',
        html: htmlContent
      }));

      if (data && data.data && data.data.id) {
        return { success: true, messageId: data.data.id, provider: 'resend', recipient: normalizedTo };
      } else if (data && data.error) {
        const statusCode = data.error.statusCode || (data.error.name === 'validation_error' ? 403 : 500);
        console.log(`[EMAIL ERROR] Provider: Resend Status: ${statusCode} Message: ${data.error.message}`);
        return { success: false, error: data.error.message, recipient: normalizedTo };
      }
    } catch (err) {
      console.log(`[EMAIL ERROR] Provider: Resend Status: 500 Message: ${err.message}`);
      return { success: false, error: err.message, recipient: normalizedTo };
    }
  }

  return { success: false, error: 'Resend provider not configured', recipient: normalizedTo };
}
