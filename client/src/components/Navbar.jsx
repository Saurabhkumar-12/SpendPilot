import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Plus, 
  Menu, 
  X,
  LayoutDashboard,
  Receipt,
  Users,
  HandCoins,
  BarChart3,
  Sparkles,
  User,
  Sun,
  Moon
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Logo } from './Logo';

export function Navbar({ currentTab, setTab, onOpenSearch, onAddExpense }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {}
  };

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (e) {}
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'settlements', label: 'Settlements', icon: HandCoins },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <header className="bg-[#FCFCF8]/90 dark:bg-[#071C16]/90 backdrop-blur-2xl border-b border-[#DDE5DF] dark:border-[#1A4337] sticky top-0 z-40 px-4 py-3.5 md:px-8 transition-colors duration-300">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Mobile Header Brand */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#092B20] dark:text-[#F7FFF9] rounded-xl bg-[#EEF9F2] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Logo light={theme === 'dark'} />
        </div>

        {/* Desktop Breadcrumb Title */}
        <div className="hidden md:block">
          <h2 className="font-display font-extrabold text-xl text-[#092B20] dark:text-[#F7FFF9] capitalize tracking-tight">
            {currentTab.replace('-', ' ')}
          </h2>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3.5 py-2 text-[#747B76] dark:text-[#9CB0A5] hover:text-[#092B20] dark:hover:text-[#F7FFF9] rounded-xl bg-[#F7F6F0] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337] transition text-xs font-semibold"
            title="Search (Ctrl + K)"
          >
            <Search className="w-4 h-4 text-[#19B86A]" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#EEF9F2] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337] text-[9px] text-[#092B20] dark:text-[#2ED47A] font-mono">Ctrl K</kbd>
          </button>

          {/* Theme Switch */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-[#092B20] dark:text-[#2ED47A] rounded-xl bg-[#EEF9F2] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337] hover:border-[#19B86A] transition"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4 text-[#2ED47A]" /> : <Sun className="w-4 h-4 text-[#E8A317]" />}
          </button>

          {/* Quick Add Expense */}
          <button
            onClick={onAddExpense}
            className="btn-emerald flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition transform hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2.5 text-[#092B20] dark:text-[#F7FFF9] rounded-xl bg-[#EEF9F2] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337] hover:border-[#19B86A] transition relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#19B86A] text-[#FCFCF8] font-extrabold text-[10px] flex items-center justify-center animate-pulse font-mono">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] rounded-3xl shadow-2xl z-50 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#DDE5DF] dark:border-[#1A4337]">
                  <h4 className="font-display font-bold text-sm text-[#092B20] dark:text-[#F7FFF9]">Notifications</h4>
                  <span className="text-xs text-[#19B86A] font-bold">{unreadCount} unread</span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#747B76] dark:text-[#9CB0A5] text-center py-4">No notifications yet</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                          n.is_read 
                            ? 'bg-[#F7F6F0] dark:bg-[#071C16] border-[#DDE5DF] dark:border-[#1A4337] text-[#747B76] dark:text-[#9CB0A5]' 
                            : 'bg-[#EEF9F2] dark:bg-[#153D30] border-[#19B86A]/30 text-[#092B20] dark:text-[#F7FFF9] font-semibold'
                        }`}
                      >
                        <p className="font-bold mb-0.5">{n.title}</p>
                        <p className="text-[11px] leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <button
            onClick={() => setTab('profile')}
            className="w-9 h-9 rounded-xl bg-[#DDF5E8] border border-[#19B86A]/40 flex items-center justify-center text-xs font-extrabold text-[#092B20] overflow-hidden hover:scale-105 transition"
          >
            {user?.avatarUrl ? (
              <img src={`http://localhost:5000${user.avatarUrl}`} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() || 'U'
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2 px-2 border-t border-[#DDE5DF] dark:border-[#1A4337] mt-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition ${
                  currentTab === item.id 
                    ? 'bg-[#092B20] text-[#2ED47A] border border-[#19B86A]/30' 
                    : 'text-[#747B76] dark:text-[#9CB0A5] hover:text-[#092B20] dark:hover:text-[#F7FFF9]'
                }`}
              >
                <Icon className="w-4 h-4 text-[#19B86A]" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
