// Enhanced Button Component Tests

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { ActionButton } from '../ActionButton';
import { IconButton } from '../IconButton';
import { ButtonGroup } from '../ButtonGroup';
import { PlusIcon } from '@heroicons/react/24/outline';

// Mock the accessibility utils
jest.mock('@/utils/accessibility', () => ({
  announceToScreenReader: jest.fn(),
  generateId: jest.fn(() => 'test-id'),
}));

describe('Enhanced Button Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('handles click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading state', () => {
      render(<Button loading loadingText="Loading...">Click me</Button>);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows success state', () => {
      render(<Button showSuccess successText="Success!">Click me</Button>);
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    it('shows error state', () => {
      render(<Button showError errorText="Error occurred">Click me</Button>);
      
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Button
          aria-label="Custom label"
          aria-describedby="description"
          aria-expanded={true}
        >
          Click me
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('aria-describedby', 'description');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('shows tooltip when provided', () => {
      render(<Button tooltip="This is a tooltip">Click me</Button>);
      
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('This is a tooltip')).toBeInTheDocument();
    });

    it('sets aria-busy during loading', () => {
      render(<Button loading>Click me</Button>);
      
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Confirmation Handling', () => {
    it('shows confirmation dialog when confirmAction is true', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(
        <Button
          onClick={handleClick}
          confirmAction
          confirmMessage="Are you sure?"
        >
          Delete
        </Button>
      );
      
      await user.click(screen.getByRole('button'));
      
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure?');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      confirmSpy.mockRestore();
    });

    it('cancels action when confirmation is denied', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      // Mock window.confirm to return false
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(
        <Button
          onClick={handleClick}
          confirmAction
          confirmMessage="Are you sure?"
        >
          Delete
        </Button>
      );
      
      await user.click(screen.getByRole('button'));
      
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure?');
      expect(handleClick).not.toHaveBeenCalled();
      
      confirmSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('handles async errors gracefully', async () => {
      const handleClick = jest.fn().mockRejectedValue(new Error('Test error'));
      const handleError = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Button
          onClick={handleClick}
          onAsyncError={handleError}
          errorText="Something went wrong"
        >
          Click me
        </Button>
      );
      
      await user.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });
});

describe('ActionButton Component', () => {
  it('renders with correct icon and label for play action', () => {
    render(<ActionButton action="play" />);
    
    const button = screen.getByRole('button', { name: 'Play action' });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
  });

  it('renders icon-only version', () => {
    render(<ActionButton action="delete" iconOnly aria-label="Delete item" />);
    
    const button = screen.getByRole('button', { name: 'Delete item' });
    expect(button).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('applies correct variant for destructive actions', () => {
    render(<ActionButton action="delete" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('requires confirmation for delete actions by default', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<ActionButton action="delete" onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    
    expect(confirmSpy).toHaveBeenCalled();
    expect(handleClick).toHaveBeenCalled();
    
    confirmSpy.mockRestore();
  });
});

describe('IconButton Component', () => {
  it('renders with icon and aria-label', () => {
    render(
      <IconButton
        icon={<PlusIcon />}
        aria-label="Add item"
      />
    );
    
    const button = screen.getByRole('button', { name: 'Add item' });
    expect(button).toBeInTheDocument();
  });

  it('shows badge when provided', () => {
    render(
      <IconButton
        icon={<PlusIcon />}
        aria-label="Notifications"
        badge={{ content: 5, variant: 'destructive' }}
      />
    );
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByLabelText('5 notifications')).toBeInTheDocument();
  });
});

describe('ButtonGroup Component', () => {
  it('renders children with proper spacing', () => {
    render(
      <ButtonGroup spacing="md" aria-label="Action buttons">
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>
    );
    
    const group = screen.getByRole('group', { name: 'Action buttons' });
    expect(group).toBeInTheDocument();
    expect(group).toHaveClass('space-x-2');
  });

  it('applies segmented variant correctly', () => {
    render(
      <ButtonGroup variant="segmented">
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </ButtonGroup>
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveClass('rounded-l-md');
    expect(buttons[1]).toHaveClass('rounded-none');
    expect(buttons[2]).toHaveClass('rounded-r-md');
  });

  it('makes buttons full width when specified', () => {
    render(
      <ButtonGroup fullWidth>
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>
    );
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('flex-1');
    });
  });
});
