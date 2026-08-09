import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { createSocket } from '../Services/socket';
import { useAuth } from './Authcontext';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [onlinePresence, setOnlinePresence] = useState({});

  // Connect socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return undefined;
    const socket = createSocket();
    socketRef.current = socket;

    socket.emit('join-room', user._id);
    socket.emit('presence:online', { userId: user._id });

    socket.on('notification:new', (notification) => {
      setNotifications((current) => [notification, ...current]);
      setUnreadCount((c) => c + 1);
    });

    socket.on('message:new', ({ conversationId, message }) => {
      if (message.sender?._id !== user._id && message.sender !== user._id) {
        setUnreadCount((c) => c + 1);
      }
    });

    socket.on('typing', ({ conversationId, userId: typingUserId, name, isTyping }) => {
      if (typingUserId === user._id) return;
      setTypingUsers((current) => {
        const next = { ...current };
        if (isTyping) {
          next[conversationId] = name || 'Someone';
        } else {
          delete next[conversationId];
        }
        return next;
      });
    });

    socket.on('presence:update', ({ userId, online }) => {
      setOnlinePresence((current) => ({ ...current, [userId]: online }));
    });

    return () => {
      socket.emit('presence:offline', { userId: user._id });
      socket.disconnect();
      socketRef.current = null;
      // Clear all user-specific chat state on logout so the next user never
      // sees the previous user's notifications/messages.
      setNotifications([]);
      setUnreadCount(0);
      setTypingUsers({});
      setActiveConversation(null);
      setOnlinePresence({});
    };
  }, [isAuthenticated, user?._id]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('join-conversation', conversationId);
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-conversation', conversationId);
    }
  }, []);

  const sendTyping = useCallback((conversationId, isTyping) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing', {
      conversationId,
      userId: user?._id,
      name: user?.name,
      isTyping,
    });
  }, [user?._id, user?.name]);

  const emitReadReceipt = useCallback((conversationId, messageId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('message:read', {
      conversationId,
      messageId,
      userId: user?._id,
    });
  }, [user?._id]);

  const clearNotifications = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const value = {
    socketRef,
    notifications,
    unreadCount,
    typingUsers,
    onlinePresence,
    activeConversation,
    setActiveConversation,
    joinConversation,
    leaveConversation,
    sendTyping,
    emitReadReceipt,
    clearNotifications,
    setUnreadCount,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
