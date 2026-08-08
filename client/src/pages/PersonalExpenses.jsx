import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Calendar, 
  CreditCard, 
  Tag, 
  X,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeletons';

export function PersonalExpenses({ isModalOpen, setIsModalOpen }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = user?.preferences?.currency || '₹';

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedPayMethod, setSelectedPayMethod] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');

  // Edit Expense State
  const [editingExpense, setEditingExpense] = useState(null);

  // Add Expense Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // Custom Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#19B86A');

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [search, selectedCat, selectedPayMethod, sortBy]);

  const fetchExpenses = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCat !== 'ALL') params.category = selectedCat;
      if (selectedPayMethod !== 'ALL') params.paymentMethod = selectedPayMethod;
      if (sortBy) params.sortBy = sortBy;

      const res = await api.getPersonalExpenses(params);
      if (res.success) {
        setExpenses(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (e) {}
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        const res = await api.editPersonalExpense(editingExpense.id, {
          amount: Number(amount),
          category,
          description,
          date,
          paymentMethod
        });
        if (res.success) {
          showSuccess('Expense updated successfully.');
        }
      } else {
        const res = await api.addPersonalExpense({
          amount: Number(amount),
          category,
          description,
          date,
          paymentMethod
        });
        if (res.success) {
          showSuccess('Expense added successfully.');
        }
      }
      closeModal();
      fetchExpenses();
    } catch (err) {
      showError(err.message || 'Failed to save expense.');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await api.deletePersonalExpense(id);
      if (res.success) {
        showSuccess('Expense deleted.');
        fetchExpenses();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete expense.');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createCustomCategory({ name: newCatName, color: newCatColor });
      if (res.success) {
        showSuccess('Custom category created.');
        setCategory(newCatName);
        setNewCatName('');
        setIsCategoryModalOpen(false);
        fetchCategories();
      }
    } catch (err) {
      showError(err.message || 'Failed to add category.');
    }
  };

  const openEditModal = (item) => {
    setEditingExpense(item);
    setAmount(item.amount);
    setCategory(item.category);
    setDescription(item.description);
    setDate(item.date);
    setPaymentMethod(item.paymentMethod || 'UPI');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setAmount('');
    setDescription('');
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] dark:bg-[#071C16] text-[#161A18] dark:text-[#F7FFF9] font-sans p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#092B20] dark:text-[#F7FFF9]">Personal Expenses</h1>
          <p className="text-xs text-[#747B76] dark:text-[#9CB0A5]">Track daily spending, categorize bills, and control your budget.</p>
        </div>
        <button
          onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
          className="btn-emerald px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-4 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-[#19B86A] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] text-xs font-semibold text-[#092B20] dark:text-[#F7FFF9] focus:outline-none focus:border-[#19B86A]"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        <select
          value={selectedPayMethod}
          onChange={(e) => setSelectedPayMethod(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] focus:outline-none"
        >
          <option value="ALL">All Payment Methods</option>
          <option value="UPI">UPI</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] focus:outline-none"
        >
          <option value="date">Sort by Date (Latest)</option>
          <option value="amount_high">Sort by Amount (High → Low)</option>
          <option value="amount_low">Sort by Amount (Low → High)</option>
        </select>
      </div>

      {/* Expenses Table / List */}
      <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] rounded-3xl p-6 shadow-sm space-y-4">
        {loading ? (
          <ListSkeleton rows={6} />
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No Personal Expenses Found"
            description="Start logging your daily purchases to build your financial history."
            actionText="Add First Expense"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="space-y-2">
            {expenses.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] flex items-center justify-between hover:border-[#19B86A]/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#092B20] text-[#2ED47A] flex items-center justify-center font-bold text-sm">
                    {item.category?.[0] || 'E'}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#092B20] dark:text-[#F7FFF9]">{item.description}</p>
                    <p className="text-xs text-[#747B76] dark:text-[#9CB0A5]">{item.category} • {item.date} • {item.paymentMethod || 'UPI'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-base text-[#19B86A] dark:text-[#2ED47A]">
                    {currency}{item.amount}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 text-[#747B76] hover:text-[#092B20] dark:hover:text-[#F7FFF9] rounded-lg hover:bg-[#DDF5E8]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(item.id)}
                      className="p-2 text-[#747B76] hover:text-[#D94A4A] rounded-lg hover:bg-[#D94A4A]/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#071C16]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF] dark:border-[#1A4337]">
              <h3 className="font-display font-extrabold text-lg text-[#092B20] dark:text-[#F7FFF9]">
                {editingExpense ? 'Edit Personal Expense' : 'Add Personal Expense'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-[#747B76]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-lg text-[#092B20] dark:text-[#F7FFF9] focus:outline-none focus:border-[#19B86A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-xs text-[#092B20] dark:text-[#F7FFF9] focus:outline-none"
                >
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Dinner with Friends"
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-semibold text-xs text-[#092B20] dark:text-[#F7FFF9] focus:outline-none focus:border-[#19B86A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] text-xs font-bold text-[#092B20] dark:text-[#F7FFF9]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] text-xs font-bold text-[#092B20] dark:text-[#F7FFF9]"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full btn-emerald py-3.5 rounded-xl font-bold text-xs">
                {editingExpense ? 'Save Changes' : 'Record Expense'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
