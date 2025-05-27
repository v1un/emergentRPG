// Custom hook for performing game actions with optimistic updates

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameAPI } from '@/services/api/client';
import { useGameStore } from '@/stores/gameStore';
import { useGameWebSocket } from './useGameWebSocket';
import { StoryEntry, PlayerAction, ActionResult } from '@/types';
import { QUERY_KEYS, ACTION_TYPES } from '@/utils/constants';
import { generateUUID } from '@/utils/helpers';

interface UseGameActionOptions {
  enableOptimisticUpdates?: boolean;
  enableWebSocket?: boolean;
  onSuccess?: (result: ActionResult) => void;
  onError?: (error: Error) => void;
}

interface UseGameActionReturn {
  performAction: (action: string) => Promise<ActionResult | void>;
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
}

export function useGameAction(
  sessionId: string,
  options: UseGameActionOptions = {}
): UseGameActionReturn {
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  
  const {
    enableOptimisticUpdates = true,
    enableWebSocket = true,
    onSuccess,
    onError,
  } = options;

  const {
    currentSession,
    addStoryEntry,
    replaceStoryEntry,
    removeStoryEntry,
    addActionToHistory,
    setPerformingAction,
    setLastError,
  } = useGameStore();

  const { sendAction: sendWebSocketAction, isConnected } = useGameWebSocket(sessionId);

  // REST API mutation for fallback
  const actionMutation = useMutation({
    mutationFn: async ({ sessionId, action }: { sessionId: string; action: string }) => {
      return gameAPI.performAction(sessionId, action);
    },
    onMutate: async ({ action }) => {
      if (!enableOptimisticUpdates) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.SESSION(sessionId) });

      // Snapshot the previous value
      const previousSession = queryClient.getQueryData(QUERY_KEYS.SESSION(sessionId));

      // Create optimistic story entry
      const tempEntry: StoryEntry = {
        id: `temp-${generateUUID()}`,
        type: ACTION_TYPES.PLAYER as any,
        text: action,
        timestamp: new Date().toISOString(),
      };

      // Optimistically update the UI
      addStoryEntry(tempEntry);

      // Return context for rollback
      return { previousSession, tempEntry };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update
      if (context?.tempEntry) {
        removeStoryEntry(context.tempEntry.id);
      }

      // Restore previous session data
      if (context?.previousSession) {
        queryClient.setQueryData(QUERY_KEYS.SESSION(sessionId), context.previousSession);
      }

      const error = err as Error;
      setError(error);
      setLastError(error.message);
      onError?.(error);
    },
    onSuccess: (result, variables, context) => {
      // Replace optimistic entry with server response
      if (context?.tempEntry && result.action_result.player_action) {
        replaceStoryEntry(context.tempEntry.id, result.action_result.player_action);
      }

      // Add AI response
      if (result.action_result.ai_response) {
        addStoryEntry(result.action_result.ai_response);
      }

      // Update session cache
      if (result.updated_session) {
        queryClient.setQueryData(QUERY_KEYS.SESSION(sessionId), { session: result.updated_session });
      }

      // Add to action history
      const playerAction: PlayerAction = {
        sessionId,
        action: variables.action,
        timestamp: new Date(),
      };
      addActionToHistory(playerAction);

      onSuccess?.(result);
    },
  });

  // Main action performer
  const performAction = useCallback(async (action: string): Promise<ActionResult | void> => {
    if (!action.trim()) {
      throw new Error('Action cannot be empty');
    }

    setError(null);
    setPerformingAction(true);

    try {
      // Try WebSocket first if connected and enabled
      if (enableWebSocket && isConnected) {
        try {
          sendWebSocketAction(action);
          
          // Add to action history for WebSocket actions
          const playerAction: PlayerAction = {
            sessionId,
            action,
            timestamp: new Date(),
          };
          addActionToHistory(playerAction);
          
          // WebSocket actions don't return a result immediately
          return;
        } catch (wsError) {
          console.warn('WebSocket action failed, falling back to REST API:', wsError);
        }
      }

      // Fallback to REST API
      const result = await actionMutation.mutateAsync({ sessionId, action });
      return result;

    } catch (err) {
      const error = err as Error;
      setError(error);
      setLastError(error.message);
      throw error;
    } finally {
      setPerformingAction(false);
    }
  }, [
    sessionId,
    enableWebSocket,
    isConnected,
    sendWebSocketAction,
    actionMutation,
    addActionToHistory,
    setPerformingAction,
    setLastError,
  ]);

  const clearError = useCallback(() => {
    setError(null);
    setLastError(null);
  }, [setLastError]);

  return {
    performAction,
    isLoading: actionMutation.isPending,
    error: error || actionMutation.error,
    clearError,
  };
}

export default useGameAction;
