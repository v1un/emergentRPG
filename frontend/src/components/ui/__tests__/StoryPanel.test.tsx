// Comprehensive tests for StoryPanel component

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryPanel } from '../../game/StoryPanel';
import { useCurrentSession, useCurrentStory, useIsAIGenerating, useConnectionStatus } from '@/stores/gameStore';
import { useGameAction } from '@/hooks/useGameAction';
import { useAIInsights } from '@/services/aiInsightsService';

// Mock dependencies
jest.mock('@/stores/gameStore');
jest.mock('@/hooks/useGameAction');
jest.mock('@/services/aiInsightsService');
jest.mock('@/services/dynamicUIService', () => ({
  dynamicUIService: {
    getDynamicUIContent: jest.fn().mockResolvedValue({
      placeholderText: 'What do you do?',
      emptyStateTitle: 'Your Adventure Begins',
      emptyStateMessage: 'Enter your first action to start.',
      statusMessages: {
        connected: 'Connected',
        connecting: 'Connecting...',
        disconnected: 'Disconnected',
        error: 'Connection Error',
        aiThinking: 'AI is thinking...',
        readyToSend: 'Ready to send'
      }
    })
  }
}));

const mockUseCurrentSession = useCurrentSession as jest.MockedFunction<typeof useCurrentSession>;
const mockUseCurrentStory = useCurrentStory as jest.MockedFunction<typeof useCurrentStory>;
const mockUseIsAIGenerating = useIsAIGenerating as jest.MockedFunction<typeof useIsAIGenerating>;
const mockUseConnectionStatus = useConnectionStatus as jest.MockedFunction<typeof useConnectionStatus>;
const mockUseGameAction = useGameAction as jest.MockedFunction<typeof useGameAction>;
const mockUseAIInsights = useAIInsights as jest.MockedFunction<typeof useAIInsights>;

const mockSession = {
  session_id: 'test-session',
  character: {
    id: 'test-char',
    name: 'Test Character',
    level: 1,
    experience: 0,
    experience_to_next_level: 100,
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    health: {
      current: 100,
      maximum: 100,
    },
    equipment: {
      weapon: {
        id: 'sword',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        stats: { attack: 5 },
      },
      armor: {
        id: 'armor',
        name: 'Leather Armor',
        type: 'armor',
        rarity: 'common',
        stats: { defense: 3 },
      },
    },
  },
  inventory: [],
  quests: [],
  story: [],
  world_state: {
    available_actions: ['Look around', 'Check inventory', 'Move forward'],
    current_location: 'Forest',
    time_of_day: 'morning',
    weather: 'clear',
    nearby_npcs: [],
    discovered_locations: [],
    active_effects: [],
    metadata: {},
  },
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockStory = [
  {
    id: '1',
    type: 'narration',
    text: 'You find yourself in a mysterious forest.',
    timestamp: '2024-01-01T00:00:00Z',
    metadata: {},
  },
  {
    id: '2',
    type: 'player',
    text: 'I look around carefully.',
    timestamp: '2024-01-01T00:01:00Z',
    metadata: {},
  },
];

const mockPerformAction = jest.fn();

describe('StoryPanel', () => {
  beforeEach(() => {
    mockUseCurrentSession.mockReturnValue(mockSession);
    mockUseCurrentStory.mockReturnValue(mockStory);
    mockUseIsAIGenerating.mockReturnValue(false);
    mockUseConnectionStatus.mockReturnValue('connected');
    mockUseGameAction.mockReturnValue({
      performAction: mockPerformAction,
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });
    mockUseAIInsights.mockReturnValue({
      insights: [],
      generateMockInsight: jest.fn(),
      stats: {
        total: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        byType: {},
      },
      clearInsights: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders story entries correctly', () => {
    render(<StoryPanel />);
    
    expect(screen.getByText('You find yourself in a mysterious forest.')).toBeInTheDocument();
    expect(screen.getByText('I look around carefully.')).toBeInTheDocument();
  });

  it('displays AI suggestions from world state', () => {
    render(<StoryPanel />);
    
    expect(screen.getByText('AI Suggestions:')).toBeInTheDocument();
    expect(screen.getByText('Look around')).toBeInTheDocument();
    expect(screen.getByText('Check inventory')).toBeInTheDocument();
    expect(screen.getByText('Move forward')).toBeInTheDocument();
  });

  it('allows user to input and submit actions', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const input = screen.getByPlaceholderText(/What do you do/);
    const submitButton = screen.getByLabelText('Submit action');
    
    await user.type(input, 'Test action');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockPerformAction).toHaveBeenCalledWith('Test action');
    });
  });

  it('handles keyboard shortcuts correctly', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const input = screen.getByPlaceholderText(/What do you do/);
    
    await user.type(input, 'Test action');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(mockPerformAction).toHaveBeenCalledWith('Test action');
    });
  });

  it('shows search functionality', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const searchButton = screen.getByLabelText('Toggle quick search');
    await user.click(searchButton);
    
    expect(screen.getByPlaceholderText('Search story entries...')).toBeInTheDocument();
  });

  it('handles bookmarking entries', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    // Hover over a story entry to show bookmark button
    const storyEntry = screen.getByText('You find yourself in a mysterious forest.').closest('.group');
    if (storyEntry) {
      await user.hover(storyEntry);
    }
    
    const bookmarkButtons = screen.getAllByLabelText(/Add bookmark/);
    await user.click(bookmarkButtons[0]);
    
    // The bookmark button should change to remove bookmark
    await waitFor(() => {
      expect(screen.getByLabelText('Remove bookmark')).toBeInTheDocument();
    });
  });

  it('displays loading state when AI is generating', () => {
    mockUseIsAIGenerating.mockReturnValue(true);
    render(<StoryPanel />);
    
    expect(screen.getByText('AI is crafting your story...')).toBeInTheDocument();
  });

  it('disables input when loading', () => {
    mockUseGameAction.mockReturnValue({
      performAction: mockPerformAction,
      isLoading: true,
      error: null,
      clearError: jest.fn(),
    });
    
    render(<StoryPanel />);
    
    const input = screen.getByPlaceholderText(/What do you do/);
    const submitButton = screen.getByLabelText('Submit action');
    
    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows error messages', () => {
    mockUseGameAction.mockReturnValue({
      performAction: mockPerformAction,
      isLoading: false,
      error: new Error('Test error'),
      clearError: jest.fn(),
    });
    
    render(<StoryPanel />);
    
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('validates action input', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const submitButton = screen.getByLabelText('Submit action');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter an action')).toBeInTheDocument();
    });
    expect(mockPerformAction).not.toHaveBeenCalled();
  });

  it('handles export functionality', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);

    const exportButton = screen.getByLabelText('Export story');
    await user.click(exportButton);

    // Should show export modal
    await waitFor(() => {
      expect(screen.getByText('Export Story')).toBeInTheDocument();
      expect(screen.getByText('Advanced export options will be available here.')).toBeInTheDocument();
    });
  });

  it('filters story entries by search query', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const searchButton = screen.getByLabelText('Toggle quick search');
    await user.click(searchButton);
    
    const searchInput = screen.getByPlaceholderText('Search story entries...');
    await user.type(searchInput, 'forest');
    
    // Wait for filtering to take effect
    await waitFor(() => {
      expect(screen.getByText('You find yourself in a mysterious forest.')).toBeInTheDocument();
      // The second entry should be filtered out
      expect(screen.queryByText('I look around carefully.')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no session', () => {
    mockUseCurrentSession.mockReturnValue(null);
    render(<StoryPanel />);
    
    expect(screen.getByText('No active game session')).toBeInTheDocument();
  });

  it('shows empty story state', () => {
    mockUseCurrentStory.mockReturnValue([]);
    render(<StoryPanel />);

    expect(screen.getByText('Your Magical Adventure Begins')).toBeInTheDocument();
    expect(screen.getByText(/Step into a world where AI weaves your story/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<StoryPanel />);
    
    const input = screen.getByPlaceholderText(/What do you do/);
    expect(input).toHaveAttribute('aria-label', 'Enter your action');
    expect(input).toHaveAttribute('aria-describedby');
    
    const submitButton = screen.getByLabelText('Submit action');
    expect(submitButton).toBeInTheDocument();
  });

  it('shows character count indicator', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const input = screen.getByPlaceholderText(/What do you do/);
    await user.type(input, 'Test');
    
    expect(screen.getByText('4/500')).toBeInTheDocument();
  });

  it('shows connection status', () => {
    render(<StoryPanel />);
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows AI demo button', () => {
    render(<StoryPanel />);
    
    const aiDemoButton = screen.getByLabelText('Generate AI insight demo');
    expect(aiDemoButton).toBeInTheDocument();
  });

  it('allows clicking on AI suggestions', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const suggestionButton = screen.getByRole('button', { name: /Use suggestion: Look around/ });
    await user.click(suggestionButton);
    
    const input = screen.getByPlaceholderText(/What do you do/);
    expect(input).toHaveValue('Look around');
  });

  it('shows bookmark count when entries are bookmarked', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    // Hover and bookmark an entry
    const storyEntry = screen.getByText('You find yourself in a mysterious forest.').closest('.group');
    if (storyEntry) {
      await user.hover(storyEntry);
    }
    
    const bookmarkButton = screen.getByLabelText('Add bookmark');
    await user.click(bookmarkButton);
    
    // Check bookmark count appears
    await waitFor(() => {
      const bookmarkToggle = screen.getByLabelText(/Toggle bookmarks \(1 saved\)/);
      expect(bookmarkToggle).toBeInTheDocument();
    });
  });

  it('handles advanced search modal', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const advancedSearchButton = screen.getByLabelText('Advanced search');
    await user.click(advancedSearchButton);
    
    await waitFor(() => {
      expect(screen.getByText('Advanced Story Search')).toBeInTheDocument();
    });
  });

  it('handles bookmark manager modal', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const bookmarkManagerButton = screen.getByLabelText('Manage bookmarks');
    await user.click(bookmarkManagerButton);
    
    await waitFor(() => {
      expect(screen.getByText('Bookmark Manager')).toBeInTheDocument();
    });
  });
});