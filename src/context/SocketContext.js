import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  /* Event listeners stored as refs so they persist across reconnects */
  const eventHandlers = useRef({});

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    /* Create socket connection */
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
      socket.emit('setup');
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setIsConnected(false);
    });

    /* Re-attach all stored event handlers */
    Object.entries(eventHandlers.current).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token]);

  /* Register an event listener (persists across reconnects) */
  const on = useCallback((event, handler) => {
    eventHandlers.current[event] = handler;
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  /* Remove an event listener */
  const off = useCallback((event) => {
    delete eventHandlers.current[event];
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  }, []);

  /* Emit an event */
  const emit = useCallback((event, data, callback) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data, callback);
    } else {
      console.warn('[Socket] Cannot emit — not connected');
      callback?.({ success: false, message: 'Not connected to server' });
    }
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected,
    on,
    off,
    emit,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}