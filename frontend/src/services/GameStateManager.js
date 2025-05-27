import { getFallbackData } from '../utils/fallbackData.js';

/**
 * GameStateManager - Handles all game state operations
 * Replaces hardcoded logic with dynamic backend communication
 */
export class GameStateManager {
  constructor() {
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  /**
   * Create a new game session
   */
  async createSession(scenario, characterConfig = null) {
    try {
      const response = await this.fetchWithRetry('/api/game/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario_template_id: scenario.id,
          lorebook_id: scenario.lorebook_id,
          character_config: characterConfig,
          scenario_type: scenario.type || 'fantasy',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const sessionData = await response.json();

      // Store session locally for offline access
      this.storeSessionLocally(sessionData);

      return sessionData;
    } catch (error) {
      console.error('Error creating session:', error);
      throw this.classifyError(error);
    }
  }

  /**
   * Create offline session using fallback data
   */
  async createOfflineSession(scenario, characterConfig = null) {
    const fallbackData = getFallbackData();

    const offlineSession = {
      session_id: `offline_${Date.now()}`,
      scenario: scenario,
      character: characterConfig || fallbackData.defaultCharacter,
      inventory: fallbackData.defaultInventory,
      quests: fallbackData.defaultQuests,
      story: [
        {
          type: 'narration',
          text: scenario.initial_narrative || scenario.intro || `Welcome to ${scenario.title}. Your adventure begins...`,
          metadata: {
            source: scenario.initial_narrative ? 'ai_generated' : 'fallback',
            scenario_id: scenario.id
          }
        },
      ],
      world_state: fallbackData.defaultWorldState,
      created_at: new Date().toISOString(),
      offline: true,
    };

    this.saveOfflineSession(offlineSession);
    return offlineSession;
  }

  /**
   * Load existing game session
   */
  async loadSession(sessionId) {
    try {
      // Check if it's an offline session
      if (sessionId.startsWith('offline_')) {
        return this.loadOfflineSession(sessionId);
      }

      const response = await this.fetchWithRetry(`/api/game/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.statusText}`);
      }

      const sessionData = await response.json();
      this.storeSessionLocally(sessionData);

      return sessionData;
    } catch (error) {
      console.error('Error loading session:', error);
      throw this.classifyError(error);
    }
  }

  /**
   * Update game session
   */
  async updateSession(sessionId, updates) {
    try {
      if (sessionId.startsWith('offline_')) {
        return this.updateOfflineSession(sessionId, updates);
      }

      const response = await this.fetchWithRetry(`/api/game/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update session: ${response.statusText}`);
      }

      const updatedSession = await response.json();
      this.storeSessionLocally(updatedSession);

      return updatedSession;
    } catch (error) {
      console.error('Error updating session:', error);
      throw this.classifyError(error);
    }
  }

  /**
   * Process player action
   */
  async processAction(sessionId, action, offlineMode = false) {
    try {
      if (offlineMode || sessionId.startsWith('offline_')) {
        return this.processOfflineAction(sessionId, action);
      }

      const response = await this.fetchWithRetry(`/api/game/sessions/${sessionId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to process action: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        this.storeSessionLocally(result.updated_session);
        return {
          success: true,
          updatedState: result.updated_session,
          response: result.ai_response,
        };
      } else {
        throw new Error(result.error || 'Action processing failed');
      }
    } catch (error) {
      console.error('Error processing action:', error);

      // Fallback to offline processing for network errors
      if (error.code === 'NETWORK_ERROR') {
        console.warn('Network error, falling back to offline action processing');
        return this.processOfflineAction(sessionId, action);
      }

      throw this.classifyError(error);
    }
  }

  /**
   * Process action offline using simple response generation
   */
  async processOfflineAction(sessionId, action) {
    const session = sessionId.startsWith('offline_')
      ? this.loadOfflineSession(sessionId)
      : this.getStoredSession(sessionId);

    if (!session) {
      throw new Error('Session not found for offline processing');
    }

    // Simple offline response generation
    const offlineResponse = this.generateOfflineResponse(action);

    const updatedSession = {
      ...session,
      story: [
        ...session.story,
        { type: 'action', text: action },
        { type: 'narration', text: offlineResponse },
      ],
      last_updated: new Date().toISOString(),
    };

    this.saveOfflineSession(updatedSession);

    return {
      success: true,
      updatedState: updatedSession,
      response: offlineResponse,
      offline: true,
    };
  }

  /**
   * Generate simple offline response
   */
  generateOfflineResponse(_action) {
    const responses = [
      'Your action echoes through the realm as mysterious forces respond...',
      'The world shifts slightly in response to your choice...',
      'Something stirs in the shadows as you take action...',
      'The air crackles with potential as events unfold...',
      'Your decision ripples through the fabric of this world...',
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Save session
   */
  async saveSession(session) {
    if (session.offline || session.session_id.startsWith('offline_')) {
      this.saveOfflineSession(session);
      return true;
    }

    try {
      const response = await this.fetchWithRetry(`/api/game/sessions/${session.session_id}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });

      return response.ok;
    } catch (error) {
      console.error('Error saving session:', error);
      // Fallback to local storage
      this.saveOfflineSession(session);
      return true;
    }
  }

  /**
   * Auto-save functionality
   */
  async autoSave(session) {
    try {
      await this.saveSession(session);
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }

  /**
   * Store session locally for offline access
   */
  storeSessionLocally(session) {
    try {
      const sessions = JSON.parse(localStorage.getItem('game_sessions') || '{}');
      sessions[session.session_id] = {
        ...session,
        stored_at: new Date().toISOString(),
      };
      localStorage.setItem('game_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.warn('Failed to store session locally:', error);
    }
  }

  /**
   * Get stored session from local storage
   */
  getStoredSession(sessionId) {
    try {
      const sessions = JSON.parse(localStorage.getItem('game_sessions') || '{}');
      return sessions[sessionId];
    } catch (error) {
      console.warn('Failed to retrieve stored session:', error);
      return null;
    }
  }

  /**
   * Save offline session
   */
  saveOfflineSession(session) {
    try {
      const offlineSessions = JSON.parse(localStorage.getItem('offline_sessions') || '{}');
      offlineSessions[session.session_id] = session;
      localStorage.setItem('offline_sessions', JSON.stringify(offlineSessions));
    } catch (error) {
      console.warn('Failed to save offline session:', error);
    }
  }

  /**
   * Load offline session
   */
  loadOfflineSession(sessionId) {
    try {
      const offlineSessions = JSON.parse(localStorage.getItem('offline_sessions') || '{}');
      return offlineSessions[sessionId];
    } catch (error) {
      console.warn('Failed to load offline session:', error);
      return null;
    }
  }

  /**
   * Update offline session
   */
  updateOfflineSession(sessionId, updates) {
    const session = this.loadOfflineSession(sessionId);
    if (!session) {
      throw new Error('Offline session not found');
    }

    const updatedSession = { ...session, ...updates };
    this.saveOfflineSession(updatedSession);
    return updatedSession;
  }

  /**
   * Fetch with retry logic
   */
  async fetchWithRetry(url, options = {}, attempt = 1) {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        timeout: 10000,
        ...options,
      });

      return response;
    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Determine if error should trigger retry
   */
  shouldRetry(error) {
    return error.name === 'TypeError' || // Network error
           error.code === 'ECONNREFUSED' ||
           error.code === 'ETIMEDOUT';
  }

  /**
   * Classify error for better handling
   */
  classifyError(error) {
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      return { ...error, code: 'NETWORK_ERROR' };
    }
    if (error.message.includes('500') || error.message.includes('503')) {
      return { ...error, code: 'BACKEND_UNAVAILABLE' };
    }
    return error;
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default GameStateManager;
