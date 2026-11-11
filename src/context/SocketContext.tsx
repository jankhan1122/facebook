import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.tsx';
import { Message, Notification, Post } from '../types.ts';

interface SocketContextType {
  socket: Socket | null;
  onlineUserIds: string[];
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  activeChatUserId: string | null;
  setActiveChatUserId: (id: string | null) => void;
  typingUsers: Set<string>; // userIds typing to current user
  sendTyping: (receiverId: string) => void;
  sendStopTyping: (receiverId: string) => void;
  refreshCounters: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Fetch initial counts
  const fetchCounts = async () => {
    if (!token) return;
    try {
      const [notifsRes, convsRes] = await Promise.all([
        fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/messages/conversations', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (notifsRes.ok) {
        const notifs: Notification[] = await notifsRes.json();
        setUnreadNotificationsCount(notifs.filter(n => !n.isRead).length);
      }

      if (convsRes.ok) {
        const convs = await convsRes.json();
        const unreadMsg = convs.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
        setUnreadMessagesCount(unreadMsg);
      }
    } catch (e) {
      // Ignore count fetch errors
    }
  };

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect socket
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      timeout: 5000
    });

    newSocket.on('connect_error', () => {
      // Silent graceful fallback if websockets are unavailable in serverless environment
    });

    newSocket.on('connect', () => {
      newSocket.emit('register_user', user.id);
    });

    newSocket.on('online_users', (users: string[]) => {
      setOnlineUserIds(users);
    });

    newSocket.on('private_message', (msg: Message) => {
      // If chat with this user is not open, increment unread count
      if (activeChatUserId !== msg.senderId) {
        setUnreadMessagesCount(prev => prev + 1);
      }
    });

    newSocket.on('notification', (_notif: Notification) => {
      setUnreadNotificationsCount(prev => prev + 1);
    });

    newSocket.on('user_typing', ({ senderId }: { senderId: string }) => {
      setTypingUsers(prev => new Set(prev).add(senderId));
    });

    newSocket.on('user_stop_typing', ({ senderId }: { senderId: string }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(senderId);
        return next;
      });
    });

    setSocket(newSocket);
    fetchCounts();

    const interval = setInterval(fetchCounts, 15000);

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, [user?.id, token]);

  const sendTyping = (receiverId: string) => {
    if (socket && user) {
      socket.emit('typing', { senderId: user.id, receiverId });
    }
  };

  const sendStopTyping = (receiverId: string) => {
    if (socket && user) {
      socket.emit('stop_typing', { senderId: user.id, receiverId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUserIds,
        unreadMessagesCount,
        unreadNotificationsCount,
        activeChatUserId,
        setActiveChatUserId,
        typingUsers,
        sendTyping,
        sendStopTyping,
        refreshCounters: fetchCounts
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
