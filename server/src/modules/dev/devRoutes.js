import express from 'express';
import { sendTestEmail } from '../../services/emailService.js';
import { config } from '../../config/index.js';

const router = express.Router();

// Development-only test email route
router.post('/test-email', async (req, res) => {
  if (config.env !== 'development') {
    return res.status(403).json({ success: false, error: 'Forbidden in production' });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email parameter is required.' });
    }
    const targetEmail = email.trim().toLowerCase();
    const result = await sendTestEmail(targetEmail);

    if (result.success) {
      return res.json({
        success: true,
        messageId: result.messageId || null,
        provider: result.provider || 'resend'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Email provider failed to deliver message'
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
