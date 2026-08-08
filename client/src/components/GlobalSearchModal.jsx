import React, { useState, useEffect } from 'react';
import { Search, X, Receipt, Users, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export function GlobalSearchModal({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ personalExpenses: [], groupExpenses: [], groups: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ personalExpenses: [], groupExpenses: [], groups: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.globalSearch(query);
        if (res.success) {
          setResults(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#071C16]/70 backdrop-blur-md flex items-start justify-center pt-20 px-4">
      <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search Header */}
        <div className="p-4 border-b border-[#DDE5DF] dark:border-[#1A4337] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#19B86A] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search expenses, groups, categories, amounts..."
            className="w-full bg-transparent text-[#092B20] dark:text-[#F7FFF9] placeholder-[#747B76] dark:placeholder-[#9CB0A5] focus:outline-none text-sm font-semibold"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-[#747B76] hover:text-[#092B20] dark:hover:text-[#F7FFF9] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {loading && <p className="text-xs text-[#747B76] dark:text-[#9CB0A5] text-center py-6 font-semibold">Searching transactions...</p>}

          {!loading && !query.trim() && (
            <p className="text-xs text-[#747B76] dark:text-[#9CB0A5] text-center py-8">Type a keyword like "Food", "Goa", "Rahul" or "500"</p>
          )}

          {!loading && query.trim() && 
            results.personalExpenses.length === 0 && 
            results.groupExpenses.length === 0 && 
            results.groups.length === 0 && (
            <p className="text-xs text-[#747B76] dark:text-[#9CB0A5] text-center py-6">No matching records found.</p>
          )}

          {/* Groups */}
          {results.groups.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-[#19B86A] uppercase tracking-wider mb-2">Groups</h4>
              <div className="space-y-1.5">
                {results.groups.map(g => (
                  <div
                    key={g.id}
                    onClick={() => { onNavigate('groups'); onClose(); }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] hover:bg-[#EEF9F2] dark:hover:bg-[#153D30] border border-[#DDE5DF] dark:border-[#1A4337] cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-[#19B86A]" />
                      <span className="text-xs font-bold text-[#092B20] dark:text-[#F7FFF9]">{g.name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#747B76]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Expenses */}
          {results.personalExpenses.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-[#19B86A] uppercase tracking-wider mb-2">Personal Expenses</h4>
              <div className="space-y-1.5">
                {results.personalExpenses.map(e => (
                  <div
                    key={e.id}
                    onClick={() => { onNavigate('expenses'); onClose(); }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] hover:bg-[#EEF9F2] dark:hover:bg-[#153D30] border border-[#DDE5DF] dark:border-[#1A4337] cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="w-4 h-4 text-[#19B86A]" />
                      <div>
                        <p className="text-xs font-bold text-[#092B20] dark:text-[#F7FFF9]">{e.description}</p>
                        <span className="text-[10px] text-[#747B76] dark:text-[#9CB0A5]">{e.category} • {e.date}</span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-[#19B86A]">₹{e.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
