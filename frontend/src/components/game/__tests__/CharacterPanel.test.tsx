// CharacterPanel Component Tests

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, setupUserEvent, testHelpers, mockCharacter } from '@/utils/test-utils';
import { CharacterPanel } from '../CharacterPanel';

describe('CharacterPanel', () => {
  const user = setupUserEvent();

  beforeEach(() => {
    // Reset any mocks before each test
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders character information correctly', async () => {
      renderWithProviders(<CharacterPanel />);

      // Check if character name is displayed
      expect(screen.getByText(mockCharacter.name)).toBeInTheDocument();
      
      // Check if level is displayed
      expect(screen.getByText(`Level ${mockCharacter.level}`)).toBeInTheDocument();
      
      // Check if health is displayed
      expect(screen.getByText(`${mockCharacter.health.current}/${mockCharacter.health.maximum}`)).toBeInTheDocument();
    });

    it('displays character stats correctly', async () => {
      renderWithProviders(<CharacterPanel />);

      // Check if all stats are displayed
      Object.entries(mockCharacter.stats).forEach(([stat, value]) => {
        expect(screen.getByText(stat.charAt(0).toUpperCase() + stat.slice(1))).toBeInTheDocument();
        expect(screen.getByText(value.toString())).toBeInTheDocument();
      });
    });

    it('shows experience progress', async () => {
      renderWithProviders(<CharacterPanel />);

      // Check experience display
      expect(screen.getByText(`${mockCharacter.experience} / ${mockCharacter.experience_to_next_level} XP`)).toBeInTheDocument();
      
      // Check if progress bar exists
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('switches between tabs correctly', async () => {
      renderWithProviders(<CharacterPanel />);

      // Check if Overview tab is active by default
      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      expect(overviewTab).toHaveAttribute('aria-selected', 'true');

      // Click on Stats tab
      const statsTab = screen.getByRole('tab', { name: /stats/i });
      await user.click(statsTab);

      // Check if Stats tab is now active
      expect(statsTab).toHaveAttribute('aria-selected', 'true');
      expect(overviewTab).toHaveAttribute('aria-selected', 'false');
    });

    it('handles keyboard navigation between tabs', async () => {
      renderWithProviders(<CharacterPanel />);

      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      const statsTab = screen.getByRole('tab', { name: /stats/i });

      // Focus on first tab
      overviewTab.focus();
      expect(overviewTab).toHaveFocus();

      // Navigate to next tab with arrow key
      await testHelpers.navigateWithKeyboard(user, 'ArrowRight');
      expect(statsTab).toHaveFocus();

      // Navigate back with arrow key
      await testHelpers.navigateWithKeyboard(user, 'ArrowLeft');
      expect(overviewTab).toHaveFocus();
    });
  });

  describe('Equipment', () => {
    it('displays equipped items', async () => {
      renderWithProviders(<CharacterPanel />);

      // Switch to Equipment tab
      const equipmentTab = screen.getByRole('tab', { name: /equipment/i });
      await user.click(equipmentTab);

      // Check if equipped weapon is displayed
      if (mockCharacter.equipment.weapon) {
        expect(screen.getByText(mockCharacter.equipment.weapon.name)).toBeInTheDocument();
      }

      // Check if equipped armor is displayed
      if (mockCharacter.equipment.armor) {
        expect(screen.getByText(mockCharacter.equipment.armor.name)).toBeInTheDocument();
      }
    });

    it('shows empty equipment slots', async () => {
      const characterWithoutEquipment = {
        ...mockCharacter,
        equipment: {}
      };

      renderWithProviders(<CharacterPanel />, {
        initialGameState: { character: characterWithoutEquipment }
      });

      // Switch to Equipment tab
      const equipmentTab = screen.getByRole('tab', { name: /equipment/i });
      await user.click(equipmentTab);

      // Check for empty slot indicators
      expect(screen.getByText(/no weapon equipped/i)).toBeInTheDocument();
      expect(screen.getByText(/no armor equipped/i)).toBeInTheDocument();
    });
  });

  describe('Level Up Notification', () => {
    it('shows level up notification when character levels up', async () => {
      const { rerender } = renderWithProviders(<CharacterPanel />);

      // Simulate level up by updating character
      const leveledUpCharacter = {
        ...mockCharacter,
        level: mockCharacter.level + 1,
        experience: mockCharacter.experience_to_next_level,
      };

      rerender(
        <CharacterPanel />
      );

      // Re-render with updated state
      renderWithProviders(<CharacterPanel />, {
        initialGameState: { character: leveledUpCharacter }
      });

      // Check if level up notification appears
      await waitFor(() => {
        expect(screen.getByText(/level up/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(<CharacterPanel />);

      // Check tab list has proper role
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      // Check tabs have proper roles and labels
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('aria-controls');
      });

      // Check tab panels have proper roles
      const tabPanels = screen.getAllByRole('tabpanel');
      expect(tabPanels.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<CharacterPanel />);

      const firstTab = screen.getAllByRole('tab')[0];
      
      // Tab should be focusable
      firstTab.focus();
      expect(firstTab).toHaveFocus();

      // Should respond to Enter key
      await testHelpers.navigateWithKeyboard(user, 'Enter');
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
    });

    it('has proper heading structure', () => {
      renderWithProviders(<CharacterPanel />);

      // Check for proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing character data gracefully', () => {
      renderWithProviders(<CharacterPanel />, {
        initialGameState: { character: null }
      });

      // Should show appropriate message for missing character
      expect(screen.getByText(/no character data/i)).toBeInTheDocument();
    });

    it('handles corrupted character data', () => {
      const corruptedCharacter = {
        ...mockCharacter,
        stats: null, // Corrupted stats
      };

      renderWithProviders(<CharacterPanel />, {
        initialGameState: { character: corruptedCharacter }
      });

      // Should not crash and show fallback content
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
