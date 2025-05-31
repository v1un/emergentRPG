// Mock implementation of gameStore for testing

import { mockCharacter, mockInventory, mockQuests, mockWorldState, mockStory } from '@/utils/test-utils';

const mockGameStore = {
  currentSession: {
    session_id: 'test-session-1',
    character: mockCharacter,
    inventory: mockInventory,
    quests: mockQuests,
    world_state: mockWorldState,
    story: mockStory,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T12:02:00Z',
  },
  connectionStatus: 'connected' as const,
  isAIGenerating: false,
  activePanel: 'story' as const,
  theme: 'dark' as const,
  sidebarCollapsed: false,
  pendingActions: [],
  lastError: null,
  isLoadingSession: false,
  isPerformingAction: false,
  
  // Actions
  setCurrentSession: jest.fn(),
  updateSession: jest.fn(),
  clearSession: jest.fn(),
  setConnectionStatus: jest.fn(),
  setIsAIGenerating: jest.fn(),
  setActivePanel: jest.fn(),
  setTheme: jest.fn(),
  setSidebarCollapsed: jest.fn(),
  addPendingAction: jest.fn(),
  removePendingAction: jest.fn(),
  clearPendingActions: jest.fn(),
  setLastError: jest.fn(),
  clearLastError: jest.fn(),
  setIsLoadingSession: jest.fn(),
  setIsPerformingAction: jest.fn(),
  performAction: jest.fn(),
  loadSession: jest.fn(),
  createNewSession: jest.fn(),
};

// Create the mock store
export const useGameStore = jest.fn((selector) => {
  if (typeof selector === 'function') {
    return selector(mockGameStore);
  }
  return mockGameStore;
});

// Mock selectors
export const useCurrentSession = jest.fn(() => mockGameStore.currentSession);
export const useConnectionStatus = jest.fn(() => mockGameStore.connectionStatus);
export const useIsAIGenerating = jest.fn(() => mockGameStore.isAIGenerating);
export const useActivePanel = jest.fn(() => mockGameStore.activePanel);
export const useTheme = jest.fn(() => mockGameStore.theme);
export const useSidebarCollapsed = jest.fn(() => mockGameStore.sidebarCollapsed);
export const usePendingActions = jest.fn(() => mockGameStore.pendingActions);
export const useLastError = jest.fn(() => mockGameStore.lastError);
export const useIsLoadingSession = jest.fn(() => mockGameStore.isLoadingSession);
export const useIsPerformingAction = jest.fn(() => mockGameStore.isPerformingAction);
export const useCurrentStory = jest.fn(() => mockGameStore.currentSession?.story ?? []);
export const useCurrentCharacter = jest.fn(() => mockGameStore.currentSession?.character);
export const useCurrentWorldState = jest.fn(() => mockGameStore.currentSession?.world_state);
export const useCurrentInventory = jest.fn(() => mockGameStore.currentSession?.inventory ?? []);
export const useCurrentQuests = jest.fn(() => mockGameStore.currentSession?.quests ?? []);

// Helper to update mock state
export const updateMockGameStore = (updates: Partial<typeof mockGameStore>) => {
  Object.assign(mockGameStore, updates);
};

// Helper to reset mock state
export const resetMockGameStore = () => {
  mockGameStore.currentSession = {
    session_id: 'test-session-1',
    character: mockCharacter,
    inventory: mockInventory,
    quests: mockQuests,
    world_state: mockWorldState,
    story: mockStory,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T12:02:00Z',
  };
  mockGameStore.connectionStatus = 'connected';
  mockGameStore.isAIGenerating = false;
  mockGameStore.activePanel = 'story';
  mockGameStore.theme = 'dark';
  mockGameStore.sidebarCollapsed = false;
  mockGameStore.pendingActions = [];
  mockGameStore.lastError = null;
  mockGameStore.isLoadingSession = false;
  mockGameStore.isPerformingAction = false;
  
  // Clear all mock function calls
  Object.values(mockGameStore).forEach(value => {
    if (typeof value === 'function' && 'mockClear' in value) {
      value.mockClear();
    }
  });
};

export default useGameStore;