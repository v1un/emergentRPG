// WebSocket Connection Manager Component

'use client';

import React, { useEffect } from 'react';
import { useGameStore, useCurrentSession, useConnectionStatus } from '@/stores/gameStore';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { toast } from 'react-hot-toast';

interface WebSocketManagerProps {
  children?: React.ReactNode;
}

export function WebSocketManager({ children }: WebSocketManagerProps) {
  const currentSession = useCurrentSession();
  const connectionStatus = useConnectionStatus();
  const { setLastError, clearError } = useGameStore();

  // Initialize WebSocket connection for the current session
  const {
    isConnected,
    error,
    connect,
    disconnect,
    clearError: clearWebSocketError
  } = useGameWebSocket(currentSession?.session_id, {
    autoConnect: false, // Disable auto-connect to prevent conflicts
    manageConnection: true, // This component manages the WebSocket connection lifecycle
    onConnect: () => {
      console.log('WebSocket connected successfully');
      clearError();
      toast.success('Connected to game session', {
        duration: 2000,
        position: 'bottom-right',
      });
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
      toast.error('Disconnected from game session', {
        duration: 3000,
        position: 'bottom-right',
      });
    },
    onError: (wsError) => {
      console.error('WebSocket connection error:', wsError);
      setLastError(wsError.message);
      toast.error(`Connection error: ${wsError.message}`, {
        duration: 5000,
        position: 'bottom-right',
      });
    },
  });

  // Handle session changes
  useEffect(() => {
    console.log('WebSocketManager: Session change detected', {
      sessionId: currentSession?.session_id,
      connectionStatus,
      isConnected
    });

    if (currentSession?.session_id) {
      console.log('WebSocketManager: Session loaded, establishing WebSocket connection:', currentSession.session_id);

      // Clear any previous errors
      clearError();
      clearWebSocketError();

      // Connect to the new session
      connect(currentSession.session_id).catch((err) => {
        console.error('WebSocketManager: Failed to connect to WebSocket for session:', currentSession.session_id, err);
        setLastError(`Failed to connect to game session: ${err.message}`);
      });
    } else {
      // Disconnect when no session is active
      console.log('WebSocketManager: No active session, disconnecting WebSocket');
      disconnect();
    }
  }, [currentSession?.session_id]); // Only depend on session ID, functions are stable

  // Handle WebSocket errors
  useEffect(() => {
    if (error) {
      console.error('WebSocket error detected:', error);
      setLastError(error.message);
    }
  }, [error]); // setLastError is stable

  // Note: Cleanup is handled by useGameWebSocket hook when manageConnection=true

  // Log connection status changes for debugging
  useEffect(() => {
    console.log('WebSocket connection status changed:', connectionStatus, 'Connected:', isConnected);
  }, [connectionStatus, isConnected]);

  return (
    <>
      {children}
    </>
  );
}

export default WebSocketManager;
