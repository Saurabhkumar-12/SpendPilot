import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Printer, Receipt } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CardSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';

export function Reports() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = user?.preferences?.currency || '₹';

  const [timeframe, setTimeframe] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [timeframe]);

  const fetchReports = async () => {
    try {
      const res = await api.getReports(timeframe);
      if (res.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.getPersonalExpenses({});
      if (res.success && res.data && res.data.length > 0) {
        const headers = ['Date', 'Category', 'Description', 'Payment Method', `Amount (${currency})`].join(',');
        const rows = res.data.map(e => [
          `"${e.date}"`,
          `"${e.category}"`,
          `"${(e.description || '').replace(/"/g, '""')}"`,
          `"${e.payment_method || 'UPI'}"`,
          e.amount
        ].join(','));

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `SpendPilot_Financial_Report_${timeframe}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccess('Financial report exported as CSV spreadsheet!');
      } else {
        showError('No expenses available to export.');
      }
    } catch (err) {
      showError('Failed to export CSV report.');
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) return <div className="p-6 max-w-7xl mx-auto space-y-6"><CardSkeleton /></div>;

  const topCategories = data?.topCategories || [];
  const totalAmount = data?.totalAmount || 0;
  const hasReportData = topCategories.length > 0 || totalAmount > 0;

  return (
    <div className="min-h-screen bg-[#F7F6F0] dark:bg-[#071C16] text-[#161A18] dark:text-[#F7FFF9] font-sans p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#092B20] dark:text-[#F7FFF9]">Financial Reports</h1>
          <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">Generate and export detailed transaction ledgers.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] p-1 rounded-xl text-xs font-bold">
            {['daily', 'weekly', 'monthly', 'yearly'].map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  timeframe === t ? 'bg-[#092B20] text-[#2ED47A]' : 'text-[#53635B]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-[#EEF9F2] dark:bg-[#071C16] text-[#092B20] dark:text-[#2ED47A] font-bold text-xs border border-[#DDE5DF] dark:border-[#1A4337] flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 rounded-xl bg-[#092B20] text-[#FCFCF8] font-bold text-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
        </div>
      </div>

      {hasReportData ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-display font-extrabold text-base text-[#092B20] dark:text-[#F7FFF9]">Timeframe Spending Summary ({timeframe})</h3>
            <div className="p-6 rounded-2xl bg-[#EEF9F2] dark:bg-[#071C16] border border-[#19B86A]/20">
              <p className="text-xs font-bold text-[#53635B] dark:text-[#B8C9C0] uppercase font-mono">Total Recorded Spending</p>
              <h2 className="text-3xl font-extrabold text-[#092B20] dark:text-[#2ED47A] font-display mt-1">
                {currency} {totalAmount.toLocaleString()}
              </h2>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-display font-extrabold text-base text-[#092B20] dark:text-[#F7FFF9]">Top Categories</h3>
            <div className="space-y-3">
              {topCategories.map(item => (
                <div key={item.category} className="flex justify-between items-center text-xs font-bold p-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337]">
                  <span className="text-[#092B20] dark:text-[#F7FFF9]">{item.category}</span>
                  <span className="text-[#19B86A] dark:text-[#2ED47A] font-mono">{currency} {(item.amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No spending data yet"
          description="Log your expenses to see detailed category reports and download spreadsheet ledgers."
        />
      )}

    </div>
  );
}
