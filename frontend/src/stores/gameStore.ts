// Global Game State Management with Zustand

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  GameSession,
  StoryEntry,
  WorldState,
  PlayerAction,
  ConnectionStatus,
  ActivePanel,
  UIConfig,
  Theme
} from '@/types';
import { PANELS, CONNECTION_STATUSES, THEMES } from '@/utils/constants';

interface GameState {
  // Session Management
  currentSession: GameSession | null;
  sessionHistory: GameSession[];
  
  // Real-time State
  isConnected: boolean;
  isAIGenerating: boolean;
  lastUpdate: Date;
  connectionStatus: ConnectionStatus;
  
  // UI State
  activePanel: ActivePanel;
  theme: Theme;
  uiConfig: UIConfig;
  sidebarCollapsed: boolean;
  isMobile: boolean;
  
  // Game State
  pendingActions: PlayerAction[];
  actionHistory: PlayerAction[];
  
  // Loading States
  isLoadingSession: boolean;
  isPerformingAction: boolean;
  
  // Error State
  lastError: string | null;
  
  // Actions
  setCurrentSession: (session: GameSession | null) => void;
  updateSession: (updates: Partial<GameSession>) => void;
  addSessionToHistory: (session: GameSession) => void;
  removeSessionFromHistory: (sessionId: string) => void;
  
  updateWorldState: (worldState: Partial<WorldState>) => void;
  addStoryEntry: (entry: StoryEntry) => void;
  replaceStoryEntry: (tempId: string, newEntry: StoryEntry) => void;
  removeStoryEntry: (entryId: string) => void;
  
  setAIGenerating: (generating: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setConnected: (connected: boolean) => void;
  
  addPendingAction: (action: PlayerAction) => void;
  removePendingAction: (action: PlayerAction) => void;
  clearPendingActions: () => void;
  addActionToHistory: (action: PlayerAction) => void;
  
  setActivePanel: (panel: ActivePanel) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setIsMobile: (isMobile: boolean) => void;
  updateUIConfig: (config: Partial<UIConfig>) => void;
  
  setLoadingSession: (loading: boolean) => void;
  setPerformingAction: (performing: boolean) => void;
  setLastError: (error: string | null) => void;
  
  // Utility actions
  reset: () => void;
  clearError: () => void;
}

const defaultUIConfig: UIConfig = {
  theme: 'auto',
  sidebarCollapsed: false,
  activePanel: 'story',
  showMinimap: true,
  enableAnimations: true,
  enableSounds: false,
  fontSize: 'medium',
  autoSave: true,
  autoSaveInterval: 30000,
};

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentSession: null,
    sessionHistory: [],
    isConnected: false,
    isAIGenerating: false,
    lastUpdate: new Date(),
    connectionStatus: CONNECTION_STATUSES.DISCONNECTED as ConnectionStatus,
    activePanel: PANELS.SESSIONS as ActivePanel,
    theme: THEMES.AUTO as Theme,
    uiConfig: defaultUIConfig,
    sidebarCollapsed: false,
    isMobile: false,
    pendingActions: [],
    actionHistory: [],
    isLoadingSession: false,
    isPerformingAction: false,
    lastError: null,

    // Session Management Actions
    setCurrentSession: (session) => {
      set({ 
        currentSession: session,
        lastUpdate: new Date(),
        lastError: null
      });
    },

    updateSession: (updates) => {
      const currentSession = get().currentSession;
      if (currentSession) {
        set({
          currentSession: { ...currentSession, ...updates },
          lastUpdate: new Date()
        });
      }
    },

    addSessionToHistory: (session) => {
      set((state) => {
        const filteredHistory = state.sessionHistory.filter(s => s.session_id !== session.session_id);
        const newHistory = [session, ...filteredHistory];
        // Limit session history to prevent memory leaks (keep last 50 sessions)
        const limitedHistory = newHistory.slice(0, 50);
        return {
          sessionHistory: limitedHistory
        };
      });
    },

    removeSessionFromHistory: (sessionId) => {
      set((state) => ({
        sessionHistory: state.sessionHistory.filter(s => s.session_id !== sessionId)
      }));
    },

    // World and Story Actions
    updateWorldState: (worldState) => {
      const currentSession = get().currentSession;
      if (currentSession) {
        set({
          currentSession: {
            ...currentSession,
            world_state: { ...currentSession.world_state, ...worldState }
          },
          lastUpdate: new Date()
        });
      }
    },

    addStoryEntry: (entry) => {
      const currentSession = get().currentSession;
      if (currentSession) {
        set({
          currentSession: {
            ...currentSession,
            story: [...currentSession.story, entry]
          },
          lastUpdate: new Date()
        });
      }
    },

    replaceStoryEntry: (tempId, newEntry) => {
      const currentSession = get().currentSession;
      if (currentSession) {
        const updatedStory = currentSession.story.map(entry => 
          entry.id === tempId ? newEntry : entry
        );
        set({
          currentSession: {
            ...currentSession,
            story: updatedStory
          },
          lastUpdate: new Date()
        });
      }
    },

    removeStoryEntry: (entryId) => {
      const currentSession = get().currentSession;
      if (currentSession) {
        set({
          currentSession: {
            ...currentSession,
            story: currentSession.story.filter(entry => entry.id !== entryId)
          },
          lastUpdate: new Date()
        });
      }
    },

    // Connection Actions
    setAIGenerating: (generating) => {
      set({ isAIGenerating: generating });
    },

    setConnectionStatus: (status) => {
      set((state) => {
        // Only update if status actually changed
        if (state.connectionStatus === status) {
          return state;
        }
        return {
          connectionStatus: status,
          isConnected: status === CONNECTION_STATUSES.CONNECTED
        };
      });
    },

    setConnected: (connected) => {
      set((state) => {
        // Only update if connection state actually changed
        if (state.isConnected === connected) {
          return state;
        }
        return {
          isConnected: connected,
          connectionStatus: connected ? CONNECTION_STATUSES.CONNECTED : CONNECTION_STATUSES.DISCONNECTED
        };
      });
    },

    // Action Management
    addPendingAction: (action) => {
      set((state) => ({
        pendingActions: [...state.pendingActions, action]
      }));
    },

    removePendingAction: (actionToRemove) => {
      set((state) => ({
        pendingActions: state.pendingActions.filter(action => 
          action.sessionId !== actionToRemove.sessionId || 
          action.action !== actionToRemove.action ||
          action.timestamp !== actionToRemove.timestamp
        )
      }));
    },

    clearPendingActions: () => {
      set({ pendingActions: [] });
    },

    addActionToHistory: (action) => {
      set((state) => ({
        actionHistory: [action, ...state.actionHistory].slice(0, 100) // Keep last 100 actions
      }));
    },

    // UI Actions
    setActivePanel: (panel) => {
      set({ activePanel: panel });
    },

    setTheme: (theme: Theme) => {
      set({ theme });
    },

    setSidebarCollapsed: (collapsed) => {
      set({ sidebarCollapsed: collapsed });
    },

    toggleSidebar: () => {
      set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
    },

    setIsMobile: (isMobile) => {
      set({ isMobile });
    },

    updateUIConfig: (config) => {
      set((state) => ({
        uiConfig: { ...state.uiConfig, ...config }
      }));
    },

    // Loading Actions
    setLoadingSession: (loading) => {
      set({ isLoadingSession: loading });
    },

    setPerformingAction: (performing) => {
      set({ isPerformingAction: performing });
    },

    setLastError: (error) => {
      set({ lastError: error });
    },

    // Utility Actions
    reset: () => {
      set({
        currentSession: null,
        sessionHistory: [],
        isConnected: false,
        isAIGenerating: false,
        connectionStatus: CONNECTION_STATUSES.DISCONNECTED as ConnectionStatus,
        pendingActions: [],
        actionHistory: [],
        isLoadingSession: false,
        isPerformingAction: false,
        lastError: null,
        lastUpdate: new Date()
      });
    },

    clearError: () => {
      set({ lastError: null });
    },
  }))
);

// Selectors for optimized component subscriptions
export const useCurrentSession = () => useGameStore((state) => state.currentSession);
export const useConnectionStatus = () => useGameStore((state) => state.connectionStatus);
export const useIsAIGenerating = () => useGameStore((state) => state.isAIGenerating);
export const useActivePanel = () => useGameStore((state) => state.activePanel);
export const useTheme = () => useGameStore((state) => state.theme);
export const useSidebarCollapsed = () => useGameStore((state) => state.sidebarCollapsed);
export const usePendingActions = () => useGameStore((state) => state.pendingActions);
export const useLastError = () => useGameStore((state) => state.lastError);
export const useIsLoadingSession = () => useGameStore((state) => state.isLoadingSession);
export const useIsPerformingAction = () => useGameStore((state) => state.isPerformingAction);

// Computed selectors with stable empty arrays
const EMPTY_ARRAY: any[] = [];

export const useCurrentStory = () => useGameStore((state) => state.currentSession?.story ?? EMPTY_ARRAY);
export const useCurrentCharacter = () => useGameStore((state) => state.currentSession?.character);
export const useCurrentWorldState = () => useGameStore((state) => state.currentSession?.world_state);
export const useCurrentInventory = () => useGameStore((state) => state.currentSession?.inventory ?? EMPTY_ARRAY);
export const useCurrentQuests = () => useGameStore((state) => state.currentSession?.quests ?? EMPTY_ARRAY);

export default useGameStore;
