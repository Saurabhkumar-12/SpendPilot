import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { LogoMark } from '../components/Logo';

export function VerifyEmail({ onNavigate }) {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    if (!token || !email) {
      setStatus('error');
      setMessage('Verification link is missing required parameters.');
      return;
    }

    api.verifyEmail(token, email)
      .then(res => {
        if (res.success) {
          setStatus('success');
          setMessage(res.message);
        }
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message || 'Verification failed.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F6F0] flex items-center justify-center p-4 selection:bg-[#19B86A] selection:text-white">
      <div className="w-full max-w-md bg-white border border-[#DDE5DF] rounded-3xl p-8 shadow-xl text-center space-y-6">
        <LogoMark className="w-12 h-12 mx-auto" />
        {status === 'verifying' && (
          <div className="py-8 space-y-4">
            <div className="w-10 h-10 border-4 border-[#19B86A] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-[#747B76]">Verifying your account email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="w-12 h-12 text-[#19B86A] mx-auto" />
            <h2 className="font-display font-extrabold text-2xl text-[#092B20]">Email Verified!</h2>
            <p className="text-xs text-[#747B76]">{message}</p>
            <button
              onClick={() => onNavigate('login')}
              className="w-full btn-emerald py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
            >
              Sign In to SpendPilot <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <AlertTriangle className="w-12 h-12 text-[#D94A4A] mx-auto" />
            <h2 className="font-display font-extrabold text-2xl text-[#092B20]">Verification Link Error</h2>
            <p className="text-xs text-[#D94A4A] font-semibold">{message}</p>
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-3.5 rounded-xl bg-[#F7F6F0] text-[#092B20] font-bold text-xs border border-[#DDE5DF]"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
