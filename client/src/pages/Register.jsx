import React, { useState } from 'react';
import { User, Mail, Lock, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/Logo';

export function Register({ onNavigate }) {
  const { loginUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.register({ name, email, password });
      if (res.success && res.token) {
        showSuccess('Account created! Welcome to SpendPilot.');
        loginUser(res.token, res.user);
      }
    } catch (err) {
      showError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] flex selection:bg-[#19B86A] selection:text-white">
      
      {/* Split Screen Left: Brand Visuals */}
      <div className="hidden lg:flex w-1/2 bg-[#092B20] text-[#FCFCF8] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#19B86A]/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-[#2ED47A]/10 blur-3xl"></div>

        <div 
          onClick={() => onNavigate('landing')}
          className="cursor-pointer relative z-10"
        >
          <Logo className="h-11 md:h-12" light={true} />
        </div>

        <div className="space-y-8 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#153D30] text-[#2ED47A] text-xs font-bold font-mono border border-[#19B86A]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>JOIN SPENDPILOT TODAY</span>
          </div>

          <h1 className="text-4xl font-extrabold font-display leading-tight text-[#FCFCF8]">
            Start managing personal and group expenses smarter.
          </h1>

          <ul className="space-y-3 text-sm text-[#9CB0A5] font-medium">
            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#2ED47A]" /> Equal, Percentage & Exact group bill splits</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#2ED47A]" /> Minimum Debt Graph settlement algorithm</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#2ED47A]" /> AI Insights & Monthly savings target meters</li>
          </ul>
        </div>

        <div className="flex items-center gap-6 text-xs text-[#9CB0A5] font-semibold relative z-10">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#2ED47A]" /> No Credit Card Required</span>
          <span>•</span>
          <span>Free Forever Tier</span>
        </div>
      </div>

      {/* Split Screen Right: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-10 rounded-3xl border border-[#DDE5DF] shadow-xl">
          
          <div className="space-y-2 text-center lg:text-left">
            <Logo className="h-8 mb-4 lg:hidden mx-auto" />
            <h2 className="text-3xl font-extrabold font-display text-[#092B20]">Create Account</h2>
            <p className="text-xs text-[#747B76]">Get started with SpendPilot in less than 60 seconds.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#747B76] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ABC"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F6F0] border border-[#DDE5DF] text-[#092B20] placeholder-[#747B76] focus:outline-none focus:border-[#19B86A] text-xs font-semibold transition"
                />
              </div>
            </div>

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
              <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#747B76] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F6F0] border border-[#DDE5DF] text-[#092B20] placeholder-[#747B76] focus:outline-none focus:border-[#19B86A] text-xs font-semibold transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-emerald py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-4 border-t border-[#DDE5DF] text-xs text-[#747B76]">
            Already have an account?{' '}
            <button onClick={() => onNavigate('login')} className="text-[#19B86A] font-bold hover:underline">
              Log In
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
