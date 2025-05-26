import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameStateManager } from '../services/GameStateManager.js';

/**
 * Custom hook for managing game state dynamically
 * Replaces hardcoded game state with backend-driven initialization
 */
export const useGameState = () => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);

  // Create gameStateManager instance once
  const gameStateManager = useMemo(() => new GameStateManager(), []);

  /**
   * Initialize a new game session
   */
  const initializeGame = useCallback(async (scenario, characterConfig = null) => {
    setLoading(true);
    setError(null);

    try {
      const sessionData = await gameStateManager.createSession(scenario, characterConfig);
      setGameState(sessionData);
      setOfflineMode(false);
      return sessionData;
    } catch (err) {
      console.error('Failed to initialize game:', err);
      
      // Check if we should fall back to offline mode
      if (err.code === 'NETWORK_ERROR' || err.code === 'BACKEND_UNAVAILABLE') {
        console.warn('Backend unavailable, switching to offline mode');
        const offlineState = await gameStateManager.createOfflineSession(scenario, characterConfig);
        setGameState(offlineState);
        setOfflineMode(true);
        setError('Running in offline mode - some features may be limited');
        return offlineState;
      } else {
        setError(err.message || 'Failed to start game');
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, [gameStateManager]);

  /**
   * Load existing game session
   */
  const loadGame = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);

    try {
      const sessionData = await gameStateManager.loadSession(sessionId);
      setGameState(sessionData);
      setOfflineMode(false);
      return sessionData;
    } catch (err) {
      console.error('Failed to load game:', err);
      setError(err.message || 'Failed to load game');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [gameStateManager]);

  /**
   * Update game state
   */
  const updateGameState = useCallback(async (updates) => {
    if (!gameState) return;

    try {
      const updatedState = await gameStateManager.updateSession(gameState.session_id, updates);
      setGameState(updatedState);
      return updatedState;
    } catch (err) {
      console.error('Failed to update game state:', err);
      
      // In offline mode, update locally
      if (offlineMode) {
        const localUpdatedState = { ...gameState, ...updates };
        setGameState(localUpdatedState);
        gameStateManager.saveOfflineSession(localUpdatedState);
        return localUpdatedState;
      }
      
      throw err;
    }
  }, [gameState, offlineMode, gameStateManager]);

  /**
   * Handle player actions
   */
  const handleAction = useCallback(async (action) => {
    if (!gameState) return;

    setLoading(true);
    try {
      const response = await gameStateManager.processAction(gameState.session_id, action, offlineMode);
      setGameState(response.updatedState);
      return response;
    } catch (err) {
      console.error('Failed to process action:', err);
      setError('Failed to process action. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [gameState, offlineMode, gameStateManager]);

  /**
   * Save current game state
   */
  const saveGame = useCallback(async () => {
    if (!gameState) return;

    try {
      await gameStateManager.saveSession(gameState);
      return true;
    } catch (err) {
      console.error('Failed to save game:', err);
      setError('Failed to save game');
      return false;
    }
  }, [gameState, gameStateManager]);

  /**
   * Reset game state
   */
  const resetGame = useCallback(() => {
    setGameState(null);
    setError(null);
    setOfflineMode(false);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (gameState && !offlineMode) {
      const autoSaveInterval = setInterval(() => {
        gameStateManager.autoSave(gameState);
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [gameState, offlineMode, gameStateManager]);

  return {
    gameState,
    loading,
    error,
    offlineMode,
    initializeGame,
    loadGame,
    updateGameState,
    handleAction,
    saveGame,
    resetGame,
    isInitialized: !!gameState,
  };
};

export default useGameState;
