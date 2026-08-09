import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  HandCoins, 
  PiggyBank,
  BarChart3, 
  Sparkles, 
  Bell,
  Settings,
  User, 
  LogOut, 
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

export function Sidebar({ currentTab, setTab, onOpenSearch }) {
  const { user, logoutUser } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'settlements', label: 'Settlements', icon: HandCoins },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'insights', label: 'AI Insights', icon: Sparkles, badge: 'AI' },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Settings & Profile', icon: Settings }
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#FCFCF8] dark:bg-[#092B20] border-r border-[#DDE5DF] dark:border-[#1A4337] flex flex-col justify-between h-screen sticky top-0 backdrop-blur-2xl hidden md:flex transition-colors duration-300">
      {/* Top Header */}
      <div>
        <div className="p-6 flex items-center justify-between">
          <Logo light={false} />
        </div>

        {/* Quick Search */}
        <div className="px-4 mb-4">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] hover:bg-[#EEF9F2] dark:hover:bg-[#0E2920] text-[#747B76] dark:text-[#9CB0A5] hover:text-[#092B20] dark:hover:text-[#F7FFF9] border border-[#DDE5DF] dark:border-[#1A4337] text-xs font-semibold transition group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#19B86A] group-hover:scale-110 transition" />
              <span>Search...</span>
            </div>
            <kbd className="px-2 py-0.5 rounded-md bg-[#EEF9F2] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337] text-[10px] text-[#092B20] dark:text-[#2ED47A] font-mono">Ctrl K</kbd>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="px-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-[#092B20] dark:bg-[#153D30] text-[#2ED47A] border border-[#19B86A]/40 shadow-sm'
                    : 'text-[#747B76] dark:text-[#9CB0A5] hover:text-[#092B20] dark:hover:text-[#F7FFF9] hover:bg-[#EEF9F2] dark:hover:bg-[#071C16] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2ED47A]' : 'text-[#19B86A]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-full bg-[#DDF5E8] dark:bg-[#071C16] text-[#092B20] dark:text-[#2ED47A] border border-[#19B86A]/30 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-[#DDE5DF] dark:border-[#1A4337] space-y-3">
        {/* User Card */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16] border border-[#DDE5DF] dark:border-[#1A4337]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-[#DDF5E8] border border-[#19B86A]/40 flex items-center justify-center text-xs font-extrabold text-[#092B20] shrink-0">
              {user?.avatarUrl ? (
                <img src={`http://localhost:5000${user.avatarUrl}`} alt={user.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-[#092B20] dark:text-[#F7FFF9] truncate">{user?.name || 'ABC'}</p>
              <p className="text-[10px] text-[#747B76] dark:text-[#9CB0A5] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logoutUser}
            title="Logout"
            className="p-1.5 text-[#747B76] hover:text-[#D94A4A] rounded-lg hover:bg-[#D94A4A]/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
