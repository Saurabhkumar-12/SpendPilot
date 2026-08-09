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
export async function sendPasswordResetEmail(toEmail, resetToken, userName = 'Valued User') {
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your SpendPilot Password</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F7F6F0; color: #092B20; margin: 0; padding: 32px 16px; }
        .wrapper { max-width: 540px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #DDE5DF; border-radius: 24px; padding: 40px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
        .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #19B86A 0%, #15803D 100%); border-radius: 14px; font-weight: 900; font-size: 22px; color: #FFFFFF; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 44px; }
        .brand-name { font-size: 22px; font-weight: 800; color: #092B20; letter-spacing: -0.5px; }
        .title { font-size: 22px; font-weight: 800; color: #092B20; margin-bottom: 12px; letter-spacing: -0.3px; }
        .text { font-size: 14px; color: #53635B; line-height: 1.6; margin-bottom: 24px; }
        .cta-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; padding: 14px 32px; background: #19B86A; color: #FFFFFF; font-weight: 800; text-decoration: none; border-radius: 16px; font-size: 14px; box-shadow: 0 10px 25px rgba(25, 184, 106, 0.3); }
        .link-box { background: #F7F6F0; border: 1px solid #DDE5DF; padding: 16px; border-radius: 14px; font-family: monospace; color: #092B20; font-size: 12px; word-break: break-all; margin-top: 24px; }
        .alert-box { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 14px; padding: 14px 18px; margin-top: 24px; font-size: 12px; color: #B45309; }
        .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #DDE5DF; font-size: 11px; color: #747B76; text-align: center; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="brand">
          <div class="logo-icon">S</div>
          <span class="brand-name">SpendPilot</span>
        </div>

        <div class="title">Reset Your Password</div>
        <p class="text">Hi ${userName},</p>
        <p class="text">We received a request to reset the password for your SpendPilot account. Click the button below to choose a new password:</p>

        <div class="cta-container">
          <a href="${resetLink}" class="btn" target="_blank">Reset Password Now →</a>
        </div>

        <div class="alert-box">
          ⏰ <strong>Security Notice:</strong> This password reset link is valid for <strong>1 hour</strong>.
        </div>

        <p class="text" style="margin-top: 24px;">If the button above does not work, copy and paste this direct link into your browser:</p>
        <div class="link-box">${resetLink}</div>

        <p class="text" style="margin-top: 24px; font-size: 12px;">If you did not request a password reset, you can safely ignore this email.</p>

        <div class="footer">
          SpendPilot SaaS • Advanced Expense Management Engine
        </div>
      </div>
    </body>
    </html>
  `;

  // Try SMTP Transporter first if configured
  if (smtpTransporter) {
    try {
      console.log(`📨 Sending reset email to [${toEmail}] via SMTP...`);
      await withTimeout(smtpTransporter.sendMail({
        from: emailFrom,
        to: toEmail,
        subject: '🔒 Reset Your SpendPilot Password',
        html: htmlContent
      }));
      console.log(`✅ [SMTP SUCCESS] Reset email sent to ${toEmail}`);
      return { success: true, provider: 'smtp', resetLink };
    } catch (err) {
      console.warn(`⚠️ [SMTP FAILED] ${err.message}. Trying Resend fallback...`);
    }
  }

  // Try Resend SDK
  if (resend) {
    try {
      console.log(`📨 Dispatching password reset email to [${toEmail}] via Resend SDK...`);
      const data = await withTimeout(resend.emails.send({
        from: emailFrom,
        to: toEmail,
        subject: '🔒 Reset Your SpendPilot Password',
        html: htmlContent
      }));

      if (data.error) {
        console.warn(`⚠️ [RESEND API WARNING] ${data.error.message}. Falling back to console log.`);
      } else {
        const emailId = data.data?.id || data.id || 'resend_ok';
        console.log(`✅ [RESEND SUCCESS] Reset email sent! ID: ${emailId}`);
        return { success: true, id: emailId, provider: 'resend', resetLink };
      }
    } catch (err) {
      console.warn(`⚠️ [RESEND EXCEPTION/TIMEOUT] ${err.message}. Falling back to console log.`);
    }
  }

  // Fallback to local console log
  console.log(`\n==================================================`);
  console.log(`📧 [PASSWORD RESET LINK GENERATED FOR ${toEmail}]`);
  console.log(`URL: ${resetLink}`);
  console.log(`==================================================\n`);

  return { success: true, provider: 'console_fallback', resetLink };
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

