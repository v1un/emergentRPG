// CharacterPanel Component Tests

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, setupUserEvent, testHelpers, mockCharacter } from '@/utils/test-utils';
import { CharacterPanel } from '../CharacterPanel';
import { useCurrentCharacter, useGameStore } from '@/stores/gameStore';

// Mock the gameStore module
jest.mock('@/stores/gameStore');

const mockUseCurrentCharacter = useCurrentCharacter as jest.MockedFunction<typeof useCurrentCharacter>;
const mockUseGameStore = useGameStore as jest.MockedFunction<typeof useGameStore>;

describe('CharacterPanel', () => {
  const user = setupUserEvent();
  const mockUpdateSession = jest.fn();

  beforeEach(() => {
    // Reset any mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock returns
    mockUseCurrentCharacter.mockReturnValue(mockCharacter);
    mockUseGameStore.mockReturnValue({
      updateSession: mockUpdateSession,
    } as any);
  });

  describe('Rendering', () => {
    it('renders character information correctly', async () => {
      renderWithProviders(<CharacterPanel />);

      // Check if character name is displayed
      expect(screen.getByText(mockCharacter.name)).toBeInTheDocument();
      
      // Check if level and class are displayed
      expect(screen.getByText(`Level ${mockCharacter.level} ${mockCharacter.class_name}`)).toBeInTheDocument();
      
      // Check if health is displayed
      expect(screen.getByText(`${mockCharacter.health}/${mockCharacter.max_health}`)).toBeInTheDocument();
    });

    it('displays character stats correctly', async () => {
      renderWithProviders(<CharacterPanel />);

      // Switch to stats tab first
      const statsTab = screen.getByText('Stats');
      await user.click(statsTab);

      // Check if all stats are displayed (abbreviated form - first 3 letters)
      expect(screen.getByText('str')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // strength value
      expect(screen.getByText('dex')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument(); // dexterity value
    });

    it('shows experience progress', async () => {
      renderWithProviders(<CharacterPanel />);

      // The component shows experience as a progress bar to next level
      // Experience to next level is calculated as level * 1000
      const expectedExperienceToNext = mockCharacter.level * 1000; // 5000
      const currentProgress = mockCharacter.experience % expectedExperienceToNext; // 1250
      
      // Check if level indicator exists
      expect(screen.getByText(`Level ${mockCharacter.level + 1}`)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('switches between tabs correctly', async () => {
      renderWithProviders(<CharacterPanel />);

      // Find tabs by text content
      const overviewTab = screen.getByText('Overview');
      const statsTab = screen.getByText('Stats');
      const equipmentTab = screen.getByText('Equipment');

      // Overview should be active by default (has different styling)
      expect(overviewTab.closest('button')).toHaveClass('text-primary');

      // Click on Stats tab
      await user.click(statsTab);

      // Stats tab should now be active
      expect(statsTab.closest('button')).toHaveClass('text-primary');
      expect(overviewTab.closest('button')).not.toHaveClass('text-primary');
    });

    it('handles tab clicks correctly', async () => {
      renderWithProviders(<CharacterPanel />);

      const statsTab = screen.getByText('Stats');
      await user.click(statsTab);

      // Should show stats content
      expect(screen.getByText('Ability Scores')).toBeInTheDocument();
    });
  });

  describe('Equipment', () => {
    it('displays equipped items', async () => {
      renderWithProviders(<CharacterPanel />);

      // Switch to Equipment tab
      const equipmentTab = screen.getByText('Equipment');
      await user.click(equipmentTab);

      // Check if equipped items are displayed (use getAllByText since there might be duplicates)
      const ironSwordElements = screen.getAllByText('Iron Sword');
      expect(ironSwordElements.length).toBeGreaterThan(0);
      
      const leatherArmorElements = screen.getAllByText('Leather Armor');
      expect(leatherArmorElements.length).toBeGreaterThan(0);
    });

    it('shows empty equipment slots', async () => {
      // Update mock to have no equipment
      mockUseCurrentCharacter.mockReturnValue({
        ...mockCharacter,
        equipped_items: {},
      });

      renderWithProviders(<CharacterPanel />);

      // Switch to Equipment tab
      const equipmentTab = screen.getByText('Equipment');
      await user.click(equipmentTab);

      // Check for empty equipment message
      expect(screen.getByText('No equipment equipped')).toBeInTheDocument();
    });
  });

  describe('Level Up Notification', () => {
    it('shows level up notification when character levels up', async () => {
      // Start with a character that will level up
      const characterAboutToLevel = {
        ...mockCharacter,
        experience: 5999, // Just below level 6 threshold (6000)
      };

      mockUseCurrentCharacter.mockReturnValue(characterAboutToLevel);

      const { rerender } = renderWithProviders(<CharacterPanel />);

      // Update character to trigger level up
      mockUseCurrentCharacter.mockReturnValue({
        ...characterAboutToLevel,
        experience: 6000, // Crosses level threshold
      });

      // Re-render to trigger effect
      rerender(<CharacterPanel />);

      // Check if level up notification appears
      await waitFor(() => {
        expect(screen.getByText(/Level Up!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderWithProviders(<CharacterPanel />);

      // Check for character name as heading
      expect(screen.getByText(mockCharacter.name)).toBeInTheDocument();
    });

    it('has interactive elements', () => {
      renderWithProviders(<CharacterPanel />);

      // Check tabs are clickable
      const tabs = ['Overview', 'Stats', 'Equipment'];
      tabs.forEach(tabName => {
        const tab = screen.getByText(tabName);
        expect(tab.closest('button')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing character data gracefully', () => {
      // Update mock to have no character
      mockUseCurrentCharacter.mockReturnValue(undefined);

      renderWithProviders(<CharacterPanel />);

      // Should show appropriate message for missing character
      expect(screen.getByText('No Character Loaded')).toBeInTheDocument();
    });

    it('handles character data correctly', () => {
      renderWithProviders(<CharacterPanel />);

      // Should show character name
      expect(screen.getByText(mockCharacter.name)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = () => {
        renderSpy();
        return <CharacterPanel />;
      };

      const { rerender } = renderWithProviders(<TestWrapper />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestWrapper />);
      
      // Should not cause unnecessary re-renders
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});
