import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Receipt, 
  Users, 
  HandCoins, 
  Sparkles, 
  ArrowUpRight, 
  Download, 
  HelpCircle, 
  ChevronDown, 
  PieChart as PieChartIcon, 
  Wallet, 
  RefreshCw,
  Globe,
  Plane,
  Star,
  Zap,
  Lock,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicHeader } from '../components/PublicHeader';
import { ModalPages } from '../components/ModalPages';
import { Logo, LogoMark } from '../components/Logo';

export function LandingPage({ onNavigate }) {
  const [activeModal, setActiveModal] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  
  // Live Currency Converter State
  const [amount, setAmount] = useState('1000');
  const [fromCurr, setFromCurr] = useState('INR');
  const [toCurr, setToCurr] = useState('USD');
  const [convertedResult, setConvertedResult] = useState('11.95');

  const exchangeRates = {
    INR: { USD: 0.01195, EUR: 0.01105, GBP: 0.00945, JPY: 1.84, INR: 1 },
    USD: { INR: 83.68, EUR: 0.925, GBP: 0.791, JPY: 154.2, USD: 1 },
    EUR: { INR: 90.50, USD: 1.081, GBP: 0.855, JPY: 166.7, EUR: 1 },
    GBP: { INR: 105.8, USD: 1.264, EUR: 1.169, JPY: 194.8, GBP: 1 },
    JPY: { INR: 0.543, USD: 0.00648, EUR: 0.0060, GBP: 0.0051, JPY: 1 }
  };

  useEffect(() => {
    const val = parseFloat(amount) || 0;
    const rate = exchangeRates[fromCurr]?.[toCurr] || 1;
    setConvertedResult((val * rate).toFixed(2));
  }, [amount, fromCurr, toCurr]);

  const faqs = [
    {
      q: "How does SpendPilot calculate minimum settlements?",
      a: "SpendPilot uses an optimal debt graph reduction algorithm. Instead of everyone transferring money to everyone else, it calculates the net balance for each person and generates the fewest possible payment transactions to settle the entire group."
    },
    {
      q: "Can I split group expenses unequally or by percentage?",
      a: "Yes. SpendPilot supports Equal splits, Percentage splits (e.g. 50%/30%/20%), and Exact Amount splits for dining, trip accommodation, or utility bills."
    },
    {
      q: "Is my financial information secure?",
      a: "Security is paramount. All data is encrypted using 256-bit SSL, strict JWT authentication, and zero third-party advertisement sharing."
    },
    {
      q: "Can I export my financial reports?",
      a: "Yes. You can generate custom date range summaries and download instant PDF or CSV reports for accounting and tax records."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#161A18] font-sans selection:bg-[#19B86A] selection:text-white">
      
      {/* PUBLIC NAVBAR */}
      <PublicHeader 
        onNavigate={onNavigate} 
        activeModal={activeModal} 
        setActiveModal={setActiveModal} 
      />

      {/* MODAL POPUPS */}
      <ModalPages 
        activeModal={activeModal} 
        onClose={() => setActiveModal(null)} 
        onNavigate={onNavigate} 
      />

      {/* ========================================================
          1. HERO SECTION
         ======================================================== */}
      <section className="relative pt-8 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-gradient-to-b from-[#F7F6F0] via-[#EEF9F2]/60 to-[#F7F6F0]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-6 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DDF5E8] text-[#092B20] text-xs font-extrabold font-mono border border-[#19B86A]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#19B86A]" />
                <span>SMARTER MONEY MANAGEMENT</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display text-[#092B20] tracking-tight leading-[1.08]">
                Track your money.<br />
                <span className="text-[#19B86A]">Split expenses.</span><br />
                Save with confidence.
              </h1>

              <p className="text-lg text-[#53635B] font-medium leading-relaxed max-w-xl">
                SpendPilot brings your personal spending, group expenses, settlements and financial insights into one simple, beautiful place.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button 
                  onClick={() => onNavigate('register')}
                  className="btn-emerald px-8 py-4 rounded-full text-base font-bold flex items-center justify-center gap-3 shadow-lg shadow-[#19B86A]/25 transition transform hover:-translate-y-0.5"
                >
                  <span>Start for Free</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('features');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 rounded-full text-base font-bold text-[#092B20] bg-white border border-[#DDE5DF] hover:bg-[#EEF9F2] transition shadow-sm"
                >
                  Explore Features
                </button>
              </div>

              {/* Secondary Micro-copy */}
              <div className="flex items-center gap-2 text-xs font-bold text-[#53635B] pt-1">
                <CheckCircle2 className="w-4 h-4 text-[#19B86A]" />
                <span>No credit card required</span>
                <span className="mx-2">•</span>
                <ShieldCheck className="w-4 h-4 text-[#19B86A]" />
                <span>Instant Setup</span>
              </div>
            </motion.div>

            {/* Right Graphic Composition */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:col-span-6 relative"
            >
              <div className="relative mx-auto max-w-lg lg:max-w-none rounded-3xl bg-white border border-[#DDE5DF] p-6 md:p-8 shadow-2xl shadow-[#092B20]/10 overflow-hidden">
                <div className="flex items-center justify-between pb-6 border-b border-[#EEF9F2]">
                  <div className="flex items-center gap-3">
                    <LogoMark className="w-11 h-11" />
                    <div>
                      <h4 className="font-extrabold text-base text-[#092B20]">Financial Pilot View</h4>
                      <p className="text-xs text-[#53635B]">Live overview & balance</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#DDF5E8] text-[#092B20] text-xs font-bold font-mono">
                    Active Session
                  </span>
                </div>

                {/* Hero Illustration Graphic */}
                <div className="my-6 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#EEF9F2] border border-[#19B86A]/20">
                    <p className="text-xs font-bold text-[#53635B]">Total Balance</p>
                    <h3 className="text-2xl font-extrabold text-[#092B20] font-display mt-1">₹1,48,250</h3>
                    <span className="text-[11px] font-bold text-[#19B86A] mt-1 inline-block">↑ 18.4% this month</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#092B20] text-[#FCFCF8]">
                    <p className="text-xs font-bold text-[#B8C9C0]">Savings Target</p>
                    <h3 className="text-2xl font-extrabold text-[#2ED47A] font-display mt-1">₹45,000</h3>
                    <span className="text-[11px] font-semibold text-[#B8C9C0] mt-1 inline-block">82% completed</span>
                  </div>
                </div>

                {/* Staggered Floating Cards */}
                <motion.div 
                  animate={{ y: [0, -6, 0] }} 
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-12 right-4 md:right-8 bg-white border border-[#DDE5DF] rounded-2xl p-4 shadow-xl max-w-[200px]"
                >
                  <p className="text-[11px] font-bold text-[#53635B]">Monthly Spending</p>
                  <p className="text-lg font-extrabold text-[#092B20] font-display">₹24,850</p>
                  <span className="text-[10px] font-bold text-[#19B86A]">↓ 12.4% vs last month</span>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 6, 0] }} 
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-8 left-4 md:left-8 bg-[#092B20] text-[#FCFCF8] rounded-2xl p-4 shadow-xl border border-[#1A4337] max-w-[210px]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Plane className="w-3.5 h-3.5 text-[#2ED47A]" />
                    <span className="text-xs font-bold text-[#2ED47A]">Goa Trip</span>
                  </div>
                  <p className="text-xs font-medium text-[#B8C9C0]">You receive</p>
                  <p className="text-base font-extrabold text-[#FCFCF8] font-display">₹2,450</p>
                </motion.div>

                <div className="p-4 rounded-2xl bg-[#F7F6F0] border border-[#DDE5DF] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#19B86A] text-white flex items-center justify-center font-bold text-sm">
                      86
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#092B20]">Financial Health</p>
                      <p className="text-[11px] text-[#53635B]">Excellent score rating</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#19B86A] font-mono">86 / 100</span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ========================================================
          2. SYSTEM CAPABILITIES BANNER
         ======================================================== */}
      <section className="py-10 bg-white border-y border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 text-center space-y-6">
          <p className="text-xs font-bold tracking-widest text-[#092B20] uppercase font-mono">
            SMARTER FINANCIAL CONTROL • TRANSPARENT PLATFORM GUARANTEES
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="p-4 rounded-2xl bg-[#EEF9F2] border border-[#19B86A]/20 space-y-1">
              <h4 className="font-extrabold text-sm text-[#092B20]">Minimum Debt Engine</h4>
              <p className="text-xs text-[#53635B]">Optimizes peer-to-peer debt paths into fewest transfers.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#EEF9F2] border border-[#19B86A]/20 space-y-1">
              <h4 className="font-extrabold text-sm text-[#092B20]">Multi-Split Modes</h4>
              <p className="text-xs text-[#53635B]">Equal, Percentage & Exact Share calculations.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#EEF9F2] border border-[#19B86A]/20 space-y-1">
              <h4 className="font-extrabold text-sm text-[#092B20]">Live FX Multi-Currency</h4>
              <p className="text-xs text-[#53635B]">Convert ₹, $, €, £, ¥ with live rate estimates.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#EEF9F2] border border-[#19B86A]/20 space-y-1">
              <h4 className="font-extrabold text-sm text-[#092B20]">Privacy First</h4>
              <p className="text-xs text-[#53635B]">Zero third-party tracking, 256-bit SSL encrypted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. FEATURE CARDS (DEEP FOREST DARK CARDS WITH HIGH CONTRAST)
         ======================================================== */}
      <section id="features" className="py-24 bg-[#F7F6F0]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DDF5E8] text-[#092B20] text-xs font-extrabold font-mono border border-[#19B86A]/30">
              CORE CAPABILITIES
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold font-display text-[#092B20] tracking-tight">
              Everything you need<br />to manage money smarter.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Feature 1: Personal Expenses */}
            <div className="lg:col-span-7 card-editorial p-8 bg-[#092B20] text-[#FCFCF8] space-y-6 flex flex-col justify-between border border-[#1A4337]">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#19B86A]/20 text-[#2ED47A] flex items-center justify-center border border-[#19B86A]/30">
                  <Receipt className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold uppercase text-[#2ED47A] font-mono tracking-wider">PERSONAL EXPENSES</span>
                <h3 className="text-3xl font-extrabold font-display text-[#FFFFFF]">
                  Know where your money goes.
                </h3>
                <p className="text-sm text-[#B8C9C0] leading-relaxed">
                  Track daily spending, organize expenses and understand your financial habits without complicated spreadsheets.
                </p>
              </div>

              {/* Product Visual: Expense Progress Bar */}
              <div className="p-6 rounded-2xl bg-[#0E2920] border border-[#1A4337] space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-xs font-bold text-[#FCFCF8]">
                  <span>Dining & Outings</span>
                  <span className="text-[#2ED47A] font-mono">₹8,450 / ₹10,000</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#071C16] overflow-hidden p-0.5 border border-[#1A4337]">
                  <div className="h-full bg-[#2ED47A] rounded-full" style={{ width: '84.5%' }}></div>
                </div>
                <p className="text-[11px] text-[#B8C9C0] italic">84.5% of monthly budget utilized</p>
              </div>
            </div>

            {/* Feature 2: Group Expenses */}
            <div className="lg:col-span-5 card-editorial p-8 bg-[#092B20] text-[#FCFCF8] space-y-6 flex flex-col justify-between border border-[#1A4337]">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#19B86A]/20 text-[#2ED47A] flex items-center justify-center border border-[#19B86A]/30">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold uppercase text-[#2ED47A] font-mono tracking-wider">GROUP EXPENSES</span>
                <h3 className="text-3xl font-extrabold font-display text-[#FFFFFF]">
                  Split money without the awkward math.
                </h3>
                <p className="text-sm text-[#B8C9C0] leading-relaxed">
                  Share trips, dinners and everyday expenses with friends, roommates and family.
                </p>
              </div>

              {/* Product Visual: Goa Trip 4 Members */}
              <div className="p-5 rounded-2xl bg-[#0E2920] border border-[#1A4337] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#2ED47A]">Goa Trip (4 Members)</span>
                  <span className="text-[10px] font-mono bg-[#153D30] text-[#2ED47A] px-2 py-0.5 rounded-full border border-[#19B86A]/30">ACTIVE</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-[#071C16] border border-[#1A4337] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#19B86A] text-white text-[10px] font-bold flex items-center justify-center">R</div>
                    <span className="text-[#FCFCF8] truncate">Rahul: ₹8,000</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#071C16] border border-[#1A4337] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#2ED47A] text-[#092B20] text-[10px] font-bold flex items-center justify-center">A</div>
                    <span className="text-[#FCFCF8] truncate">ABC: ₹2,500</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#071C16] border border-[#1A4337] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#E8A317] text-white text-[10px] font-bold flex items-center justify-center">A</div>
                    <span className="text-[#FCFCF8] truncate">Aman: ₹3,200</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#071C16] border border-[#1A4337] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#9CB0A5] text-[#092B20] text-[10px] font-bold flex items-center justify-center">N</div>
                    <span className="text-[#FCFCF8] truncate">Neha: ₹6,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Smart Settlements */}
            <div className="lg:col-span-5 card-editorial p-8 bg-[#092B20] text-[#FCFCF8] space-y-6 flex flex-col justify-between border border-[#1A4337]">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#19B86A]/20 text-[#2ED47A] flex items-center justify-center border border-[#19B86A]/30">
                  <HandCoins className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold uppercase text-[#2ED47A] font-mono tracking-wider">SMART SETTLEMENTS</span>
                <h3 className="text-3xl font-extrabold font-display text-[#FFFFFF]">
                  Know exactly who pays whom.
                </h3>
                <p className="text-sm text-[#B8C9C0] leading-relaxed">
                  Our minimum debt graph algorithm condenses multiple debt paths into the minimum number of payments.
                </p>
              </div>

              {/* Product Visual: Settlement Transfers */}
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-[#0E2920] border border-[#1A4337] flex items-center justify-between text-xs font-bold">
                  <span className="text-[#FCFCF8]">ABC → Rahul</span>
                  <span className="text-[#2ED47A] font-mono">₹1,250</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0E2920] border border-[#1A4337] flex items-center justify-between text-xs font-bold">
                  <span className="text-[#FCFCF8]">Neha → Aman</span>
                  <span className="text-[#2ED47A] font-mono">₹840</span>
                </div>
              </div>
            </div>

            {/* Feature 4: AI Insights */}
            <div className="lg:col-span-7 card-editorial p-8 bg-[#092B20] text-[#FCFCF8] space-y-6 flex flex-col justify-between border border-[#1A4337]">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#19B86A]/20 text-[#2ED47A] flex items-center justify-center border border-[#19B86A]/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold uppercase text-[#2ED47A] font-mono tracking-wider">AI INSIGHTS</span>
                <h3 className="text-3xl font-extrabold font-display text-[#FFFFFF]">
                  Turn spending data into better decisions.
                </h3>
                <p className="text-sm text-[#B8C9C0] leading-relaxed">
                  Get automated budget recommendations, health scores, and personalized savings opportunities powered by intelligent analytics.
                </p>
              </div>

              {/* Product Visual: Health Score & Savings */}
              <div className="p-5 rounded-2xl bg-[#0E2920] border border-[#1A4337] space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#1A4337]">
                  <div>
                    <span className="text-[10px] font-bold text-[#B8C9C0] uppercase font-mono">FINANCIAL HEALTH</span>
                    <h4 className="text-xl font-extrabold text-[#2ED47A] font-display">86 / 100</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#B8C9C0] uppercase font-mono">POTENTIAL SAVINGS</span>
                    <h4 className="text-xl font-extrabold text-[#2ED47A] font-display">₹4,200</h4>
                  </div>
                </div>
                <p className="text-xs text-[#B8C9C0] leading-relaxed italic">
                  "AI Insight: Reducing food delivery orders by 20% this month can save ₹2,100 towards your savings goal."
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          4. GROUP EXPENSES CASE STUDY (GOA TRIP)
         ======================================================== */}
      <section id="group-expenses" className="py-24 bg-[#092B20] text-[#FCFCF8]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#153D30] text-[#2ED47A] text-xs font-bold font-mono border border-[#19B86A]/30">
                CASE STUDY
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold font-display text-[#FFFFFF] leading-tight">
                Goa Trip Bill Split Ledger
              </h2>
              <p className="text-sm text-[#B8C9C0] leading-relaxed">
                4 friends spent ₹19,700 on villas, dining, and fuel. SpendPilot automatically simplified 12 complex debt links into just 2 minimal settlements.
              </p>
              <button 
                onClick={() => onNavigate('register')}
                className="btn-emerald px-8 py-3.5 rounded-full text-sm font-bold inline-flex items-center gap-2"
              >
                <span>Create Group Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="lg:col-span-7 card-editorial p-8 bg-[#0E2920] border border-[#1A4337] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#1A4337]">
                <h4 className="font-extrabold text-base text-[#FCFCF8]">Goa Vacation Expenses</h4>
                <span className="text-xs font-mono font-bold text-[#2ED47A]">Total: ₹19,700</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#071C16] border border-[#1A4337]">
                  <p className="font-bold text-[#FCFCF8]">Rahul</p>
                  <p className="text-[#2ED47A] font-mono mt-1">Paid ₹8,000</p>
                </div>
                <div className="p-3 rounded-xl bg-[#071C16] border border-[#1A4337]">
                  <p className="font-bold text-[#FCFCF8]">ABC</p>
                  <p className="text-[#2ED47A] font-mono mt-1">Paid ₹2,500</p>
                </div>
                <div className="p-3 rounded-xl bg-[#071C16] border border-[#1A4337]">
                  <p className="font-bold text-[#FCFCF8]">Aman</p>
                  <p className="text-[#2ED47A] font-mono mt-1">Paid ₹3,200</p>
                </div>
                <div className="p-3 rounded-xl bg-[#071C16] border border-[#1A4337]">
                  <p className="font-bold text-[#FCFCF8]">Neha</p>
                  <p className="text-[#2ED47A] font-mono mt-1">Paid ₹6,000</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#071C16] border border-[#19B86A]/30 space-y-2">
                <span className="text-[10px] font-extrabold text-[#2ED47A] uppercase font-mono tracking-wider">MINIMUM SETTLEMENT OUTPUT</span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-[#FCFCF8] gap-2">
                  <span>ABC → Rahul: ₹2,425</span>
                  <span>Aman → Rahul: ₹1,725</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          5. LIVE CURRENCY CONVERTER SECTION
         ======================================================== */}
      <section className="py-24 bg-white border-t border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase font-mono text-[#19B86A]">LIVE FX CONVERTER</span>
            <h2 className="text-3xl md:text-5xl font-extrabold font-display text-[#092B20]">
              Multi-Currency Exchange Calculator
            </h2>
            <p className="text-sm text-[#53635B]">
              Instantly calculate group splits and international expense values across major global currencies.
            </p>
          </div>

          <div className="max-w-xl mx-auto card-editorial p-8 bg-[#F7F6F0] space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-2">Amount</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#DDE5DF] font-bold text-lg text-[#092B20] focus:outline-none focus:border-[#19B86A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-2">From</label>
                  <select 
                    value={fromCurr} 
                    onChange={(e) => setFromCurr(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#DDE5DF] font-bold text-sm text-[#092B20]"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#092B20] uppercase tracking-wider mb-2">To</label>
                  <select 
                    value={toCurr} 
                    onChange={(e) => setToCurr(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#DDE5DF] font-bold text-sm text-[#092B20]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#092B20] text-[#FCFCF8] text-center space-y-1">
              <span className="text-xs font-bold text-[#B8C9C0] uppercase font-mono">CONVERTED VALUE</span>
              <h3 className="text-3xl font-extrabold text-[#2ED47A] font-display">
                {toCurr === 'INR' ? '₹' : toCurr === 'USD' ? '$' : toCurr === 'EUR' ? '€' : toCurr === 'GBP' ? '£' : '¥'} {convertedResult}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. COMMUNITY REVIEWS
         ======================================================== */}
      <section className="py-24 bg-[#F7F6F0] border-t border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase font-mono text-[#19B86A]">COMMUNITY REVIEWS</span>
            <h2 className="text-3xl md:text-5xl font-extrabold font-display text-[#092B20]">
              Loved by travelers & roommates.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-editorial p-6 bg-white space-y-4">
              <div className="flex text-[#E8A317] gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-sm text-[#161A18] leading-relaxed">
                "SpendPilot made our Goa trip group expenses incredibly easy. We stopped arguing over who paid for dinner."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-[#092B20] text-white flex items-center justify-center font-bold text-sm">
                  RS
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#092B20]">Rahul Sharma</h4>
                  <p className="text-xs text-[#53635B]">Frequent Traveler</p>
                </div>
              </div>
            </div>

            <div className="card-editorial p-6 bg-white space-y-4">
              <div className="flex text-[#E8A317] gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-sm text-[#161A18] leading-relaxed">
                "Managing roommate wifi, rent, and groceries used to be a hassle. SpendPilot's settlement engine saves hours."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-[#19B86A] text-white flex items-center justify-center font-bold text-sm">
                  AP
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#092B20]">Ananya Patel</h4>
                  <p className="text-xs text-[#53635B]">College Student</p>
                </div>
              </div>
            </div>

            <div className="card-editorial p-6 bg-white space-y-4">
              <div className="flex text-[#E8A317] gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-sm text-[#161A18] leading-relaxed">
                "The AI insights identified ₹4,000 of unnecessary subscription spending in my first month."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-[#092B20] text-white flex items-center justify-center font-bold text-sm">
                  VK
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#092B20]">Vikram Kapoor</h4>
                  <p className="text-xs text-[#53635B]">Software Engineer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. FAQ ACCORDION
         ======================================================== */}
      <section className="py-24 bg-white border-t border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase font-mono text-[#19B86A]">GOT QUESTIONS?</span>
            <h2 className="text-3xl md:text-5xl font-extrabold font-display text-[#092B20]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="card-editorial bg-[#F7F6F0] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between font-extrabold text-base text-[#092B20] hover:text-[#19B86A] transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-[#19B86A]' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 text-sm text-[#53635B] leading-relaxed border-t border-[#DDE5DF] pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          8. FINAL CTA & FOOTER
         ======================================================== */}
      <section className="py-24 bg-[#092B20] text-[#FCFCF8] relative overflow-hidden">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold font-display text-[#FFFFFF] tracking-tight">
            Ready for stress-free money management?
          </h2>
          <p className="text-base text-[#B8C9C0] max-w-xl mx-auto">
            Join thousands of users tracking personal budgets and splitting group expenses with zero awkward math.
          </p>
          <button 
            onClick={() => onNavigate('register')}
            className="btn-emerald px-10 py-4 rounded-full text-base font-bold inline-flex items-center gap-3 shadow-xl"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#071C16] text-[#FCFCF8] py-16 border-t border-[#1A4337]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 space-y-4">
              <Logo light={true} />
              <p className="text-xs text-[#B8C9C0] leading-relaxed max-w-sm">
                Track. Split. Save. The modern financial control suite for individuals and group expenses.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#FCFCF8] uppercase font-mono tracking-wider">Product</h4>
              <ul className="space-y-2 text-xs font-medium">
                <li><a href="#features" className="hover:text-[#2ED47A]">Features</a></li>
                <li><a href="#group-expenses" className="hover:text-[#2ED47A]">Groups</a></li>
                <li><a href="#ai-insights" className="hover:text-[#2ED47A]">AI Insights</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#FCFCF8] uppercase font-mono tracking-wider">Company</h4>
              <ul className="space-y-2 text-xs font-medium">
                <li><button onClick={() => setActiveModal('about')} className="hover:text-[#2ED47A]">About Us</button></li>
                <li><button onClick={() => setActiveModal('contact')} className="hover:text-[#2ED47A]">Contact</button></li>
                <li><button onClick={() => setActiveModal('blog')} className="hover:text-[#2ED47A]">Blog</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#FCFCF8] uppercase font-mono tracking-wider">Legal</h4>
              <ul className="space-y-2 text-xs font-medium">
                <li><button onClick={() => setActiveModal('privacy')} className="hover:text-[#2ED47A]">Privacy Policy</button></li>
                <li><button onClick={() => setActiveModal('terms')} className="hover:text-[#2ED47A]">Terms of Service</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1A4337] flex flex-col md:flex-row items-center justify-between text-xs text-[#B8C9C0] gap-4">
            <p>© {new Date().getFullYear()} SpendPilot Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
