// Test utilities and helpers for component testing

import React, { ReactElement } from 'react';
import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Mock data for testing
export const mockCharacter = {
  name: 'Test Hero',
  level: 5,
  health: 45,
  max_health: 50,
  mana: 30,
  max_mana: 40,
  experience: 1250,
  stats: {
    strength: 15,
    dexterity: 12,
    constitution: 14,
    intelligence: 10,
    wisdom: 13,
    charisma: 11,
  },
  class_name: 'Warrior',
  background: 'A brave warrior from the northern lands',
  equipped_items: {
    weapon: 'Iron Sword',
    chest: 'Leather Armor',
  } as Record<string, string>,
  max_carry_weight: 100,
  metadata: {},
};

export const mockInventory = [
  {
    id: 'potion-1',
    name: 'Health Potion',
    type: 'consumable',
    rarity: 'common',
    quantity: 3,
    description: 'Restores 25 health points',
    stats: { healing: 25 },
  },
  {
    id: 'sword-2',
    name: 'Steel Sword',
    type: 'weapon',
    rarity: 'uncommon',
    quantity: 1,
    description: 'A well-crafted steel sword',
    stats: { attack: 15 },
  },
];

export const mockQuests = [
  {
    id: 'quest-1',
    title: 'The Lost Artifact',
    description: 'Find the ancient artifact hidden in the forest',
    status: 'active',
    objectives: ['Search the old oak tree', 'Defeat the guardian'],
    rewards: { experience: 500, gold: 100 },
    metadata: { difficulty: 'medium' },
  },
  {
    id: 'quest-2',
    title: 'Village Defense',
    description: 'Protect the village from bandits',
    status: 'completed',
    objectives: ['Defeat 5 bandits', 'Rescue the villagers'],
    rewards: { experience: 750, gold: 200 },
    metadata: { difficulty: 'hard' },
  },
];

export const mockWorldState = {
  current_location: 'Mystic Forest',
  time_of_day: 'afternoon',
  weather: 'sunny',
  npcs_present: ['Forest Guardian', 'Traveling Merchant'],
  available_actions: ['Explore deeper', 'Rest at camp', 'Talk to merchant'],
  special_conditions: ['Ancient magic is strong here'],
  metadata: { region: 'Eastern Lands', danger_level: 'moderate' },
};

export const mockStory = [
  {
    id: 'story-1',
    type: 'narration',
    text: 'You enter the mystical forest, sunlight filtering through ancient trees.',
    timestamp: '2024-01-01T12:00:00Z',
  },
  {
    id: 'story-2',
    type: 'player',
    text: 'I look around for any signs of the lost artifact.',
    timestamp: '2024-01-01T12:01:00Z',
  },
  {
    id: 'story-3',
    type: 'action',
    text: 'You notice strange markings on an old oak tree nearby.',
    timestamp: '2024-01-01T12:02:00Z',
  },
];

export const mockGameSession = {
  session_id: 'test-session-1',
  character: mockCharacter,
  inventory: mockInventory,
  quests: mockQuests,
  world_state: mockWorldState,
  story: mockStory,
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T12:02:00Z',
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialGameState?: Partial<typeof mockGameSession>;
  withErrorBoundary?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialGameState = {},
    withErrorBoundary = true,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    const content = <>{children}</>;

    return withErrorBoundary ? (
      <ErrorBoundary>{content}</ErrorBoundary>
    ) : content;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Custom hooks for testing
export function setupUserEvent() {
  return userEvent.setup();
}

// Common test helpers
export const testHelpers = {
  // Wait for element to appear
  waitForElement: async (selector: string) => {
    return await waitFor(() => screen.getByTestId(selector));
  },

  // Wait for text to appear
  waitForText: async (text: string) => {
    return await waitFor(() => screen.getByText(text));
  },

  // Check if element has class
  hasClass: (element: HTMLElement, className: string) => {
    return element.classList.contains(className);
  },

  // Get element by role with timeout
  getByRoleWithTimeout: async (role: string, options?: any) => {
    return await waitFor(() => screen.getByRole(role, options));
  },

  // Simulate keyboard navigation
  navigateWithKeyboard: async (user: ReturnType<typeof userEvent.setup>, key: string) => {
    await user.keyboard(`{${key}}`);
  },

  // Simulate drag and drop
  dragAndDrop: async (
    user: ReturnType<typeof userEvent.setup>,
    source: HTMLElement,
    target: HTMLElement
  ) => {
    await user.pointer([
      { keys: '[MouseLeft>]', target: source },
      { coords: { x: 0, y: 0 }, target },
      { keys: '[/MouseLeft]' },
    ]);
  },

  // Check accessibility
  checkAccessibility: (element: HTMLElement) => {
    const checks = {
      hasAriaLabel: element.hasAttribute('aria-label'),
      hasRole: element.hasAttribute('role'),
      isFocusable: element.tabIndex >= 0,
      hasKeyboardSupport: element.hasAttribute('onKeyDown') || element.hasAttribute('onKeyPress'),
    };
    return checks;
  },

  // Mock API responses
  mockApiResponse: (data: any, delay = 100) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  },

  // Mock error response
  mockApiError: (error: string, delay = 100) => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(error)), delay);
    });
  },
};

// Test data generators
export const generateMockData = {
  character: (overrides = {}) => ({ ...mockCharacter, ...overrides }),
  inventory: (count = 5) => Array.from({ length: count }, (_, i) => ({
    ...mockInventory[0],
    id: `item-${i}`,
    name: `Test Item ${i}`,
  })),
  quest: (overrides = {}) => ({ ...mockQuests[0], ...overrides }),
  storyEntry: (overrides = {}) => ({ ...mockStory[0], ...overrides }),
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { userEvent };

export default {
  renderWithProviders,
  setupUserEvent,
  testHelpers,
  generateMockData,
  mockCharacter,
  mockInventory,
  mockQuests,
  mockWorldState,
  mockStory,
  mockGameSession,
};
