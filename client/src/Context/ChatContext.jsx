import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { createSocket, releaseSocket, disconnectSocket } from '../Services/socket';
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
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);

// Connect socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      // On logout, tear down the shared socket so the next user gets a clean
      // connection (and no stale listeners/state).
      disconnectSocket();
      socketRef.current = null;
      return undefined;
    }
    const socket = createSocket();
    socketRef.current = socket;

    socket.emit('join-room', user._id);
    socket.emit('presence:online', { userId: user._id });
    if (user.role === 'admin') {
      socket.emit('join-admin-inbox');
    }

    const onNotification = (notification) => {
      setNotifications((current) => [notification, ...current]);
      setUnreadCount((c) => c + 1);
    };
    const onMessage = ({ conversationId: _conversationId, message }) => {
      if (message.sender?._id !== user._id && message.sender !== user._id) {
        setUnreadCount((c) => c + 1);
      }
    };
    const onTyping = ({ conversationId, userId: typingUserId, name, isTyping }) => {
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
    };
    const onPresence = ({ userId, online }) => {
      setOnlinePresence((current) => ({ ...current, [userId]: online }));
    };
    const onDeliveryStatus = (data) => {
      setDeliveryStatus(data);
    };
    const onDeliveryLocation = (data) => {
      setDeliveryLocation(data);
    };

    socket.on('notification:new', onNotification);
    socket.on('message:new', onMessage);
    socket.on('typing', onTyping);
    socket.on('presence:update', onPresence);
    socket.on('delivery:status', onDeliveryStatus);
    socket.on('delivery:location', onDeliveryLocation);
    socket.on('delivery:assigned', onDeliveryStatus);

    return () => {
      socket.emit('presence:offline', { userId: user._id });
      socket.off('notification:new', onNotification);
      socket.off('message:new', onMessage);
      socket.off('typing', onTyping);
      socket.off('presence:update', onPresence);
      socket.off('delivery:status', onDeliveryStatus);
      socket.off('delivery:location', onDeliveryLocation);
      socket.off('delivery:assigned', onDeliveryStatus);
      releaseSocket();
      socketRef.current = socket.connected ? socket : null;
      setNotifications([]);
      setUnreadCount(0);
      setTypingUsers({});
      setActiveConversation(null);
      setOnlinePresence({});
      setDeliveryStatus(null);
      setDeliveryLocation(null);
    };
  }, [isAuthenticated, user?._id, user?.role]);

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
    deliveryStatus,
    deliveryLocation,
    setDeliveryStatus,
    setDeliveryLocation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
