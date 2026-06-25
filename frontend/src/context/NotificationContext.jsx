import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [unreadTickets,  setUnreadTickets]  = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading,        setLoading]        = useState(false);

  const fetchCounts = useCallback(async () => {
    // Only fetch if logged in
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const [notifRes, chatRes] = await Promise.all([
        api.get('/support/notifications/unread-count'),
        api.get('/support/chat/unread-count'),
      ]);
      setUnreadTickets(notifRes.data?.unread  ?? 0);
      setUnreadMessages(chatRes.data?.unread  ?? 0);
    } catch {
      // Silent fail — user logout ho gaya ho to 401 aayega
    }
  }, []);

  // On mount + every 30 seconds poll
  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Manual refresh — kisi bhi component se call kar sako
  const refresh = useCallback(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Badge string — "99+" agar 99 se zyada
  const ticketBadge  = unreadTickets  > 99 ? '99+' : String(unreadTickets  || '');
  const messageBadge = unreadMessages > 99 ? '99+' : String(unreadMessages || '');
  const totalUnread  = unreadTickets + unreadMessages;
  const totalBadge   = totalUnread   > 99 ? '99+' : String(totalUnread   || '');

  return (
    <NotificationContext.Provider value={{
      unreadTickets,
      unreadMessages,
      totalUnread,
      ticketBadge,
      messageBadge,
      totalBadge,
      loading,
      refresh,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook — kisi bhi component mein use karo
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}

export default NotificationContext;
