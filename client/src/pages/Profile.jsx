import React, { useState } from 'react';
import { User, Mail, Lock, Camera, LogOut, ShieldAlert, CheckCircle2, Trash2, X, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function Profile() {
  const { user, updateUserState, logoutUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.preferences?.currency || '₹');
  const [defaultSplitMode, setDefaultSplitMode] = useState(user?.preferences?.default_split_mode || 'EQUAL');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateProfile({ name });
      if (res.success) {
        updateUserState({ name });
        showSuccess('Profile updated successfully.');
      }
    } catch (err) {
      showError(err.message || 'Profile update failed.');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const res = await api.uploadAvatar(formData);
      if (res.success) {
        updateUserState({ avatarUrl: res.avatarUrl });
        showSuccess('Avatar uploaded successfully.');
      }
    } catch (err) {
      showError(err.message || 'Avatar upload failed.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updatePreferences({ currency, theme, defaultSplitMode });
      if (res.success) {
        updateUserState({ preferences: { ...user?.preferences, currency, theme, default_split_mode: defaultSplitMode } });
        showSuccess('Preferences saved successfully.');
      }
    } catch (err) {
      showError(err.message || 'Saving preferences failed.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setUpdatingPassword(true);
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        showSuccess('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      showError(err.message || 'Password update failed.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmInput !== 'DELETE') {
      showError('Please type DELETE to confirm account deletion.');
      return;
    }

    setDeleting(true);
    try {
      const res = await api.deleteAccount();
      if (res.success) {
        showSuccess('Account permanently deleted.');
        logoutUser();
      }
    } catch (err) {
      showError(err.message || 'Account deletion failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] dark:bg-[#071C16] text-[#161A18] dark:text-[#F7FFF9] font-sans p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#092B20] dark:text-[#F7FFF9]">Account Settings & Profile</h1>
          <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">Manage your account details, default currency, security credentials, and danger zone.</p>
        </div>
        <button
          onClick={logoutUser}
          className="px-4 py-2.5 rounded-xl bg-[#D94A4A]/10 text-[#D94A4A] border border-[#D94A4A]/20 text-xs font-bold flex items-center gap-2 hover:bg-[#D94A4A] hover:text-white transition"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Information Card */}
        <div className="lg:col-span-6 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl space-y-6 shadow-sm">
          <h3 className="font-display font-extrabold text-base text-[#092B20] dark:text-[#F7FFF9]">Personal Information</h3>
          
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl bg-[#DDF5E8] border border-[#19B86A]/30 text-[#092B20] font-extrabold flex items-center justify-center text-xl overflow-hidden">
              {user?.avatarUrl ? (
                <img src={`http://localhost:5000${user.avatarUrl}`} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div>
              <p className="font-bold text-base text-[#092B20] dark:text-[#F7FFF9]">{user?.name}</p>
              <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-semibold text-xs text-[#092B20] dark:text-[#F7FFF9]"
              />
            </div>
            <button type="submit" className="btn-emerald px-5 py-3 rounded-xl text-xs font-bold">Update Profile Name</button>
          </form>
        </div>

        {/* Preferences */}
        <div className="lg:col-span-6 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl space-y-6 shadow-sm">
          <h3 className="font-display font-extrabold text-base text-[#092B20] dark:text-[#F7FFF9]">System Preferences</h3>

          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Default Currency Symbol</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-xs text-[#092B20] dark:text-[#F7FFF9]"
              >
                <option value="₹">₹ — Indian Rupee (INR)</option>
                <option value="$">$ — US Dollar (USD)</option>
                <option value="€">€ — Euro (EUR)</option>
                <option value="£">£ — British Pound (GBP)</option>
                <option value="¥">¥ — Japanese Yen (JPY)</option>
              </select>
            </div>

            <button type="submit" className="btn-emerald px-5 py-3 rounded-xl text-xs font-bold">Save Preferences</button>
          </form>
        </div>

        {/* Change Password Security */}
        <div className="lg:col-span-6 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl space-y-4 shadow-sm">
          <h3 className="font-display font-extrabold text-base text-[#092B20] dark:text-[#F7FFF9]">Security & Password</h3>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-semibold text-xs text-[#092B20] dark:text-[#F7FFF9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-semibold text-xs text-[#092B20] dark:text-[#F7FFF9]"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="btn-emerald px-5 py-3 rounded-xl text-xs font-bold"
            >
              {updatingPassword ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="lg:col-span-6 bg-[#D94A4A]/5 border border-[#D94A4A]/30 p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-[#D94A4A]" />
            <h3 className="font-display font-extrabold text-base text-[#D94A4A]">Danger Zone</h3>
          </div>

          <p className="text-xs text-[#53635B] dark:text-[#B8C9C0] leading-relaxed">
            Permanently delete your SpendPilot account and associated personal expense records. This action cannot be undone.
          </p>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-[#D94A4A] text-white font-bold text-xs hover:bg-[#b83b3b] transition shadow-md flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>

      </div>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#D94A4A]/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#DDE5DF] dark:border-[#1A4337] pb-3">
              <h3 className="font-display font-extrabold text-lg text-[#D94A4A] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Permanently Delete Account?
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-[#53635B] hover:text-[#092B20]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#53635B] dark:text-[#B8C9C0] leading-relaxed">
              This action is permanent and will remove your user profile, active sessions, and personal expense data from the SpendPilot database.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] uppercase tracking-wider mb-2">
                Type <span className="text-[#D94A4A] font-mono">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] font-bold text-xs text-[#092B20] dark:text-[#F7FFF9]"
              />
            </div>

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
                disabled={deleting || confirmInput !== 'DELETE'}
                onClick={handleDeleteAccount}
                className="px-5 py-2.5 rounded-xl bg-[#D94A4A] text-white text-xs font-bold disabled:opacity-50 hover:bg-[#b83b3b] transition"
              >
                {deleting ? 'Deleting Account...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
