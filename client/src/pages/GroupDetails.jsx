import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  UserPlus, 
  Users, 
  Receipt, 
  HandCoins, 
  Trash2, 
  X, 
  CheckCircle2,
  Percent,
  Calculator,
  AlertCircle,
  AlertTriangle,
  Edit2,
  Check,
  Divide,
  Share2,
  Copy
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeletons';

export function GroupDetails({ groupId, onBack }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { socket, joinGroupRoom } = useSocket();
  const currency = user?.preferences?.currency || '₹';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');

  // Add/Edit Expense Modal State
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidById, setPaidById] = useState(user?.id || '');
  const [notes, setNotes] = useState('');
  const [splitType, setSplitType] = useState('EQUAL'); // 'EQUAL', 'CUSTOM', 'PERCENTAGE'

  // Selected participants set: Set of userIds
  const [selectedParticipants, setSelectedParticipants] = useState(new Set());
  // Participant values map: { [userId]: { amountOwed: string/number, percentage: string/number, isManual: boolean } }
  const [participantSplits, setParticipantSplits] = useState({});

  // Invite Member Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  // Delete Group Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [groupId]);

  const fetchDetails = async () => {
    try {
      const res = await api.getGroupDetails(groupId);
      if (res.success) {
        setData(res.data);
        const membersList = res.data.members || [];
        setPaidById(user?.id || (membersList[0]?.userId || ''));
      }
    } catch (e) {
      showError(e.message || 'Failed to fetch group details.');
    } finally {
      setLoading(false);
    }
  };

  const group = data?.group;
  const members = data?.members || [];
  const expenses = data?.expenses || [];
  const suggestedSettlements = data?.suggestedSettlements || [];
  const userRole = data?.userRole || 'MEMBER';

  // Initialize Modal for New Bill or Edit Bill
  const openExpenseModal = (expenseToEdit = null) => {
    const allMemberIds = new Set(members.map(m => m.userId));

    if (expenseToEdit) {
      setEditingExpenseId(expenseToEdit.id);
      setAmount(String(expenseToEdit.amount));
      setDescription(expenseToEdit.description);
      setCategory(expenseToEdit.category || 'Food');
      setDate(expenseToEdit.date || new Date().toISOString().split('T')[0]);
      setPaidById(expenseToEdit.paid_by_id || user?.id);
      setNotes(expenseToEdit.notes || '');
      setSplitType(expenseToEdit.split_type || 'EQUAL');

      const splitUserIds = new Set((expenseToEdit.splits || []).map(s => s.user_id));
      setSelectedParticipants(splitUserIds);

      const initMap = {};
      (expenseToEdit.splits || []).forEach(s => {
        initMap[s.user_id] = {
          amountOwed: String(s.amount_owed),
          percentage: String(s.percentage || 0),
          isManual: true
        };
      });
      setParticipantSplits(initMap);
    } else {
      setEditingExpenseId(null);
      setAmount('');
      setDescription('');
      setCategory('Food');
      setDate(new Date().toISOString().split('T')[0]);
      setPaidById(user?.id || members[0]?.userId || '');
      setNotes('');
      setSplitType('EQUAL');
      setSelectedParticipants(allMemberIds);

      const initMap = {};
      members.forEach(m => {
        initMap[m.userId] = { amountOwed: '', percentage: '', isManual: false };
      });
      setParticipantSplits(initMap);
    }

    setIsAddExpenseOpen(true);
  };

  // Toggle participant inclusion
  const toggleParticipant = (userId) => {
    const updated = new Set(selectedParticipants);
    if (updated.has(userId)) {
      if (updated.size <= 1) {
        showError('At least 1 participant must be selected.');
        return;
      }
      updated.delete(userId);
    } else {
      updated.add(userId);
    }
    setSelectedParticipants(updated);
    recalculateSplits(amount, splitType, updated, participantSplits);
  };

  // Recalculate splits automatically
  const recalculateSplits = (totalAmtStr, mode, activeParticipantsSet, currentSplitsMap) => {
    const numAmt = Number(totalAmtStr) || 0;
    const activeIds = Array.from(activeParticipantsSet);
    if (activeIds.length === 0) return;

    const totalPaise = Math.round(numAmt * 100);

    if (mode === 'EQUAL') {
      const basePaise = Math.floor(totalPaise / activeIds.length);
      const remainderPaise = totalPaise % activeIds.length;
      const equalPct = Math.round((100 / activeIds.length) * 100) / 100;

      const updated = { ...currentSplitsMap };
      members.forEach(m => {
        if (activeParticipantsSet.has(m.userId)) {
          const idx = activeIds.indexOf(m.userId);
          const sharePaise = basePaise + (idx < remainderPaise ? 1 : 0);
          updated[m.userId] = {
            amountOwed: (sharePaise / 100).toFixed(2),
            percentage: String(equalPct),
            isManual: false
          };
        } else {
          updated[m.userId] = { amountOwed: '0', percentage: '0', isManual: false };
        }
      });
      setParticipantSplits(updated);
    } else if (mode === 'PERCENTAGE') {
      const defaultPct = (100 / activeIds.length).toFixed(1);
      const updated = { ...currentSplitsMap };
      members.forEach(m => {
        if (activeParticipantsSet.has(m.userId)) {
          const curPct = currentSplitsMap[m.userId]?.percentage !== '' ? currentSplitsMap[m.userId]?.percentage : defaultPct;
          const computedAmt = ((numAmt * (Number(curPct) || 0)) / 100).toFixed(2);
          updated[m.userId] = {
            amountOwed: computedAmt,
            percentage: curPct,
            isManual: currentSplitsMap[m.userId]?.isManual || false
          };
        } else {
          updated[m.userId] = { amountOwed: '0', percentage: '0', isManual: false };
        }
      });
      setParticipantSplits(updated);
    }
  };

  const handleAmountChange = (val) => {
    setAmount(val);
    recalculateSplits(val, splitType, selectedParticipants, participantSplits);
  };

  const handleSplitModeChange = (mode) => {
    setSplitType(mode);
    recalculateSplits(amount, mode, selectedParticipants, participantSplits);
  };

  // Custom Amount manual input per member
  const handleCustomAmountChange = (userId, val) => {
    const updated = {
      ...participantSplits,
      [userId]: {
        ...participantSplits[userId],
        amountOwed: val,
        isManual: true
      }
    };
    setParticipantSplits(updated);
  };

  // Percentage manual input per member
  const handlePercentageChange = (userId, val) => {
    const pct = Number(val) || 0;
    const numAmt = Number(amount) || 0;
    const computedAmt = ((numAmt * pct) / 100).toFixed(2);

    const updated = {
      ...participantSplits,
      [userId]: {
        amountOwed: computedAmt,
        percentage: val,
        isManual: true
      }
    };
    setParticipantSplits(updated);
  };

  // AUTO DIVIDE REMAINING AMOUNT BUTTON IMPLEMENTATION
  const handleAutoDivideRemaining = () => {
    const totalAmt = Number(amount) || 0;
    const totalPaise = Math.round(totalAmt * 100);

    const activeIds = Array.from(selectedParticipants);
    if (activeIds.length === 0) return;

    // Find members with manual amounts entered
    let manualPaiseSum = 0;
    const unassignedMembers = [];

    activeIds.forEach(uId => {
      const splitObj = participantSplits[uId];
      if (splitObj?.isManual && splitObj.amountOwed !== '') {
        manualPaiseSum += Math.round((Number(splitObj.amountOwed) || 0) * 100);
      } else {
        unassignedMembers.push(uId);
      }
    });

    const remainingPaise = totalPaise - manualPaiseSum;

    if (remainingPaise <= 0) {
      showError('No remaining amount to divide!');
      return;
    }

    if (unassignedMembers.length === 0) {
      // If all were manual, divide remaining equally among all active members
      const basePaise = Math.floor(remainingPaise / activeIds.length);
      const remPaise = remainingPaise % activeIds.length;

      const updated = { ...participantSplits };
      activeIds.forEach((uId, idx) => {
        const extra = idx < remPaise ? 1 : 0;
        const curPaise = Math.round((Number(updated[uId]?.amountOwed) || 0) * 100);
        const newAmt = ((curPaise + basePaise + extra) / 100).toFixed(2);
        updated[uId] = { ...updated[uId], amountOwed: newAmt, isManual: false };
      });
      setParticipantSplits(updated);
      showSuccess('Remaining amount auto-divided!');
      return;
    }

    const basePaise = Math.floor(remainingPaise / unassignedMembers.length);
    const remPaise = remainingPaise % unassignedMembers.length;

    const updated = { ...participantSplits };
    unassignedMembers.forEach((uId, idx) => {
      const sharePaise = basePaise + (idx < remPaise ? 1 : 0);
      updated[uId] = {
        amountOwed: (sharePaise / 100).toFixed(2),
        percentage: totalAmt > 0 ? (((sharePaise / totalPaise) * 100)).toFixed(1) : '0',
        isManual: false
      };
    });

    setParticipantSplits(updated);
    showSuccess(`Remaining ${currency}${(remainingPaise / 100).toFixed(2)} auto-divided among ${unassignedMembers.length} member(s)!`);
  };

  // Computations for validation & indicator UI
  const totalBillAmt = Number(amount) || 0;
  const totalBillPaise = Math.round(totalBillAmt * 100);

  const activeMemberIds = Array.from(selectedParticipants);
  const sumAssignedPaise = activeMemberIds.reduce((sum, uId) => {
    return sum + Math.round((Number(participantSplits[uId]?.amountOwed) || 0) * 100);
  }, 0);

  const sumPercentage = activeMemberIds.reduce((sum, uId) => {
    return sum + (Number(participantSplits[uId]?.percentage) || 0);
  }, 0);

  const remainingPaise = totalBillPaise - sumAssignedPaise;
  const remainingAmt = (remainingPaise / 100).toFixed(2);
  const assignedAmt = (sumAssignedPaise / 100).toFixed(2);

  let isSplitValid = false;
  let statusBadge = null;

  if (splitType === 'PERCENTAGE') {
    const isPct100 = Math.abs(sumPercentage - 100) < 0.1;
    isSplitValid = totalBillAmt > 0 && isPct100;
    if (isPct100) {
      statusBadge = (
        <span className="px-3 py-1 rounded-full bg-[#DDF5E8] text-[#19B86A] dark:bg-[#071C16] dark:text-[#2ED47A] text-xs font-bold font-mono">
          ✓ Split is balanced (100%)
        </span>
      );
    } else if (sumPercentage > 100) {
      statusBadge = (
        <span className="px-3 py-1 rounded-full bg-[#FFF0F0] text-[#D94A4A] text-xs font-bold font-mono">
          Percentages cannot exceed 100% ({sumPercentage.toFixed(1)}%)
        </span>
      );
    } else {
      statusBadge = (
        <span className="px-3 py-1 rounded-full bg-[#FFF8E6] text-[#E8A317] text-xs font-bold font-mono">
          Percentages must total 100% ({sumPercentage.toFixed(1)}%)
        </span>
      );
    }
  } else {
    const isExactBalanced = totalBillAmt > 0 && Math.abs(sumAssignedPaise - totalBillPaise) === 0;
    isSplitValid = isExactBalanced;

    if (isExactBalanced) {
      statusBadge = (
        <span className="px-3 py-1 rounded-full bg-[#DDF5E8] text-[#19B86A] dark:bg-[#071C16] dark:text-[#2ED47A] text-xs font-bold font-mono">
          ✓ Split is balanced ({currency}{assignedAmt} / {currency}{totalBillAmt.toLocaleString()})
        </span>
      );
    } else if (sumAssignedPaise > totalBillPaise) {
      const diff = ((sumAssignedPaise - totalBillPaise) / 100).toFixed(2);
      statusBadge = (
        <span className="px-3 py-1 rounded-full bg-[#FFF0F0] text-[#D94A4A] text-xs font-bold font-mono">
          Exceeds total by {currency}{diff}
        </span>
      );
    } else {
      statusBadge = (
        <span className="px-3 py-1 rounded-full bg-[#FFF8E6] text-[#E8A317] text-xs font-bold font-mono">
          {currency}{remainingAmt} remains to be assigned
        </span>
      );
    }
  }

  // Handle Form Submission
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (totalBillAmt <= 0) {
      showError('Please enter a valid bill amount.');
      return;
    }
    if (!isSplitValid) {
      showError('Please balance the expense split before saving.');
      return;
    }

    try {
      const splitsArray = activeMemberIds.map(uId => ({
        userId: uId,
        amountOwed: Number(participantSplits[uId]?.amountOwed) || 0,
        percentage: Number(participantSplits[uId]?.percentage) || 0
      }));

      const payload = {
        amount: totalBillAmt,
        description,
        category,
        date,
        paidById,
        splitType,
        notes,
        splits: splitsArray
      };

      if (editingExpenseId) {
        const res = await api.editGroupExpense(editingExpenseId, payload);
        if (res.success) {
          showSuccess('Expense updated successfully!');
          setIsAddExpenseOpen(false);
          fetchDetails();
        }
      } else {
        const res = await api.addGroupExpense(groupId, payload);
        if (res.success) {
          showSuccess('Group bill recorded successfully!');
          setIsAddExpenseOpen(false);
          fetchDetails();
        }
      }
    } catch (err) {
      showError(err.message || 'Failed to save group expense.');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this group expense?')) return;
    try {
      const res = await api.deleteGroupExpense(expenseId);
      if (res.success) {
        showSuccess('Expense deleted.');
        fetchDetails();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete expense.');
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/?joinGroup=${groupId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteUrl);
      showSuccess('Group invite link copied to clipboard!');
    } else {
      showSuccess(`Group invite link: ${inviteUrl}`);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteName.trim()) {
      showError('Please enter member name.');
      return;
    }

    try {
      const res = await api.inviteMember(groupId, { name: inviteName, email: inviteEmail });
      if (res.success) {
        showSuccess(res.message || `${inviteName} added to group!`);
        setIsInviteOpen(false);
        setInviteName('');
        setInviteEmail('');
        fetchDetails();
      }
    } catch (err) {
      showError(err.message || 'Failed to add member.');
    }
  };

  const handleDeleteGroup = async () => {
    setIsDeleting(true);
    try {
      const res = await api.deleteGroup(groupId);
      if (res.success) {
        showSuccess(`Group "${group?.name}" deleted successfully.`);
        onBack();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete group.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 max-w-7xl mx-auto"><ListSkeleton rows={5} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F6F0] dark:bg-[#071C16] text-[#161A18] dark:text-[#F7FFF9] font-sans p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] text-[#092B20] dark:text-[#F7FFF9] hover:bg-[#EEF9F2]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#DDF5E8] dark:bg-[#071C16] text-[#092B20] dark:text-[#2ED47A] text-[10px] font-extrabold uppercase font-mono border border-[#19B86A]/30">
              {group?.group_type || 'Group'}
            </span>
            <h1 className="font-display font-extrabold text-2xl text-[#092B20] dark:text-[#F7FFF9]">{group?.name}</h1>
            <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">{members.length} Active Members</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyInviteLink}
            title="Copy Shareable Group Invite Link"
            className="px-4 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] text-[#092B20] dark:text-[#F7FFF9] hover:bg-[#EEF9F2] dark:hover:bg-[#0E2920] font-bold text-xs border border-[#DDE5DF] dark:border-[#1A4337] flex items-center gap-2 transition"
          >
            <Share2 className="w-4 h-4 text-[#19B86A]" /> Share Link
          </button>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#EEF9F2] dark:bg-[#071C16] text-[#092B20] dark:text-[#2ED47A] font-bold text-xs border border-[#DDE5DF] dark:border-[#1A4337] flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Member
          </button>
          <button
            onClick={() => openExpenseModal(null)}
            className="btn-emerald px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Bill
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            title="Delete Group"
            className="p-2.5 rounded-xl bg-[#D94A4A]/10 text-[#D94A4A] hover:bg-[#D94A4A] hover:text-white transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#DDE5DF] dark:border-[#1A4337] pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl transition ${activeTab === 'expenses' ? 'bg-[#092B20] text-[#2ED47A]' : 'text-[#53635B]'}`}
        >
          Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className={`px-4 py-2 rounded-xl transition ${activeTab === 'settlements' ? 'bg-[#092B20] text-[#2ED47A]' : 'text-[#53635B]'}`}
        >
          Settlement Paths ({suggestedSettlements.length})
        </button>
      </div>

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] rounded-3xl p-6 shadow-sm space-y-3">
          {expenses.length === 0 ? (
            <EmptyState
              title="No Group Expenses Yet"
              description="Record your first shared expense to start tracking splits."
              actionText="Add Group Bill"
              onAction={() => openExpenseModal(null)}
            />
          ) : (
            expenses.map(e => {
              const canEdit = e.created_by === user?.id || userRole === 'ADMIN';
              return (
                <div key={e.id} className="p-4 rounded-2xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#092B20] text-[#2ED47A] flex items-center justify-center font-bold text-sm shrink-0">
                      {e.category?.[0] || 'G'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#092B20] dark:text-[#F7FFF9]">{e.description}</p>
                      <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">
                        Paid by <strong className="text-[#092B20] dark:text-[#2ED47A]">{e.paidByName || e.paid_by_name}</strong> • Split Mode: {e.split_type || 'EQUAL'}
                        {e.createdByName && ` • Logged by ${e.createdByName}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-extrabold text-base text-[#19B86A] dark:text-[#2ED47A]">{currency}{e.amount.toLocaleString()}</span>
                    
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openExpenseModal(e)}
                          title="Edit Expense"
                          className="p-1.5 rounded-lg text-[#53635B] hover:text-[#19B86A] hover:bg-[#19B86A]/10 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          title="Delete Expense"
                          className="p-1.5 rounded-lg text-[#53635B] hover:text-[#D94A4A] hover:bg-[#D94A4A]/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Settlements Tab */}
      {activeTab === 'settlements' && (
        <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-display font-extrabold text-base text-[#092B20] dark:text-[#F7FFF9]">Minimum Debt Settlement Paths</h3>
          {suggestedSettlements.length === 0 ? (
            <p className="text-xs text-[#53635B] dark:text-[#B8C9C0] text-center py-6">All debts in this group are currently settled!</p>
          ) : (
            suggestedSettlements.map((s, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#EEF9F2] dark:bg-[#071C16] border border-[#19B86A]/30 flex items-center justify-between font-bold text-sm text-[#092B20] dark:text-[#F7FFF9]">
                <span>{s.fromName || s.payerName} owes {s.toName || s.payeeName}</span>
                <span className="text-[#19B86A] dark:text-[#2ED47A] font-extrabold">{currency}{s.amount.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Member Modal (Name Priority) */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-[#071C16]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF] dark:border-[#1A4337]">
              <h3 className="font-display font-extrabold text-lg text-[#092B20] dark:text-[#F7FFF9]">Add Group Member</h3>
              <button onClick={() => setIsInviteOpen(false)}><X className="w-5 h-5 text-[#53635B]" /></button>
            </div>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase mb-1">
                  Member Name <span className="text-[#19B86A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Rahul, Aman, Neha, Priya"
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] text-xs font-bold text-[#092B20] dark:text-[#F7FFF9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase mb-1">
                  Email Address <span className="text-[10px] text-[#53635B] font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] text-xs font-semibold text-[#092B20] dark:text-[#F7FFF9]"
                />
              </div>

              <button type="submit" className="w-full btn-emerald py-3.5 rounded-xl font-bold text-xs">Add Member to Group</button>
            </form>

            <div className="pt-3 border-t border-[#DDE5DF] dark:border-[#1A4337] space-y-2">
              <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase">Or Share Group Invite Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?joinGroup=${groupId}`}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] text-xs font-mono text-[#53635B] dark:text-[#B8C9C0] select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-3.5 py-2.5 rounded-xl bg-[#EEF9F2] dark:bg-[#071C16] text-[#19B86A] dark:text-[#2ED47A] border border-[#19B86A]/40 text-xs font-bold flex items-center gap-1.5 hover:bg-[#19B86A] hover:text-white transition"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#071C16]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#D94A4A]/30 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF] dark:border-[#1A4337]">
              <h3 className="font-display font-extrabold text-lg text-[#D94A4A] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Delete Group?
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)}><X className="w-5 h-5 text-[#53635B]" /></button>
            </div>

            <p className="text-xs text-[#53635B] dark:text-[#B8C9C0] leading-relaxed">
              Are you sure you want to delete <strong className="text-[#092B20] dark:text-[#F7FFF9]">"{group?.name}"</strong>? This will permanently remove all group expenses and debt splits.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] text-xs font-bold text-[#092B20] dark:text-[#F7FFF9]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteGroup}
                className="px-5 py-2.5 rounded-xl bg-[#D94A4A] text-white text-xs font-bold hover:bg-[#b83b3b] transition"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADVANCED GROUP EXPENSE SPLIT MODAL */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-[#071C16]/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            
            {/* Modal Title */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF] dark:border-[#1A4337]">
              <h3 className="font-display font-extrabold text-lg text-[#092B20] dark:text-[#F7FFF9]">
                {editingExpenseId ? 'Edit Group Bill' : 'Add Group Bill'}
              </h3>
              <button onClick={() => setIsAddExpenseOpen(false)}><X className="w-5 h-5 text-[#53635B]" /></button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              
              {/* Total Amount & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase mb-1">
                    Expense Name <span className="text-[#19B86A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Dinner, Resort Stay"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-semibold text-xs text-[#092B20] dark:text-[#F7FFF9]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase mb-1">
                    Total Amount ({currency}) <span className="text-[#19B86A]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-lg text-[#092B20] dark:text-[#F7FFF9]"
                  />
                </div>
              </div>

              {/* Category, Date & Paid By */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-xs text-[#092B20] dark:text-[#F7FFF9]"
                  >
                    <option value="Food">Food & Dining</option>
                    <option value="Rent">Accommodation / Rent</option>
                    <option value="Travel">Travel & Transport</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Shopping">Shopping</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-xs text-[#092B20] dark:text-[#F7FFF9]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase mb-1">Paid By</label>
                  <select
                    value={paidById}
                    onChange={(e) => setPaidById(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-xs text-[#092B20] dark:text-[#F7FFF9]"
                  >
                    {members.map(m => (
                      <option key={m.userId} value={m.userId}>
                        {m.userName || m.name} {m.userId === user?.id ? '(You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Participant Selection Checkboxes */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase">
                  Select Participants ({selectedParticipants.size} / {members.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {members.map(m => {
                    const isSelected = selectedParticipants.has(m.userId);
                    return (
                      <button
                        type="button"
                        key={m.userId}
                        onClick={() => toggleParticipant(m.userId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
                          isSelected
                            ? 'bg-[#092B20] dark:bg-[#153D30] text-[#2ED47A] border border-[#19B86A]'
                            : 'bg-[#F7F6F0] dark:bg-[#071C16] text-[#53635B] dark:text-[#B8C9C0] border-[#DDE5DF] dark:border-[#1A4337]'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? 'bg-[#19B86A] text-white' : 'bg-gray-300 dark:bg-gray-700 text-transparent'
                        }`}>
                          ✓
                        </span>
                        <span>{m.userName || m.name} {m.userId === user?.id ? '(You)' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Split Mode Selector Pills */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase">Split Mode</label>
                  
                  {splitType === 'CUSTOM' && (
                    <button
                      type="button"
                      onClick={handleAutoDivideRemaining}
                      className="px-3 py-1 rounded-xl bg-[#EEF9F2] dark:bg-[#071C16] text-[#19B86A] dark:text-[#2ED47A] border border-[#19B86A]/40 text-xs font-bold flex items-center gap-1.5 hover:bg-[#19B86A] hover:text-white transition"
                    >
                      <Divide className="w-3.5 h-3.5" />
                      <span>Auto divide remaining</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#F7F6F0] dark:bg-[#071C16] p-1 rounded-xl border border-[#DDE5DF] dark:border-[#1A4337]">
                  <button
                    type="button"
                    onClick={() => handleSplitModeChange('EQUAL')}
                    className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                      splitType === 'EQUAL' ? 'bg-[#092B20] text-[#2ED47A]' : 'text-[#53635B]'
                    }`}
                  >
                    <span>Equal (÷)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSplitModeChange('CUSTOM')}
                    className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                      splitType === 'CUSTOM' ? 'bg-[#092B20] text-[#2ED47A]' : 'text-[#53635B]'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Custom Amount ({currency})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSplitModeChange('PERCENTAGE')}
                    className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                      splitType === 'PERCENTAGE' ? 'bg-[#092B20] text-[#2ED47A]' : 'text-[#53635B]'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Percentage (%)</span>
                  </button>
                </div>
              </div>

              {/* Per-Person Split Configuration Table */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 pt-1">
                {members.map(m => {
                  const isSelected = selectedParticipants.has(m.userId);
                  const splitData = participantSplits[m.userId] || { amountOwed: '0', percentage: '0' };

                  if (!isSelected) {
                    return (
                      <div key={m.userId} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F6F0]/50 dark:bg-[#071C16]/50 border border-[#DDE5DF]/50 dark:border-[#1A4337]/50 opacity-40">
                        <span className="text-xs font-semibold text-[#53635B]">{m.userName || m.name} (Not participating)</span>
                        <span className="text-xs font-mono font-bold text-[#53635B]">{currency}0.00</span>
                      </div>
                    );
                  }

                  return (
                    <div key={m.userId} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#19B86A] text-white text-xs font-bold flex items-center justify-center">
                          {(m.userName || m.name)?.[0]?.toUpperCase() || 'M'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#092B20] dark:text-[#F7FFF9]">{m.userName || m.name}</p>
                          <p className="text-[10px] text-[#53635B] dark:text-[#B8C9C0]">
                            Share: {currency}{Number(splitData.amountOwed || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {splitType === 'EQUAL' && (
                        <span className="font-mono text-xs font-bold text-[#19B86A] dark:text-[#2ED47A]">
                          {currency}{Number(splitData.amountOwed || 0).toLocaleString()}
                        </span>
                      )}

                      {splitType === 'CUSTOM' && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-[#53635B]">{currency}</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={splitData.amountOwed}
                            onChange={(e) => handleCustomAmountChange(m.userId, e.target.value)}
                            placeholder="0"
                            className="w-24 px-2 py-1 rounded-lg bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] text-right font-bold text-xs text-[#092B20] dark:text-[#F7FFF9]"
                          />
                        </div>
                      )}

                      {splitType === 'PERCENTAGE' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={splitData.percentage}
                            onChange={(e) => handlePercentageChange(m.userId, e.target.value)}
                            placeholder="0"
                            className="w-16 px-2 py-1 rounded-lg bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] text-right font-bold text-xs text-[#092B20] dark:text-[#F7FFF9]"
                          />
                          <span className="text-xs font-bold text-[#53635B]">%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live Split Preview Box & Status Indicator */}
              <div className="p-4 rounded-2xl bg-[#EEF9F2] dark:bg-[#071C16] border border-[#19B86A]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider">Live Split Preview</span>
                  {statusBadge}
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-[#53635B] dark:text-[#B8C9C0]">
                  <span>Total Bill: {currency}{totalBillAmt.toLocaleString()}</span>
                  <span>Assigned: {currency}{assignedAmt}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-5 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-xs text-[#092B20] dark:text-[#F7FFF9]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!isSplitValid}
                  className="btn-emerald px-6 py-3 rounded-xl font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingExpenseId ? 'Save Changes' : 'Record Group Bill'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
