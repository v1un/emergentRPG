// Custom hook for WebSocket game communication

import { useEffect, useCallback, useState } from 'react';
import { gameWebSocket } from '@/services/websocket/gameWebSocket';
import { useGameStore } from '@/stores/gameStore';
import { GameMessage, WebSocketCallbacks } from '@/types';

interface UseGameWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
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

  const { autoConnect = true, onConnect, onDisconnect, onError } = options;

  // Memoize WebSocket callbacks to prevent unnecessary reconnections
  const callbacks: WebSocketCallbacks = useCallback(() => ({
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
  }), [
    setConnectionStatus,
    setConnected,
    addStoryEntry,
    updateWorldState,
    setAIGenerating,
    setLastError,
    onConnect,
    onDisconnect,
    onError,
  ]);

  // Connect function
  const connect = useCallback(async (targetSessionId: string) => {
    try {
      setError(null);
      setConnectionStatus('connecting');
      await gameWebSocket.connect(targetSessionId, callbacks());
    } catch (err) {
      const error = err as Error;
      setError(error);
      setConnectionStatus('error');
      setLastError(error.message);
      throw error;
    }
  }, [callbacks, setConnectionStatus, setLastError]);

  // Disconnect function
  const disconnect = useCallback(() => {
    gameWebSocket.disconnect();
    setConnectionStatus('disconnected');
    setConnected(false);
  }, [setConnectionStatus, setConnected]);

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
  }, [setAIGenerating, setLastError]);

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
  }, [setLastError]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
    setLastError(null);
  }, [setLastError]);

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
  }, [autoConnect, sessionId, connect]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (gameWebSocket.isConnected()) {
        disconnect();
      }
    };
  }, [disconnect]);

  // Sync connection status with WebSocket service (reduced frequency)
  useEffect(() => {
    const interval = setInterval(() => {
      const wsStatus = gameWebSocket.getConnectionStatus();
      const wsConnected = gameWebSocket.isConnected();

      if (wsStatus !== connectionStatus) {
        setConnectionStatus(wsStatus);
      }

      if (wsConnected !== isConnected) {
        setConnected(wsConnected);
      }
    }, 2000); // Reduced from 1000ms to 2000ms

    return () => clearInterval(interval);
  }, [connectionStatus, isConnected, setConnectionStatus, setConnected]);

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
