import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, ShieldAlert, Users, HandCoins, Check } from 'lucide-react';
import { api } from '../services/api';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] dark:bg-[#071C16] text-[#161A18] dark:text-[#F7FFF9] font-sans p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#19B86A]" />
            <h1 className="font-display font-extrabold text-2xl text-[#092B20] dark:text-[#F7FFF9]">Notifications & Alerts</h1>
          </div>
          <p className="text-xs text-[#747B76] dark:text-[#9CB0A5] mt-1">System reminders, debt settlement updates, and group invites.</p>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-[#747B76] text-center py-10">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] text-center space-y-3 shadow-sm">
            <Bell className="w-10 h-10 text-[#19B86A] mx-auto" />
            <h3 className="font-display font-bold text-lg text-[#092B20] dark:text-[#F7FFF9]">No New Notifications</h3>
            <p className="text-xs text-[#747B76] dark:text-[#9CB0A5]">You are all caught up! Settlement alerts and invites will appear here.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                n.is_read 
                  ? 'bg-[#F7F6F0] dark:bg-[#071C16] border-[#DDE5DF] dark:border-[#1A4337] text-[#747B76] dark:text-[#9CB0A5]' 
                  : 'bg-[#FCFCF8] dark:bg-[#0E2920] border-[#19B86A]/40 text-[#092B20] dark:text-[#F7FFF9] shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#DDF5E8] dark:bg-[#071C16] border border-[#19B86A]/30 text-[#092B20] dark:text-[#2ED47A] flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#092B20] dark:text-[#F7FFF9] mb-0.5">{n.title}</h4>
                  <p className="text-xs text-[#747B76] dark:text-[#9CB0A5]">{n.message}</p>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="btn-emerald px-3 py-1.5 rounded-xl font-bold text-xs"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
