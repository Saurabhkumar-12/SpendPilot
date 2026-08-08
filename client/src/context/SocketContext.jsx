import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const { showSuccess, showInfo } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  
  // Track processed event IDs to prevent duplicate event handling
  const processedEventIds = useRef(new Set());

  useEffect(() => {
    const token = localStorage.getItem('spendpilot_token');
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Connect authenticated Socket.IO client
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket connected to SpendPilot Real-Time Engine:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket Auth/Connection Warning:', err.message);
    });

    // Real-Time Group Notifications & Toast Dispatcher
    socket.on('group:realtime-event', (eventPayload) => {
      if (!eventPayload || !eventPayload.eventId) return;

      // Duplicate Event Protection
      if (processedEventIds.current.has(eventPayload.eventId)) return;
      processedEventIds.current.add(eventPayload.eventId);

      // Keep set clean (max 500 event IDs)
      if (processedEventIds.current.size > 500) {
        const arr = Array.from(processedEventIds.current);
        processedEventIds.current = new Set(arr.slice(-250));
      }

      const { eventType, actorId, data } = eventPayload;
      const isSelfAction = actorId === user.id;

      // Subtle Toast Notification for other users' actions
      if (!isSelfAction) {
        const actorName = data?.actorName || 'A group member';
        if (eventType === 'group:expense-created') {
          showInfo(`⚡ ${actorName} added "${data?.expense?.description || 'a bill'}" — ₹${data?.expense?.amount?.toLocaleString()}`);
        } else if (eventType === 'group:expense-updated') {
          showInfo(`⚡ ${actorName} updated a group expense.`);
        } else if (eventType === 'group:expense-deleted') {
          showInfo(`⚡ ${actorName} deleted a group expense.`);
        } else if (eventType === 'group:settlement-updated') {
          showSuccess(`⚡ ${actorName} settled ₹${data?.settlement?.amount?.toLocaleString()}`);
        } else if (eventType === 'group:member-added') {
          showInfo(`⚡ ${actorName} added ${data?.member?.userName} to the group.`);
        }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinGroupRoom = (groupId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_group', { groupId });
    }
  };

  const leaveGroupRoom = (groupId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_group', { groupId });
    }
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      joinGroupRoom,
      leaveGroupRoom
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
