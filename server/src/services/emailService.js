import { Resend } from 'resend';
import { config } from '../config/index.js';

// Initialize Resend Client
const resendApiKey = config.emailApiKey || config.resendApiKey || process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const emailFrom = process.env.EMAIL_FROM || 'SpendPilot <onboarding@resend.dev>';

/**
 * 1. Sends a Professional Password Reset Email via Resend SDK
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
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090B; color: #FFFFFF; margin: 0; padding: 32px 16px; }
        .wrapper { max-width: 540px; margin: 0 auto; background-color: #18181B; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 40px 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
        .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); border-radius: 14px; font-weight: 900; font-size: 22px; color: #09090B; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 44px; box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
        .brand-name { font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; }
        .title { font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px; letter-spacing: -0.3px; }
        .text { font-size: 14px; color: #A1A1AA; line-height: 1.6; margin-bottom: 24px; }
        .cta-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); color: #09090B; font-weight: 800; text-decoration: none; border-radius: 16px; font-size: 14px; box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3); transition: transform 0.2s ease; }
        .link-box { background: #09090B; border: 1px solid rgba(255, 255, 255, 0.1); padding: 16px; border-radius: 14px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #A3E635; font-size: 12px; word-break: break-all; margin-top: 24px; }
        .alert-box { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 14px; padding: 14px 18px; margin-top: 24px; font-size: 12px; color: #FCD34D; }
        .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 11px; color: #71717A; text-align: center; }
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
          ⏰ <strong>Security Notice:</strong> This password reset link is strictly valid for <strong>1 hour</strong>.
        </div>

        <p class="text" style="margin-top: 24px;">If the button above does not work, copy and paste this direct link into your browser:</p>
        <div class="link-box">${resetLink}</div>

        <p class="text" style="margin-top: 24px; font-size: 12px;">If you did not request a password reset, you can safely ignore this email. Your password will remain completely secure.</p>

        <div class="footer">
          SpendPilot SaaS • Advanced Expense Management Engine<br>
          This is an automated security notice. Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!resend) {
    console.warn(`⚠️ [RESEND SDK NOTICE] No EMAIL_API_KEY configured. Falling back to local console dispatch.`);
    console.log(`\n==================================================`);
    console.log(`📧 [PASSWORD RESET LINK FOR ${toEmail}]`);
    console.log(`URL: ${resetLink}`);
    console.log(`==================================================\n`);
    return { success: true, provider: 'console_fallback', resetLink };
  }

  try {
    console.log(`\n📨 Dispatching password reset email to [${toEmail}] via Resend SDK...`);
    const data = await resend.emails.send({
      from: emailFrom,
      to: toEmail,
      subject: '🔒 Reset Your SpendPilot Password',
      html: htmlContent
    });

    if (data.error) {
      console.error(`❌ [RESEND API ERROR]`, data.error);
      return { success: false, error: data.error.message };
    }

    const emailId = data.data?.id || data.id || 'resend_ok';
    console.log(`✅ [RESEND SUCCESS] Email dispatched! Email ID: ${emailId}`);
    return { success: true, id: emailId, provider: 'resend' };
  } catch (err) {
    console.error(`❌ [RESEND SDK EXCEPTION]`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 2. Sends a Security Password Changed Confirmation Email via Resend SDK
 */
export async function sendPasswordChangedConfirmationEmail(toEmail, userName = 'Valued User') {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; background-color: #09090B; color: #FFFFFF; padding: 24px; }
        .card { max-width: 500px; margin: 0 auto; background: #18181B; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; }
        .logo { font-size: 20px; font-weight: 900; color: #22C55E; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: 800; margin-bottom: 12px; }
        .text { font-size: 13px; color: #A1A1AA; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">S SpendPilot</div>
        <div class="title">Password Changed Successfully</div>
        <p class="text">Hi ${userName},</p>
        <p class="text">Your SpendPilot account password was changed successfully. If you initiated this change, no action is required.</p>
        <p class="text">If you did not perform this change, please reset your password immediately.</p>
      </div>
    </body>
    </html>
  `;

  if (!resend) return { success: true };

  try {
    await resend.emails.send({
      from: emailFrom,
      to: toEmail,
      subject: '✅ SpendPilot Password Changed Successfully',
      html: htmlContent
    });
    return { success: true };
  } catch (err) {
    console.error(`❌ [RESEND CONFIRMATION ERROR]`, err.message);
    return { success: false };
  }
}
