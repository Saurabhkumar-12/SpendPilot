import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/Logo';

export function ForgotPassword({ onNavigate }) {
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email || !email.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await api.forgotPassword({ email: email.trim().toLowerCase() });
      if (res && res.success) {
        setEmailSent(true);
        showSuccess('If an account exists for this email, password reset instructions have been sent.');
      } else {
        const msg = (res && (res.error || res.message)) || 'Unable to connect to SpendPilot server. Please try again.';
        setErrorMessage(msg);
        showError(msg);
      }
    } catch (err) {
      const msg = err.status === 429
        ? 'Too many reset attempts. Please try again later.'
        : (err.message || 'Unable to connect to SpendPilot server. Please try again.');
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
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
            <span>ACCOUNT SECURITY</span>
          </div>

          <h1 className="text-4xl font-extrabold font-display leading-tight text-[#FCFCF8]">
            Recover access to your financial dashboard.
          </h1>

          <p className="text-sm text-[#9CB0A5] leading-relaxed">
            Enter your registered email address and we'll send a secure password recovery link right to your inbox.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-[#9CB0A5] font-semibold relative z-10">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#2ED47A]" /> 256-Bit Encrypted Recovery</span>
        </div>
      </div>

      {/* Split Screen Right */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-10 rounded-3xl border border-[#DDE5DF] shadow-xl">
          
          <div className="space-y-2 text-center lg:text-left">
            <Logo className="h-8 mb-4 lg:hidden mx-auto" />
            <h2 className="text-3xl font-extrabold font-display text-[#092B20]">Forgot Password</h2>
            <p className="text-xs text-[#747B76]">Enter your registered email address below.</p>
          </div>

          {emailSent ? (
            <div className="p-6 bg-[#EEF9F2] border border-[#19B86A]/30 rounded-2xl text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 text-[#19B86A] mx-auto" />
              <h3 className="font-display font-bold text-lg text-[#092B20]">Reset link sent</h3>
              <p className="text-xs text-[#747B76] leading-relaxed">
                Check your inbox for instructions sent to <strong className="text-[#092B20]">{email}</strong>.
              </p>

              <button
                onClick={() => onNavigate('login')}
                className="w-full btn-emerald py-3.5 rounded-xl text-xs font-bold mt-2"
              >
                Return to Log In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendResetEmail} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#F87171]/30 text-[#D94A4A] text-xs font-bold">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-2">Registered Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#747B76] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="saurabh@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F6F0] border border-[#DDE5DF] text-[#092B20] placeholder-[#747B76] focus:outline-none focus:border-[#19B86A] text-xs font-semibold transition disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-emerald py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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
