import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { LogoMark } from '../components/Logo';

export function ResetPassword({ token: propToken, onNavigate }) {
  const { showSuccess, showError } = useToast();
  const [token, setToken] = useState(propToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenStatus, setTokenStatus] = useState('verifying'); // 'verifying' | 'valid' | 'expired' | 'used' | 'invalid'
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let activeToken = propToken;

    if (!activeToken) {
      // Check query parameter ?token=...
      const params = new URLSearchParams(window.location.search);
      activeToken = params.get('token');

      if (!activeToken) {
        // Check URL path e.g. /reset-password/abc123
        const pathParts = window.location.pathname.split('/');
        const resetIdx = pathParts.indexOf('reset-password');
        if (resetIdx !== -1 && pathParts[resetIdx + 1]) {
          activeToken = pathParts[resetIdx + 1];
        }
      }
    }

    if (activeToken) {
      setToken(activeToken);
      verifyToken(activeToken);
    } else {
      setIsVerifying(false);
      setTokenStatus('invalid');
      setStatusMessage('Invalid password reset link.');
    }
  }, [propToken]);

  const verifyToken = async (tok) => {
    setIsVerifying(true);
    try {
      const res = await api.verifyResetToken({ token: tok });
      if (res.success && res.valid) {
        setTokenStatus('valid');
      } else {
        setTokenStatus('invalid');
        setStatusMessage(res.message || 'Invalid password reset link.');
      }
    } catch (err) {
      const msg = err.message || 'Invalid password reset link.';
      setStatusMessage(msg);
      if (msg.includes('expired')) {
        setTokenStatus('expired');
      } else if (msg.includes('already been used')) {
        setTokenStatus('used');
      } else {
        setTokenStatus('invalid');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!newPassword || newPassword.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.resetPassword({ token, newPassword });
      if (res.success) {
        setCompleted(true);
        showSuccess('Your password has been reset successfully.');
      }
    } catch (err) {
      const msg = err.status === 429
        ? 'Too many reset attempts. Please try again later.'
        : (err.message || 'Unable to reset password. Please request a new link.');
      showError(msg);
      if (msg.includes('expired')) setTokenStatus('expired');
      if (msg.includes('already been used')) setTokenStatus('used');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] flex items-center justify-center p-4 selection:bg-[#19B86A] selection:text-white">
      <div className="w-full max-w-md bg-white border border-[#DDE5DF] rounded-3xl p-8 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <LogoMark className="w-12 h-12 mx-auto" />
          <h2 className="font-display font-extrabold text-2xl text-[#092B20]">
            {completed ? 'Password Reset Successful' : 'Create New Password'}
          </h2>
        </div>

        {isVerifying ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#19B86A] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-[#747B76] font-semibold">Verifying security token...</p>
          </div>
        ) : completed ? (
          <div className="p-6 bg-[#EEF9F2] border border-[#19B86A]/30 rounded-2xl text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-[#19B86A] mx-auto" />
            <p className="text-xs text-[#53635B] leading-relaxed">
              Your SpendPilot password has been updated successfully.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="w-full btn-emerald py-3.5 rounded-xl font-bold text-xs"
            >
              Sign In to SpendPilot
            </button>
          </div>
        ) : tokenStatus !== 'valid' ? (
          <div className="p-6 bg-[#FDF2F2] border border-[#F87171]/30 rounded-2xl text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-[#D94A4A] mx-auto" />
            <p className="text-xs font-bold text-[#D94A4A] leading-relaxed">
              {tokenStatus === 'expired' && 'This password reset link has expired.'}
              {tokenStatus === 'used' && 'This password reset link has already been used.'}
              {tokenStatus === 'invalid' && (statusMessage || 'Invalid password reset link.')}
            </p>
            <button
              onClick={() => onNavigate('forgot-password')}
              className="w-full btn-forest py-3 rounded-xl font-bold text-xs"
            >
              Request New Reset Link
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#747B76] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F6F0] border border-[#DDE5DF] text-[#092B20] placeholder-[#747B76] focus:outline-none focus:border-[#19B86A] text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#747B76] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F6F0] border border-[#DDE5DF] text-[#092B20] placeholder-[#747B76] focus:outline-none focus:border-[#19B86A] text-xs font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-emerald py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
