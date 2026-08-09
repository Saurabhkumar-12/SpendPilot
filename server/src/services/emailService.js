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
  const maskedTo = normalizedTo.substring(0, 1) + '***@' + normalizedTo.split('@')[1];

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

  // 1. Try SMTP Transporter if configured
  if (smtpTransporter) {
    try {
      const info = await withTimeout(smtpTransporter.sendMail({
        from: emailFrom,
        to: normalizedTo,
        subject: 'Reset your SpendPilot password',
        html: htmlContent
      }));
      console.log('\n[RESET EMAIL]');
      console.log(`Recipient: ${maskedTo}`);
      console.log('Provider: SMTP');
      console.log('Status: accepted');
      console.log(`Message ID: ${info.messageId}\n`);
      return { success: true, messageId: info.messageId, provider: 'smtp', recipient: normalizedTo };
    } catch (err) {
      console.log('\n[RESET EMAIL]');
      console.log(`Recipient: ${maskedTo}`);
      console.log('Provider: SMTP');
      console.log('Status: rejected');
      console.log('Message ID: NONE\n');
    }
  }

  // 2. Try Resend SDK if configured
  if (resend) {
    try {
      const data = await withTimeout(resend.emails.send({
        from: emailFrom,
        to: normalizedTo,
        subject: 'Reset your SpendPilot password',
        html: htmlContent
      }));

      if (data && data.data && data.data.id) {
        console.log('\n[RESET EMAIL]');
        console.log(`Recipient: ${maskedTo}`);
        console.log('Provider: Resend');
        console.log('Status: accepted');
        console.log(`Message ID: ${data.data.id}\n`);
        return { success: true, messageId: data.data.id, provider: 'resend', recipient: normalizedTo };
      } else if (data && data.error) {
        const statusCode = data.error.statusCode || (data.error.name === 'validation_error' ? 403 : 500);
        console.log('\n[RESET EMAIL]');
        console.log(`Recipient: ${maskedTo}`);
        console.log('Provider: Resend');
        console.log('Status: rejected');
        console.log('Message ID: NONE');
        console.log(`Error: ${data.error.message}\n`);

        // If in development mode and Resend rejects due to unverified recipient domain, use Ethereal SMTP fallback
        if (config.env === 'development' && data.error.name === 'validation_error') {
          console.log(`📨 [DEV FALLBACK] Resend testing domain restriction active. Generating Ethereal test inbox for [${normalizedTo}]...`);
          try {
            const testAccount = await nodemailer.createTestAccount();
            const devTransporter = nodemailer.createTransport({
              host: 'smtp.ethereal.email',
              port: 587,
              secure: false,
              auth: { user: testAccount.user, pass: testAccount.pass }
            });
            const info = await devTransporter.sendMail({
              from: 'SpendPilot Security <no-reply@spendpilot.com>',
              to: normalizedTo,
              subject: 'Reset your SpendPilot password',
              html: htmlContent
            });
            return { success: true, messageId: info.messageId, provider: 'ethereal-dev', recipient: normalizedTo };
          } catch (e) {
            return { success: true, devMode: true, recipient: normalizedTo };
          }
        }

        return { success: false, error: data.error.message, httpStatus: statusCode, provider: 'resend', recipient: normalizedTo };
      }
    } catch (err) {
      console.log('\n[RESET EMAIL]');
      console.log(`Recipient: ${maskedTo}`);
      console.log('Provider: Resend');
      console.log('Status: rejected');
      console.log('Message ID: NONE');
      console.log(`Error: ${err.message}\n`);

      if (config.env === 'development') {
        console.log(`📨 [DEV FALLBACK] Development fallback active for [${normalizedTo}]...`);
        try {
          const testAccount = await nodemailer.createTestAccount();
          const devTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass }
          });
          const info = await devTransporter.sendMail({
            from: 'SpendPilot Security <no-reply@spendpilot.com>',
            to: normalizedTo,
            subject: 'Reset your SpendPilot password',
            html: htmlContent
          });
          return { success: true, messageId: info.messageId, provider: 'ethereal-dev', recipient: normalizedTo };
        } catch (e) {
          return { success: true, devMode: true, recipient: normalizedTo };
        }
      }

      return { success: false, error: err.message, httpStatus: 500, provider: 'resend', recipient: normalizedTo };
    }
  }

  return { success: false, error: 'Email provider not configured or unavailable', recipient: normalizedTo };
}

/**
 * Sends a standalone test email for dev diagnostics
 */
export async function sendTestEmail(toEmail) {
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
      console.log('\n[RESEND DEBUG]');
      console.log('Request started');
      const data = await withTimeout(resend.emails.send({
        from: emailFrom,
        to: toEmail,
        subject: 'SpendPilot Test Email',
        html: htmlContent
      }));

      if (data && data.data && data.data.id) {
        console.log('HTTP status: 200');
        console.log(`Message ID: ${data.data.id}`);
        console.log('Error: NONE\n');
        return { success: true, messageId: data.data.id, provider: 'resend' };
      } else if (data && data.error) {
        const statusCode = data.error.statusCode || (data.error.name === 'validation_error' ? 403 : 500);
        console.log(`HTTP status: ${statusCode}`);
        console.log('Message ID: NONE');
        console.log(`Provider error: ${data.error.message}\n`);
        return { success: false, error: data.error.message };
      }
    } catch (err) {
      console.log('HTTP status: 500');
      console.log('Message ID: NONE');
      console.log(`Provider error: ${err.message}\n`);
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'Resend provider not configured' };
}

/**
 * 2. Sends Password Changed Confirmation Email
 */
export async function sendPasswordChangedConfirmationEmail(toEmail, userName = 'Valued User') {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; background-color: #F7F6F0; color: #092B20; padding: 24px; }
        .card { max-width: 500px; margin: 0 auto; background: #FFFFFF; border: 1px solid #DDE5DF; border-radius: 20px; padding: 32px; }
        .logo { font-size: 20px; font-weight: 900; color: #19B86A; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: 800; margin-bottom: 12px; }
        .text { font-size: 13px; color: #53635B; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">SpendPilot</div>
        <div class="title">Password Changed Successfully</div>
        <p class="text">Hi ${userName},</p>
        <p class="text">Your SpendPilot account password was changed successfully.</p>
      </div>
    </body>
    </html>
  `;

  try {
    if (smtpTransporter) {
      await withTimeout(smtpTransporter.sendMail({
        from: emailFrom,
        to: toEmail,
        subject: '✅ SpendPilot Password Changed Successfully',
        html: htmlContent
      }), 2500);
    } else if (resend) {
      await withTimeout(resend.emails.send({
        from: emailFrom,
        to: toEmail,
        subject: '✅ SpendPilot Password Changed Successfully',
        html: htmlContent
      }), 2500);
    }
  } catch (err) {
    console.warn(`⚠️ [CONFIRMATION EMAIL NOTICE] Non-critical dispatch result: ${err.message}`);
  }
  return { success: true };
}

