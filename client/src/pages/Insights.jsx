import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  ArrowRightLeft, 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  DollarSign, 
  Globe, 
  ArrowUpDown 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CardSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';

export function Insights() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = user?.preferences?.currency || '₹';

  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Currency Converter State
  const [convertAmount, setConvertAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState('INR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [convertedResult, setConvertedResult] = useState(11.95);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchInsights();
    handleConvert();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await api.getAIInsights();
      if (res.success) {
        setAiData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (e) => {
    if (e) e.preventDefault();
    setConverting(true);
    try {
      const res = await api.convertCurrency(convertAmount, fromCurrency, toCurrency);
      if (res.success) {
        setConvertedResult(res.convertedAmount);
      }
    } catch (err) {
      showError(err.message || 'Currency conversion failed.');
    } finally {
      setConverting(false);
    }
  };

  if (loading) return <div className="p-6 max-w-7xl mx-auto space-y-6"><CardSkeleton /><CardSkeleton /></div>;

  const healthScore = aiData?.healthScore;
  const recommendations = aiData?.recommendations || [];
  const status = aiData?.status || 'Good';

  return (
    <div className="min-h-screen bg-[#F7F6F0] dark:bg-[#071C16] text-[#161A18] dark:text-[#F7FFF9] font-sans p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#19B86A]" />
            <h1 className="font-display font-extrabold text-2xl text-[#092B20] dark:text-[#F7FFF9]">
              AI Financial Insights
            </h1>
          </div>
          <p className="text-xs text-[#53635B] dark:text-[#B8C9C0] mt-1">
            Automated spending risk evaluation and potential savings forecasts based on real account records.
          </p>
        </div>

        <button
          onClick={fetchInsights}
          className="btn-emerald px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh AI Analysis
        </button>
      </div>

      {healthScore !== undefined ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-[#092B20] text-[#FCFCF8] p-8 rounded-3xl space-y-6 shadow-xl border border-[#1A4337] text-center flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#2ED47A] font-mono uppercase tracking-wider">FINANCIAL HEALTH SCORE</span>
              <h3 className="text-5xl font-extrabold font-display text-[#FCFCF8]">{healthScore} / 100</h3>
              <p className="text-xs text-[#B8C9C0]">Based on spending velocity and budget limits.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#071C16] border border-[#1A4337] text-left space-y-1">
              <p className="text-xs font-bold text-[#2ED47A]">Status: {status}</p>
              <p className="text-[11px] text-[#B8C9C0]">Calculated from your logged backend transactions.</p>
            </div>
          </div>

          <div className="lg:col-span-8 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-display font-extrabold text-base text-[#092B20] dark:text-[#F7FFF9]">Actionable Insights</h3>
            
            <div className="space-y-3">
              {recommendations.length > 0 ? (
                recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#EEF9F2] dark:bg-[#071C16] border border-[#19B86A]/30 space-y-1">
                    <span className="text-[10px] font-bold text-[#19B86A] dark:text-[#2ED47A] uppercase font-mono">{rec.title || 'SAVINGS SUGGESTION'}</span>
                    <h4 className="font-extrabold text-sm text-[#092B20] dark:text-[#F7FFF9]">{rec.heading}</h4>
                    <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">{rec.description}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#53635B] dark:text-[#B8C9C0]">
                  No spending anomalies detected. Keep logging expenses to receive tailored savings tips.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Insufficient Expense Data"
          description="Log your daily expenses to unlock AI financial health scores and automated savings suggestions."
        />
      )}

      {/* Currency Converter */}
      <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl space-y-4 shadow-sm">
        <h3 className="font-display font-extrabold text-base text-[#092B20] dark:text-[#F7FFF9] flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#19B86A]" /> Multi-Currency Rate Calculator
        </h3>
        
        <form onSubmit={handleConvert} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Amount</label>
            <input
              type="number"
              value={convertAmount}
              onChange={(e) => setConvertAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-xs text-[#092B20] dark:text-[#F7FFF9]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-xs text-[#092B20] dark:text-[#F7FFF9]"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">To</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-xs text-[#092B20] dark:text-[#F7FFF9]"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={converting}
            className="btn-emerald py-3 rounded-xl font-bold text-xs"
          >
            {converting ? 'Calculating...' : 'Convert Amount'}
          </button>
        </form>

        <div className="p-4 rounded-2xl bg-[#092B20] text-[#FCFCF8] text-center">
          <span className="text-[10px] font-mono font-bold text-[#2ED47A]">ESTIMATED VALUE</span>
          <h3 className="text-2xl font-extrabold font-display text-[#FCFCF8]">
            {toCurrency === 'INR' ? '₹' : toCurrency === 'USD' ? '$' : toCurrency === 'EUR' ? '€' : toCurrency === 'GBP' ? '£' : '¥'} {convertedResult}
          </h3>
        </div>
      </div>

    </div>
  );
}
