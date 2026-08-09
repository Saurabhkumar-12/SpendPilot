import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/Logo';

export function Login({ onNavigate }) {
  const { loginUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      showError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({ email: cleanEmail, password: cleanPassword, rememberMe });
      if (res.success) {
        showSuccess('Welcome back to SpendPilot!');
        loginUser(res.token, res.user);
        onNavigate('dashboard');
      }
    } catch (err) {
      showError(err.message || 'Login failed. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] flex selection:bg-[#19B86A] selection:text-white">
      
      {/* Split Screen Left: Brand Story & Visuals */}
      <div className="hidden lg:flex w-1/2 bg-[#092B20] text-[#FCFCF8] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Subtle Gradient Glow */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#19B86A]/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-[#2ED47A]/10 blur-3xl"></div>

        {/* Brand Header */}
        <div 
          onClick={() => onNavigate('landing')}
          className="cursor-pointer relative z-10"
        >
          <Logo className="h-11 md:h-12" light={true} />
        </div>

        {/* Hero Visual Card */}
        <div className="space-y-8 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#153D30] text-[#2ED47A] text-xs font-bold font-mono border border-[#19B86A]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FINANCIAL CONFIDENCE</span>
          </div>

          <h1 className="text-4xl font-extrabold font-display leading-tight text-[#FCFCF8]">
            Welcome back to intelligent financial control.
          </h1>

          <p className="text-sm text-[#9CB0A5] leading-relaxed">
            Log in to view your live personal spending analytics, group expense balances, and automated minimum debt settlement suggestions.
          </p>

          <div className="p-6 rounded-3xl bg-[#0E2920] border border-[#1A4337] space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs font-bold text-[#9CB0A5]">
              <span>MONTHLY SAVINGS TARGET</span>
              <span className="text-[#2ED47A]">₹45,000 / ₹50,000</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#071C16] overflow-hidden p-0.5 border border-[#1A4337]">
              <div className="h-full bg-[#2ED47A] rounded-full" style={{ width: '90%' }}></div>
            </div>
            <p className="text-[11px] text-[#9CB0A5] italic">"You are 90% towards your monthly goal!"</p>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-6 text-xs text-[#9CB0A5] font-semibold relative z-10">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#2ED47A]" /> 256-Bit SSL Encryption</span>
          <span>•</span>
          <span>Zero Third-Party Tracking</span>
        </div>
      </div>

      {/* Split Screen Right: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-10 rounded-3xl border border-[#DDE5DF] shadow-xl">
          
          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <Logo className="h-8 mb-4 lg:hidden mx-auto" />
            <h2 className="text-3xl font-extrabold font-display text-[#092B20]">Log In</h2>
            <p className="text-xs text-[#747B76]">Enter your credentials to access your SpendPilot workspace.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#747B76] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="abc@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F6F0] border border-[#DDE5DF] text-[#092B20] placeholder-[#747B76] focus:outline-none focus:border-[#19B86A] text-xs font-semibold transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-xs text-[#19B86A] hover:underline font-bold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#747B76] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F6F0] border border-[#DDE5DF] text-[#092B20] placeholder-[#747B76] focus:outline-none focus:border-[#19B86A] text-xs font-semibold transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-[#747B76] font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#DDE5DF] text-[#19B86A] focus:ring-0"
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-emerald py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              {loading ? 'Signing In...' : 'Log In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>



          {/* Footer */}
          <div className="text-center pt-4 border-t border-[#DDE5DF] text-xs text-[#747B76]">
            Don't have an account?{' '}
            <button onClick={() => onNavigate('register')} className="text-[#19B86A] font-bold hover:underline">
              Create an account
            </button>
          </div>

          <div className="text-center">
            <button onClick={() => onNavigate('landing')} className="text-xs font-bold text-[#092B20] hover:underline">
              ← Return to Home Website
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
