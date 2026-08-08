import React, { useState, useEffect } from 'react';
import { HandCoins, CheckCircle2, History, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeletons';

export function Settlement() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { socket } = useSocket();
  const currency = user?.preferences?.currency || '₹';

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const [settleModalData, setSettleModalData] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchSettlementData();

    if (socket) {
      const handleRealtimeEvent = () => {
        fetchSettlementData();
      };
      socket.on('group:realtime-event', handleRealtimeEvent);
      return () => {
        socket.off('group:realtime-event', handleRealtimeEvent);
      };
    }
  }, [socket]);

  const fetchSettlementData = async () => {
    try {
      const [pendingRes, historyRes] = await Promise.all([
        api.getPendingSettlements(),
        api.getSettlementHistory()
      ]);

      if (pendingRes.success) setPending(pendingRes.data || []);
      if (historyRes.success) setHistory(historyRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSettlement = async () => {
    if (!settleModalData) return;
    try {
      const res = await api.markAsSettled({
        groupId: settleModalData.groupId,
        payerId: settleModalData.payerId,
        payeeId: settleModalData.payeeId,
        amount: settleModalData.amount,
        notes: notes || 'Settled via SpendPilot'
      });

      if (res.success) {
        showSuccess('Settlement recorded in ledger!');
        setSettleModalData(null);
        setNotes('');
        fetchSettlementData();
      }
    } catch (err) {
      showError(err.message || 'Settlement failed.');
    }
  };

  if (loading) return <div className="p-6"><ListSkeleton rows={4} /></div>;

  return (
    <div className="min-h-screen bg-[#F7F6F0] dark:bg-[#071C16] text-[#161A18] dark:text-[#F7FFF9] font-sans p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl shadow-sm">
        <h1 className="font-display font-extrabold text-2xl text-[#092B20] dark:text-[#F7FFF9]">Settlement Ledger</h1>
        <p className="text-xs text-[#747B76] dark:text-[#9CB0A5]">Track and execute optimized group debt payouts in minimal steps.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#DDE5DF] dark:border-[#1A4337] text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'pending' ? 'border-[#19B86A] text-[#19B86A] dark:text-[#2ED47A]' : 'border-transparent text-[#747B76]'
          }`}
        >
          <HandCoins className="w-4 h-4" /> Pending Debts ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'history' ? 'border-[#19B86A] text-[#19B86A] dark:text-[#2ED47A]' : 'border-transparent text-[#747B76]'
          }`}
        >
          <History className="w-4 h-4" /> Settlement History ({history.length})
        </button>
      </div>

      {/* PENDING TAB */}
      {activeTab === 'pending' && (
        pending.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All Debts Settled!"
            description="You have zero pending balances across all your expense groups."
          />
        ) : (
          <div className="space-y-3">
            {pending.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#092B20] text-[#2ED47A] flex items-center justify-center font-bold">
                    <HandCoins className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#092B20] dark:text-[#F7FFF9]">
                      {item.payerName} → {item.payeeName}
                    </p>
                    <p className="text-xs text-[#747B76] dark:text-[#9CB0A5]">Group: {item.groupName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-lg text-[#19B86A] dark:text-[#2ED47A] font-mono">
                    {currency}{item.amount}
                  </span>
                  <button
                    onClick={() => setSettleModalData(item)}
                    className="btn-emerald px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Mark Settled
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        history.length === 0 ? (
          <EmptyState
            title="No Past Settlements"
            description="Completed payment records will appear here."
          />
        ) : (
          <div className="space-y-3">
            {history.map(item => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#19B86A]" />
                  <div>
                    <p className="font-bold text-sm text-[#092B20] dark:text-[#F7FFF9]">
                      {item.payerName} paid {item.payeeName}
                    </p>
                    <p className="text-xs text-[#747B76] dark:text-[#9CB0A5]">{item.settledAt} • {item.notes}</p>
                  </div>
                </div>
                <span className="font-extrabold text-base text-[#19B86A]">{currency}{item.amount}</span>
              </div>
            ))}
          </div>
        )
      )}

      {/* Confirm Settlement Modal */}
      {settleModalData && (
        <div className="fixed inset-0 z-50 bg-[#071C16]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
              <h3 className="font-display font-extrabold text-lg text-[#092B20] dark:text-[#F7FFF9]">Confirm Settlement</h3>
              <button onClick={() => setSettleModalData(null)}><X className="w-5 h-5 text-[#747B76]" /></button>
            </div>
            
            <p className="text-xs text-[#747B76] dark:text-[#9CB0A5]">
              Confirming that <strong className="text-[#092B20] dark:text-[#F7FFF9]">{settleModalData.payerName}</strong> paid <strong className="text-[#092B20] dark:text-[#F7FFF9]">{settleModalData.payeeName}</strong> the amount of <strong className="text-[#19B86A]">{currency}{settleModalData.amount}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#092B20] uppercase mb-1">Notes / Transaction Reference</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid via GPay / UPI Ref 498234"
                className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] font-semibold text-xs text-[#092B20] dark:text-[#F7FFF9]"
              />
            </div>

            <button onClick={handleExecuteSettlement} className="w-full btn-emerald py-3.5 rounded-xl font-bold text-xs">
              Confirm & Record Settlement
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
