import React, { useState, useEffect } from 'react';
import { PiggyBank, Plus, TrendingUp, AlertTriangle, CheckCircle2, X, Edit2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CardSkeleton } from '../components/Skeletons';

const DEFAULT_CATEGORIES = ['Food', 'Travel', 'Fuel', 'Shopping', 'Rent', 'Medical', 'Entertainment', 'Education', 'Others'];

export function Budgets() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = user?.preferences?.currency || '₹';

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [limit, setLimit] = useState('');

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      const [expRes, catRes] = await Promise.all([
        api.getPersonalExpenses(),
        api.getCategories()
      ]);

      const expList = expRes.success ? (expRes.data || []) : [];
      const catList = catRes.success ? (catRes.data || []) : [];

      setExpenses(expList);
      
      const allCatNames = Array.from(new Set([...catList.map(c => c.name), ...DEFAULT_CATEGORIES]));
      setCategories(allCatNames);

      const categorySpentMap = {};
      expList.forEach(item => {
        const cat = item.category || 'General';
        categorySpentMap[cat] = (categorySpentMap[cat] || 0) + (Number(item.amount) || 0);
      });

      // Saved custom limits from localStorage
      const savedLimits = JSON.parse(localStorage.getItem('spendpilot_budget_limits') || '{}');

      const initialBudgets = allCatNames.map((catName, idx) => {
        const spent = categorySpentMap[catName] || 0;
        const capLimit = savedLimits[catName] || Math.max(10000, Math.ceil((spent * 1.5) / 1000) * 1000);
        return {
          id: `b-${idx}`,
          category: catName,
          limit: capLimit,
          spent
        };
      });

      setBudgets(initialBudgets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (categoryName, currentLimit) => {
    setSelectedCategory(categoryName);
    setLimit(currentLimit ? String(currentLimit) : '10000');
    setIsModalOpen(true);
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const targetCat = selectedCategory;
    const newLimit = Number(limit) || 10000;

    // Save to localStorage
    const savedLimits = JSON.parse(localStorage.getItem('spendpilot_budget_limits') || '{}');
    savedLimits[targetCat] = newLimit;
    localStorage.setItem('spendpilot_budget_limits', JSON.stringify(savedLimits));

    const existingIdx = budgets.findIndex(b => b.category === targetCat);
    if (existingIdx >= 0) {
      const updated = [...budgets];
      updated[existingIdx].limit = newLimit;
      setBudgets(updated);
    } else {
      const spentAmount = expenses
        .filter(e => e.category === targetCat)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      setBudgets([
        {
          id: `b-${Date.now()}`,
          category: targetCat,
          limit: newLimit,
          spent: spentAmount
        },
        ...budgets
      ]);
    }

    showSuccess(`Monthly budget cap for ${targetCat} updated to ${currency}${newLimit.toLocaleString()}!`);
    setIsModalOpen(false);
    setLimit('');
  };

  if (loading) return <div className="p-6 max-w-7xl mx-auto space-y-6"><CardSkeleton /><CardSkeleton /></div>;

  return (
    <div className="min-h-screen bg-[#F7F6F0] dark:bg-[#071C16] text-[#161A18] dark:text-[#F7FFF9] font-sans p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#092B20] dark:text-[#F7FFF9]">Monthly Budgets</h1>
          <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">Set custom category limits and avoid unexpected overspending.</p>
        </div>
        <button
          onClick={() => openEditModal('Food', 10000)}
          className="btn-emerald px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Set Category Cap
        </button>
      </div>

      {/* Budget Meters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map(b => {
          const percent = Math.min(100, Math.round((b.spent / b.limit) * 100));
          const isWarning = percent >= 80;
          return (
            <div 
              key={b.id} 
              onClick={() => openEditModal(b.category, b.limit)}
              className="p-6 rounded-3xl bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] space-y-4 shadow-sm hover:border-[#19B86A]/40 cursor-pointer transition transform hover:scale-[1.01] group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-base text-[#092B20] dark:text-[#F7FFF9] group-hover:text-[#19B86A] transition">{b.category}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono ${
                    isWarning ? 'bg-[#FFF8E6] text-[#E8A317]' : 'bg-[#DDF5E8] text-[#092B20] dark:bg-[#071C16] dark:text-[#2ED47A]'
                  }`}>
                    {percent}% Used
                  </span>
                  <Edit2 className="w-3.5 h-3.5 text-[#53635B] opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#53635B] dark:text-[#B8C9C0]">
                  <span>Spent: {currency}{b.spent.toLocaleString()}</span>
                  <span className="text-[#092B20] dark:text-[#F7FFF9]">Cap: {currency}{b.limit.toLocaleString()}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#F7F6F0] dark:bg-[#071C16] overflow-hidden p-0.5 border border-[#DDE5DF] dark:border-[#1A4337]">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isWarning ? 'bg-[#E8A317]' : 'bg-[#19B86A]'}`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Set Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#071C16]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF] dark:border-[#1A4337]">
              <h3 className="font-display font-extrabold text-lg text-[#092B20] dark:text-[#F7FFF9]">Set Budget Cap — {selectedCategory}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-[#53635B]" /></button>
            </div>
            
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Select Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-xs text-[#092B20] dark:text-[#F7FFF9]"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Monthly Limit ({currency})</label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="Enter budget cap amount e.g. 15000"
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-base text-[#092B20] dark:text-[#F7FFF9]"
                />
              </div>

              <button type="submit" className="w-full btn-emerald py-3.5 rounded-xl font-bold text-xs">Save Budget Cap</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
