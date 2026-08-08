import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { LogoMark } from '../components/Logo';

export function ResetPassword({ onNavigate }) {
  const { showSuccess, showError } = useToast();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const emailParam = params.get('email');
    if (tokenParam) setToken(tokenParam);
    if (emailParam) setEmail(emailParam);
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!token) {
      showError('Missing password reset token from email link.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword({ token, newPassword });
      if (res.success) {
        setCompleted(true);
        showSuccess('Password reset successfully! You can now log in.');
      }
    } catch (err) {
      showError(err.message || 'Password reset link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] flex items-center justify-center p-4 selection:bg-[#19B86A] selection:text-white">
      <div className="w-full max-w-md bg-white border border-[#DDE5DF] rounded-3xl p-8 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <LogoMark className="w-12 h-12 mx-auto" />
          <h2 className="font-display font-extrabold text-2xl text-[#092B20]">Set New Password</h2>
          <p className="text-xs text-[#747B76]">
            Enter a new password for <strong className="text-[#092B20]">{email || 'your account'}</strong>.
          </p>
        </div>

        {completed ? (
          <div className="p-6 bg-[#EEF9F2] border border-[#19B86A]/30 rounded-2xl text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-[#19B86A] mx-auto" />
            <h3 className="font-display font-bold text-lg text-[#092B20]">Password Changed!</h3>
            <p className="text-xs text-[#747B76]">
              Your password has been updated successfully.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="w-full btn-emerald py-3.5 rounded-xl font-bold text-xs"
            >
              Sign In to SpendPilot
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
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F6F0] border border-[#DDE5DF] text-[#092B20] placeholder-[#747B76] focus:outline-none focus:border-[#19B86A] text-xs font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-emerald py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
