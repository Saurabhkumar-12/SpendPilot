import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { LogoMark } from './components/Logo';

// Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { PersonalExpenses } from './pages/PersonalExpenses';
import { Groups } from './pages/Groups';
import { GroupDetails } from './pages/GroupDetails';
import { Settlement } from './pages/Settlement';
import { Budgets } from './pages/Budgets';
import { Reports } from './pages/Reports';
import { Insights } from './pages/Insights';
import { NotificationsPage } from './pages/NotificationsPage';
import { Profile } from './pages/Profile';

import { api } from './services/api';

export function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [authView, setAuthView] = useState('landing');

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Handle shareable group invite link (e.g. ?joinGroup=groupId)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetGroupId = params.get('joinGroup');
    if (targetGroupId && user) {
      api.inviteMember(targetGroupId, { name: user.name, email: user.email })
        .finally(() => {
          setCurrentTab('groups');
          setSelectedGroupId(targetGroupId);
        });
    }
  }, [user]);

  // Keyboard shortcut Ctrl+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#092B20] flex flex-col items-center justify-center space-y-4">
        <LogoMark className="w-16 h-16 animate-bounce shadow-2xl" />
        <p className="text-xs text-[#9CB0A5] font-bold font-mono">Loading SpendPilot...</p>
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    if (authView === 'login') return <Login onNavigate={setAuthView} />;
    if (authView === 'register') return <Register onNavigate={setAuthView} />;
    return <LandingPage onNavigate={setAuthView} />;
  }

  return (
    <div className="flex min-h-screen bg-[#F7F6F0] text-[#161A18] font-sans">
      {/* Sidebar for Desktop */}
      <Sidebar
        currentTab={currentTab}
        setTab={(tab) => { setCurrentTab(tab); setSelectedGroupId(null); }}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          currentTab={currentTab}
          setTab={(tab) => { setCurrentTab(tab); setSelectedGroupId(null); }}
          onOpenSearch={() => setIsSearchOpen(true)}
          onAddExpense={() => { setCurrentTab('expenses'); setIsExpenseModalOpen(true); }}
        />

        <main className="flex-1 pb-12">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigate={(tab) => { setCurrentTab(tab); setSelectedGroupId(null); }}
              onAddExpense={() => { setCurrentTab('expenses'); setIsExpenseModalOpen(true); }}
            />
          )}

          {currentTab === 'expenses' && (
            <PersonalExpenses
              isModalOpen={isExpenseModalOpen}
              setIsModalOpen={setIsExpenseModalOpen}
            />
          )}

          {currentTab === 'groups' && !selectedGroupId && (
            <Groups onSelectGroup={(id) => setSelectedGroupId(id)} />
          )}

          {currentTab === 'groups' && selectedGroupId && (
            <GroupDetails
              groupId={selectedGroupId}
              onBack={() => setSelectedGroupId(null)}
            />
          )}

          {currentTab === 'settlements' && <Settlement />}
          {currentTab === 'budgets' && <Budgets />}
          {currentTab === 'reports' && <Reports />}
          {currentTab === 'insights' && <Insights />}
          {currentTab === 'notifications' && <NotificationsPage />}
          {currentTab === 'profile' && <Profile />}
        </main>
      </div>

      {/* Global Command-K Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => { setCurrentTab(tab); setSelectedGroupId(null); }}
      />
    </div>
  );
}
