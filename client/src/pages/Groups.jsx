import React, { useState, useEffect } from 'react';
import { Plus, Users, Compass, ArrowRight, X, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeletons';

const GROUP_TYPES = ['Trip', 'Friends', 'Family', 'Office', 'Roommates', 'College', 'Event', 'Custom'];

export function Groups({ onSelectGroup }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { socket } = useSocket();
  const currency = user?.preferences?.currency || '₹';

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Delete Confirmation Modal State
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState('Trip');

  useEffect(() => {
    fetchGroups();

    if (socket) {
      const handleRealtimeEvent = () => {
        fetchGroups();
      };
      socket.on('group:realtime-event', handleRealtimeEvent);
      return () => {
        socket.off('group:realtime-event', handleRealtimeEvent);
      };
    }
  }, [socket]);

  const fetchGroups = async () => {
    try {
      const res = await api.getGroups();
      if (res.success) {
        setGroups(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createGroup({ name, description, groupType });
      if (res.success) {
        showSuccess('Group created successfully!');
        setIsCreateModalOpen(false);
        setName('');
        setDescription('');
        fetchGroups();
      }
    } catch (err) {
      showError(err.message || 'Failed to create group.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteGroup(deletingGroup.id);
      if (res.success) {
        showSuccess(`Group "${deletingGroup.name}" deleted successfully.`);
        setDeletingGroup(null);
        fetchGroups();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete group.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] dark:bg-[#071C16] text-[#161A18] dark:text-[#F7FFF9] font-sans p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#092B20] dark:text-[#F7FFF9]">Expense Groups</h1>
          <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">Manage trip, family, and roommate shared bills seamlessly.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-emerald px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Group
        </button>
      </div>

      {/* Group Cards Grid */}
      {loading ? (
        <ListSkeleton rows={3} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups created yet"
          description="Create your first group for an upcoming trip, office party, or roommate expenses."
          actionText="Create Group"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(g => (
            <div
              key={g.id}
              onClick={() => onSelectGroup(g.id)}
              className="p-6 rounded-3xl bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] hover:border-[#19B86A]/40 cursor-pointer shadow-sm flex flex-col justify-between space-y-5 transition-all duration-300 hover:scale-[1.01] group relative"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-[#DDF5E8] dark:bg-[#071C16] text-[#092B20] dark:text-[#2ED47A] border border-[#19B86A]/30 text-[10px] font-extrabold uppercase font-mono tracking-wider">
                    {g.group_type}
                  </span>
                  <h3 className="font-display font-extrabold text-lg text-[#092B20] dark:text-[#F7FFF9] group-hover:text-[#19B86A] transition">
                    {g.name}
                  </h3>
                  <p className="text-xs text-[#53635B] dark:text-[#B8C9C0] line-clamp-2">{g.description || 'No description added'}</p>
                </div>

                {/* Delete Group Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingGroup(g);
                  }}
                  title="Delete Group"
                  className="p-2 rounded-xl text-[#53635B] hover:text-[#D94A4A] hover:bg-[#D94A4A]/10 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-4 border-t border-[#DDE5DF] dark:border-[#1A4337] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#53635B] dark:text-[#B8C9C0]">
                  <Users className="w-4 h-4 text-[#19B86A]" />
                  <span>{g.memberCount || g.members?.length || 1} Members</span>
                </div>
                <span className="text-xs font-bold text-[#19B86A] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#071C16]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF] dark:border-[#1A4337]">
              <h3 className="font-display font-extrabold text-lg text-[#092B20] dark:text-[#F7FFF9]">Create Expense Group</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-lg text-[#53635B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Goa Trip 2026"
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-sm text-[#092B20] dark:text-[#F7FFF9] focus:outline-none focus:border-[#19B86A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Group Category</label>
                <select
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-xs text-[#092B20] dark:text-[#F7FFF9] focus:outline-none"
                >
                  {GROUP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes or trip details"
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-semibold text-xs text-[#092B20] dark:text-[#F7FFF9] focus:outline-none focus:border-[#19B86A]"
                ></textarea>
              </div>

              <button type="submit" className="w-full btn-emerald py-3.5 rounded-xl font-bold text-xs">
                Create Group
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {deletingGroup && (
        <div className="fixed inset-0 z-50 bg-[#071C16]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#D94A4A]/30 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF] dark:border-[#1A4337]">
              <h3 className="font-display font-extrabold text-lg text-[#D94A4A] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Delete Group?
              </h3>
              <button onClick={() => setDeletingGroup(null)}><X className="w-5 h-5 text-[#53635B]" /></button>
            </div>

            <p className="text-xs text-[#53635B] dark:text-[#B8C9C0] leading-relaxed">
              Are you sure you want to delete <strong className="text-[#092B20] dark:text-[#F7FFF9]">"{deletingGroup.name}"</strong>? This will permanently remove all member links and group expenses.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingGroup(null)}
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

    </div>
  );
}
