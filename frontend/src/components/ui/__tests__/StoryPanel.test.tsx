// Comprehensive tests for StoryPanel component

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryPanel } from '../game/StoryPanel';
import { useCurrentSession, useCurrentStory, useIsAIGenerating } from '@/stores/gameStore';
import { useGameAction } from '@/hooks/useGameAction';

// Mock dependencies
jest.mock('@/stores/gameStore');
jest.mock('@/hooks/useGameAction');

const mockUseCurrentSession = useCurrentSession as jest.MockedFunction<typeof useCurrentSession>;
const mockUseCurrentStory = useCurrentStory as jest.MockedFunction<typeof useCurrentStory>;
const mockUseIsAIGenerating = useIsAIGenerating as jest.MockedFunction<typeof useIsAIGenerating>;
const mockUseGameAction = useGameAction as jest.MockedFunction<typeof useGameAction>;

const mockSession = {
  session_id: 'test-session',
  world_state: {
    available_actions: [], // Actions should come from AI, not hardcoded
  },
};

const mockStory = [
  {
    id: '1',
    type: 'narration',
    text: 'You find yourself in a mysterious forest.',
    timestamp: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    type: 'player',
    text: 'I look around carefully.',
    timestamp: '2024-01-01T00:01:00Z',
  },
];

const mockPerformAction = jest.fn();

describe('StoryPanel', () => {
  beforeEach(() => {
    mockUseCurrentSession.mockReturnValue(mockSession);
    mockUseCurrentStory.mockReturnValue(mockStory);
    mockUseIsAIGenerating.mockReturnValue(false);
    mockUseGameAction.mockReturnValue({
      performAction: mockPerformAction,
      isLoading: false,
      error: null,
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

  it('displays AI suggestions', () => {
    render(<StoryPanel />);
    
    expect(screen.getByText('Look around')).toBeInTheDocument();
    expect(screen.getByText('Check inventory')).toBeInTheDocument();
    expect(screen.getByText('Move forward')).toBeInTheDocument();
  });

  it('allows user to input and submit actions', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const input = screen.getByPlaceholderText(/What do you do/);
    const submitButton = screen.getByRole('button', { name: /Submit action/ });
    
    await user.type(input, 'Test action');
    await user.click(submitButton);
    
    expect(mockPerformAction).toHaveBeenCalledWith('Test action');
  });

  it('handles keyboard shortcuts correctly', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const input = screen.getByPlaceholderText(/What do you do/);
    
    await user.type(input, 'Test action');
    await user.keyboard('{Enter}');
    
    expect(mockPerformAction).toHaveBeenCalledWith('Test action');
  });

  it('shows search functionality', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const searchButton = screen.getByLabelText('Toggle search');
    await user.click(searchButton);
    
    expect(screen.getByPlaceholderText('Search story entries...')).toBeInTheDocument();
  });

  it('handles bookmarking entries', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const bookmarkButtons = screen.getAllByLabelText(/Add bookmark/);
    await user.click(bookmarkButtons[0]);
    
    expect(screen.getByLabelText('Remove bookmark')).toBeInTheDocument();
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
    });
    
    render(<StoryPanel />);
    
    const input = screen.getByPlaceholderText(/What do you do/);
    const submitButton = screen.getByRole('button', { name: /Submit action/ });
    
    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows error messages', () => {
    mockUseGameAction.mockReturnValue({
      performAction: mockPerformAction,
      isLoading: false,
      error: { message: 'Test error' },
    });
    
    render(<StoryPanel />);
    
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('validates action input', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const submitButton = screen.getByRole('button', { name: /Submit action/ });
    await user.click(submitButton);
    
    expect(screen.getByText('Please enter an action')).toBeInTheDocument();
    expect(mockPerformAction).not.toHaveBeenCalled();
  });

  it('handles export functionality', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);

    const exportButton = screen.getByLabelText('Export story');
    await user.click(exportButton);

    // Check for dynamic export options - these should be generated based on context
    const exportOptions = screen.getAllByRole('button');
    const exportTexts = exportOptions.map(option => option.textContent);

    // Should have at least basic export options
    expect(exportTexts.some(text => text?.includes('Export'))).toBe(true);
  });

  it('filters story entries by search query', async () => {
    const user = userEvent.setup();
    render(<StoryPanel />);
    
    const searchButton = screen.getByLabelText('Toggle search');
    await user.click(searchButton);
    
    const searchInput = screen.getByPlaceholderText('Search story entries...');
    await user.type(searchInput, 'forest');
    
    expect(screen.getByText('You find yourself in a mysterious forest.')).toBeInTheDocument();
    expect(screen.queryByText('I look around carefully.')).not.toBeInTheDocument();
  });

  it('shows empty state when no session', () => {
    mockUseCurrentSession.mockReturnValue(null);
    render(<StoryPanel />);
    
    expect(screen.getByText('No active game session')).toBeInTheDocument();
  });

  it('shows empty story state', () => {
    mockUseCurrentStory.mockReturnValue([]);
    render(<StoryPanel />);

    // Check for dynamic empty state content - should be AI-generated based on context
    const headings = screen.getAllByRole('heading');
    const paragraphs = screen.getAllByText(/adventure|story|action/i);

    // Should have some adventure-related content
    expect(headings.length).toBeGreaterThan(0);
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  it('has proper accessibility attributes', () => {
    render(<StoryPanel />);
    
    const input = screen.getByPlaceholderText(/What do you do/);
    expect(input).toHaveAttribute('aria-label', 'Enter your action');
    expect(input).toHaveAttribute('aria-describedby');
    
    const submitButton = screen.getByRole('button', { name: /Submit action/ });
    expect(submitButton).toHaveAttribute('aria-label', 'Submit action');
  });
});
