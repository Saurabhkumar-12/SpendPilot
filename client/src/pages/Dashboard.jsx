import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Bell, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft,
  TrendingUp, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Zap, 
  ChevronRight,
  User,
  Sparkles,
  Receipt,
  HandCoins,
  PiggyBank,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Tooltip 
} from 'recharts';

import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { SummaryCard } from '../components/SummaryCard';
import { CardSkeleton, ListSkeleton } from '../components/Skeletons';

const CHART_COLORS = ['#19B86A', '#2ED47A', '#E8A317', '#747B76', '#092B20'];

export function Dashboard({ onNavigate, onAddExpense }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const currency = user?.preferences?.currency || '₹';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseFilter, setExpenseFilter] = useState('All');

  useEffect(() => {
    fetchDashboard();

    if (socket) {
      const handleRealtimeEvent = () => {
        fetchDashboard();
      };
      socket.on('group:realtime-event', handleRealtimeEvent);
      return () => {
        socket.off('group:realtime-event', handleRealtimeEvent);
      };
    }
  }, [socket]);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboardSummary();
      if (res.success) {
        setData(res.data);
        if (res.data.recentExpenses?.length > 0) {
          setSelectedExpense(res.data.recentExpenses[0]);
        }
      }
    } catch (e) {
      console.error('Error loading dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <ListSkeleton rows={5} />
      </div>
    );
  }

  // Real backend calculations only - zero fake numbers
  const summary = data?.summary || {
    totalExpenses: 0,
    monthlyExpenses: 0,
    amountOwe: 0,
    amountReceive: 0
  };
  
  const recentExpenses = data?.recentExpenses || [];
  const recentSettlements = data?.recentSettlements || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const categoryBreakdown = data?.categoryBreakdown || {};

  const pieData = Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value }));
  const hasExpenses = recentExpenses.length > 0;
  const hasTrend = monthlyTrend.some(item => item.amount > 0);

  return (
    <div className="min-h-screen bg-[#F7F6F0] dark:bg-[#071C16] text-[#161A18] dark:text-[#F7FFF9] p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-[#092B20] dark:text-[#F7FFF9]">
            Welcome back, {user?.name || 'Pilot'} 👋
          </h1>
          <p className="text-xs md:text-sm text-[#53635B] dark:text-[#B8C9C0] mt-1">
            Here is your live real-time financial snapshot from your account ledger.
          </p>
        </div>
        <button
          onClick={onAddExpense}
          className="btn-emerald px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition transform hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Spent (This Month)"
          value={`${currency} ${(summary.monthlyExpenses || 0).toLocaleString()}`}
          icon={Receipt}
          actionText="Add Spent"
          onAction={onAddExpense}
        />
        <SummaryCard
          title="You Owe (Group Debt)"
          value={`${currency} ${(summary.amountOwe || 0).toLocaleString()}`}
          icon={ArrowUpRight}
          actionText="Add Debt"
          onAction={() => onNavigate('groups')}
        />
        <SummaryCard
          title="You Receive (Group Receivables)"
          value={`${currency} ${(summary.amountReceive || 0).toLocaleString()}`}
          icon={ArrowDownLeft}
          actionText="Add Bill"
          onAction={() => onNavigate('groups')}
        />
        <SummaryCard
          title="Total Expenses Count"
          value={`${recentExpenses.length} Expenses`}
          icon={CreditCard}
          actionText="Add Expense"
          onAction={onAddExpense}
        />
      </div>

      {/* Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Spending Trend Chart */}
        <div className="lg:col-span-8 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-extrabold text-base text-[#092B20] dark:text-[#F7FFF9]">Monthly Spending Activity</h3>
              <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">Historical expense aggregation from your database records.</p>
            </div>
          </div>

          {hasTrend ? (
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#19B86A" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#19B86A" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#53635B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#53635B" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#092B20', borderRadius: '12px', border: 'none', color: '#FCFCF8', fontSize: '12px' }}
                    formatter={(value) => [`${currency} ${value.toLocaleString()}`, 'Amount']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#19B86A" strokeWidth={3} fillOpacity={1} fill="url(#emeraldGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-[#DDE5DF] dark:border-[#1A4337] rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF9F2] dark:bg-[#071C16] text-[#19B86A] flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[#092B20] dark:text-[#F7FFF9]">No spending activity yet</h4>
              <p className="text-xs text-[#53635B] dark:text-[#B8C9C0] max-w-sm">Your monthly spending trend will appear here automatically when you log your first expense.</p>
              <button onClick={onAddExpense} className="btn-emerald px-4 py-2 rounded-xl text-xs font-bold">
                Add First Expense
              </button>
            </div>
          )}
        </div>

        {/* Category Breakdown Donut */}
        <div className="lg:col-span-4 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display font-extrabold text-base text-[#092B20] dark:text-[#F7FFF9]">Category Breakdown</h3>
            <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">Expense distribution by category.</p>
          </div>

          {pieData.length > 0 ? (
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#092B20', borderRadius: '10px', color: '#FCFCF8', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-[#DDE5DF] dark:border-[#1A4337] rounded-2xl p-4 text-center space-y-2">
              <PieIcon className="w-8 h-8 text-[#53635B]" />
              <p className="text-xs font-semibold text-[#53635B]">No category data</p>
            </div>
          )}

          <div className="space-y-1.5 pt-2 border-t border-[#DDE5DF] dark:border-[#1A4337]">
            {pieData.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                  <span>{entry.name}</span>
                </span>
                <span className="font-mono">{currency} {entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Expenses List */}
      <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-extrabold text-base text-[#092B20] dark:text-[#F7FFF9]">Recent Personal Expenses</h3>
            <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">Your latest logged expense transactions.</p>
          </div>
          <button onClick={() => onNavigate('expenses')} className="text-xs font-bold text-[#19B86A] hover:underline flex items-center gap-1">
            View All Expenses <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {hasExpenses ? (
          <div className="divide-y divide-[#DDE5DF] dark:divide-[#1A4337]">
            {recentExpenses.slice(0, 5).map(exp => (
              <div key={exp.id} className="py-3 flex items-center justify-between text-xs hover:bg-[#EEF9F2]/50 dark:hover:bg-[#071C16]/50 px-3 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF9F2] dark:bg-[#071C16] text-[#19B86A] flex items-center justify-center font-bold">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-[#092B20] dark:text-[#F7FFF9]">{exp.title || exp.description}</p>
                    <p className="text-[10px] text-[#53635B] dark:text-[#B8C9C0]">{exp.category} • {new Date(exp.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="font-extrabold font-mono text-[#092B20] dark:text-[#2ED47A] text-sm">
                  {currency} {(exp.amount || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center border-2 border-dashed border-[#DDE5DF] dark:border-[#1A4337] rounded-2xl space-y-3">
            <Receipt className="w-10 h-10 text-[#53635B] mx-auto" />
            <h4 className="font-bold text-sm text-[#092B20] dark:text-[#F7FFF9]">No expenses recorded yet</h4>
            <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">Start tracking your personal spending by adding your first expense.</p>
            <button onClick={onAddExpense} className="btn-emerald px-4 py-2.5 rounded-xl text-xs font-bold">
              Add Expense Now
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
