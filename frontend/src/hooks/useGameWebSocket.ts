// Custom hook for WebSocket game communication

import { useEffect, useCallback, useState, useMemo } from 'react';
import { gameWebSocket } from '@/services/websocket/gameWebSocket';
import { useGameStore } from '@/stores/gameStore';
import { GameMessage, WebSocketCallbacks } from '@/types';

interface UseGameWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  manageConnection?: boolean; // Only WebSocketManager should set this to true
}

interface UseGameWebSocketReturn {
  isConnected: boolean;
  connectionStatus: string;
  lastMessage: GameMessage | null;
  error: Error | null;
  connect: (sessionId: string) => Promise<void>;
  disconnect: () => void;
  sendAction: (action: string) => void;
  sendMessage: (message: any) => void;
  clearError: () => void;
}

export function useGameWebSocket(
  sessionId?: string,
  options: UseGameWebSocketOptions = {}
): UseGameWebSocketReturn {
  const [lastMessage, setLastMessage] = useState<GameMessage | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const {
    connectionStatus,
    isConnected,
    setConnectionStatus,
    setConnected,
    addStoryEntry,
    updateWorldState,
    setAIGenerating,
    setLastError,
  } = useGameStore();

  const { autoConnect = true, onConnect, onDisconnect, onError, manageConnection = false } = options;

  // Memoize WebSocket callbacks to prevent unnecessary reconnections
  const callbacks: WebSocketCallbacks = useMemo(() => ({
    onConnect: () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
      setConnected(true);
      setError(null);
      onConnect?.();
    },

    onDisconnect: () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
      setConnected(false);
      onDisconnect?.();
    },

    onNarrativeUpdate: (data) => {
      console.log('Received narrative update:', data);

      // Add story entry if provided
      if (data.story_entry) {
        addStoryEntry(data.story_entry);
      }

      // Update world state if provided
      if (data.world_changes) {
        updateWorldState(data.world_changes);
      }

      // Stop AI generation indicator
      setAIGenerating(false);

      setLastMessage({ type: 'narrative', data });
    },

    onWorldUpdate: (data) => {
      console.log('Received world update:', data);

      if (data.world_state) {
        updateWorldState(data.world_state);
      }

      setLastMessage({ type: 'world', data });
    },

    onCharacterUpdate: (data) => {
      console.log('Received character update:', data);

      // Update character in current session
      // This would need to be implemented in the store

      setLastMessage({ type: 'character', data });
    },

    onQuestUpdate: (data) => {
      console.log('Received quest update:', data);

      // Update quests in current session
      // This would need to be implemented in the store

      setLastMessage({ type: 'quest', data });
    },

    onError: (wsError) => {
      console.error('WebSocket error:', wsError);
      setError(wsError);
      setConnectionStatus('error');
      setLastError(wsError.message);
      onError?.(wsError);
    },
  }), []); // Empty deps - all functions are either stable or captured in closure

  // Connect function
  const connect = useCallback(async (targetSessionId: string) => {
    try {
      setError(null);
      setConnectionStatus('connecting');
      await gameWebSocket.connect(targetSessionId, callbacks);
    } catch (err) {
      const error = err as Error;
      setError(error);
      setConnectionStatus('error');
      setLastError(error.message);
      throw error;
    }
  }, [callbacks]); // Zustand store functions are stable, no need to include in deps

  // Disconnect function
  const disconnect = useCallback(() => {
    gameWebSocket.disconnect();
    setConnectionStatus('disconnected');
    setConnected(false);
  }, []); // Zustand store functions are stable, no need to include in deps

  // Send action function
  const sendAction = useCallback((action: string) => {
    try {
      if (!gameWebSocket.isConnected()) {
        throw new Error('WebSocket not connected');
      }

      // Set AI generation indicator
      setAIGenerating(true);

      // Send action through WebSocket
      gameWebSocket.sendAction(action);

    } catch (err) {
      const error = err as Error;
      setError(error);
      setAIGenerating(false);
      setLastError(error.message);
      throw error;
    }
  }, []); // Zustand store functions are stable, no need to include in deps

  // Send generic message function
  const sendMessage = useCallback((message: any) => {
    try {
      if (!gameWebSocket.isConnected()) {
        throw new Error('WebSocket not connected');
      }

      gameWebSocket.sendMessage(message);

    } catch (err) {
      const error = err as Error;
      setError(error);
      setLastError(error.message);
      throw error;
    }
  }, []); // Zustand store functions are stable, no need to include in deps

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
    setLastError(null);
  }, []); // Zustand store functions are stable, no need to include in deps

  // Auto-connect effect with debouncing
  useEffect(() => {
    if (!autoConnect || !sessionId) {
      return;
    }

    // Don't auto-connect if already connected to the same session
    if (gameWebSocket.isConnected() && gameWebSocket.getSessionId() === sessionId) {
      return;
    }

    // Don't auto-connect if already connecting
    if (gameWebSocket.getConnectionStatus() === 'connecting') {
      return;
    }

    // Debounce connection attempts
    const timeoutId = setTimeout(() => {
      connect(sessionId).catch((err) => {
        console.error('Auto-connect failed:', err);
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [autoConnect, sessionId]); // Remove connect from deps since it's stable now

  // Cleanup effect - only disconnect if this hook manages the connection
  useEffect(() => {
    return () => {
      if (manageConnection && gameWebSocket.isConnected()) {
        disconnect();
      }
    };
  }, [manageConnection]); // Only cleanup if this hook manages the connection

  // Sync connection status with WebSocket service on mount only
  useEffect(() => {
    // Initial sync
    const wsStatus = gameWebSocket.getConnectionStatus();
    const wsConnected = gameWebSocket.isConnected();

    if (wsStatus !== connectionStatus) {
      setConnectionStatus(wsStatus);
    }

    if (wsConnected !== isConnected) {
      setConnected(wsConnected);
    }
  }, []); // Only run on mount, callbacks handle real-time updates

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    connect,
    disconnect,
    sendAction,
    sendMessage,
    clearError,
  };
}

export default useGameWebSocket;
