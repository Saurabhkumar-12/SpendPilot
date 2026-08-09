import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, KeyRound, Lock } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/Logo';

export function ForgotPassword({ onNavigate }) {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'pin'
  const [email, setEmail] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [directResetUrl, setDirectResetUrl] = useState('');
  const [resetCompleted, setResetCompleted] = useState(false);

  const handleSendResetEmail = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      if (res.success) {
        setEmailSent(true);
        if (res.resetLink) setDirectResetUrl(res.resetLink);
        showSuccess('Password reset instructions generated!');
      }
    } catch (err) {
      showError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinReset = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }
    if (!recoveryPin || recoveryPin.trim().length < 4) {
      showError('Please enter your 6-digit Security Recovery PIN.');
      return;
    }
    if (!newPassword || newPassword.trim().length < 6) {
      showError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword({
        email: email.trim(),
        recoveryPin: recoveryPin.trim(),
        newPassword: newPassword.trim()
      });
      if (res.success) {
        setResetCompleted(true);
        showSuccess('Password updated successfully! You can now log in.');
      }
    } catch (err) {
      showError(err.message || 'Incorrect Security PIN or email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] flex selection:bg-[#19B86A] selection:text-white">
      
      {/* Split Screen Left */}
      <div className="hidden lg:flex w-1/2 bg-[#092B20] text-[#FCFCF8] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#19B86A]/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-[#2ED47A]/10 blur-3xl"></div>

        <div 
          onClick={() => onNavigate('landing')}
          className="cursor-pointer relative z-10"
        >
          <Logo className="h-9" light={true} />
        </div>

        <div className="space-y-8 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#153D30] text-[#2ED47A] text-xs font-bold font-mono border border-[#19B86A]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ACCOUNT RECOVERY</span>
          </div>

          <h1 className="text-4xl font-extrabold font-display leading-tight text-[#FCFCF8]">
            Recover access to your financial dashboard safely.
          </h1>

          <p className="text-sm text-[#9CB0A5] leading-relaxed">
            Choose between requesting an email reset link or using your 6-digit Security Recovery PIN for instant account recovery.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-[#9CB0A5] font-semibold relative z-10">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#2ED47A]" /> 256-Bit Encrypted Recovery</span>
        </div>
      </div>

      {/* Split Screen Right */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6 bg-white p-8 md:p-10 rounded-3xl border border-[#DDE5DF] shadow-xl">
          
          <div className="space-y-2 text-center lg:text-left">
            <Logo className="h-8 mb-4 lg:hidden mx-auto" />
            <h2 className="text-3xl font-extrabold font-display text-[#092B20]">Account Recovery</h2>
            <p className="text-xs text-[#747B76]">Reset your password using email or your security PIN.</p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#F7F6F0] rounded-xl border border-[#DDE5DF]">
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'email' ? 'bg-white text-[#092B20] shadow-sm' : 'text-[#747B76] hover:text-[#092B20]'
              }`}
            >
              Email Reset Link
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pin')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'pin' ? 'bg-white text-[#092B20] shadow-sm' : 'text-[#747B76] hover:text-[#092B20]'
              }`}
            >
              Security PIN Reset
            </button>
          </div>

          {resetCompleted ? (
            <div className="p-6 bg-[#EEF9F2] border border-[#19B86A]/30 rounded-2xl text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 text-[#19B86A] mx-auto" />
              <h3 className="font-display font-bold text-lg text-[#092B20]">Password Updated!</h3>
              <p className="text-xs text-[#747B76]">
                Your password has been changed successfully.
              </p>
              <button
                onClick={() => onNavigate('login')}
                className="w-full btn-emerald py-3.5 rounded-xl text-xs font-bold"
              >
                Sign In to SpendPilot
              </button>
            </div>
          ) : activeTab === 'email' ? (
            emailSent ? (
              <div className="p-6 bg-[#EEF9F2] border border-[#19B86A]/30 rounded-2xl text-center space-y-4">
                <CheckCircle2 className="w-10 h-10 text-[#19B86A] mx-auto" />
                <h3 className="font-display font-bold text-lg text-[#092B20]">Reset Link Dispatched!</h3>
                <p className="text-xs text-[#747B76] leading-relaxed">
                  Instructions sent to <strong className="text-[#092B20]">{email}</strong>.
                </p>

                {directResetUrl && (
                  <div className="pt-2">
                    <a
                      href={directResetUrl}
                      className="inline-block text-xs text-[#19B86A] font-bold underline hover:opacity-80"
                    >
                      Click here to reset password directly →
                    </a>
                  </div>
                )}

                <button
                  onClick={() => onNavigate('login')}
                  className="w-full btn-emerald py-3.5 rounded-xl text-xs font-bold mt-2"
                >
                  Return to Log In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResetEmail} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-2">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#747B76] absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="saurabh@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F6F0] border border-[#DDE5DF] text-[#092B20] placeholder-[#747B76] focus:outline-none focus:border-[#19B86A] text-xs font-semibold transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-emerald py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handlePinReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#747B76] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="saurabh@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F6F0] border border-[#DDE5DF] text-[#092B20] placeholder-[#747B76] focus:outline-none focus:border-[#19B86A] text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-1.5">6-Digit Security PIN</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#747B76] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value)}
                    placeholder="e.g. 658154"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F6F0] border border-[#DDE5DF] text-[#092B20] placeholder-[#747B76] focus:outline-none focus:border-[#19B86A] text-xs font-semibold tracking-widest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-1.5">New Password</label>
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
                className="w-full btn-emerald py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Resetting Password...' : 'Reset Password Now'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="text-center pt-4 border-t border-[#DDE5DF] text-xs text-[#747B76]">
            Remembered your password?{' '}
            <button onClick={() => onNavigate('login')} className="text-[#19B86A] font-bold hover:underline">
              Log In
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

