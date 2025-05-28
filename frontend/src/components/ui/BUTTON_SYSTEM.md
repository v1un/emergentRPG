# Enhanced Button System Documentation

## Overview

The emergentRPG frontend now features a comprehensive, accessibility-first button system designed specifically for AI-driven storytelling interfaces. This system provides consistent user experience, proper error handling, and full accessibility support.

## Components

### 1. Button (Enhanced Base Component)

The core button component with advanced features:

```tsx
import { Button } from '@/components/ui/Button';

// Basic usage
<Button onClick={handleClick}>Click me</Button>

// With loading state
<Button loading loadingText="Saving...">Save</Button>

// With success/error states
<Button 
  showSuccess={isSuccess} 
  successText="Saved!"
  showError={isError}
  errorText="Failed to save"
>
  Save
</Button>

// With confirmation
<Button 
  confirmAction
  confirmMessage="Are you sure you want to delete this?"
  onClick={handleDelete}
>
  Delete
</Button>

// With accessibility features
<Button
  aria-label="Save document"
  tooltip="Save your current progress"
  aria-describedby="save-help"
>
  Save
</Button>
```

#### Key Features:
- **Automatic Loading States**: Shows spinner and loading text during async operations
- **Success/Error Feedback**: Visual and screen reader feedback for operation results
- **Confirmation Dialogs**: Built-in confirmation for destructive actions
- **Full Accessibility**: ARIA attributes, screen reader announcements, keyboard navigation
- **Error Handling**: Graceful error handling with user feedback
- **Tooltips**: Built-in tooltip support

### 2. ActionButton (Semantic Action Component)

Pre-configured buttons for common game actions:

```tsx
import { ActionButton } from '@/components/ui/ActionButton';

// Play action (loads session)
<ActionButton 
  action="play" 
  onClick={handleLoadSession}
  aria-label="Load this session"
  tooltip="Continue your adventure"
/>

// Delete action (with automatic confirmation)
<ActionButton 
  action="delete" 
  onClick={handleDelete}
  aria-label="Delete session"
/>

// Icon-only version
<ActionButton 
  action="save" 
  iconOnly
  onClick={handleSave}
  aria-label="Save progress"
/>

// Custom confirmation message
<ActionButton 
  action="delete"
  confirmMessage="This will permanently delete your character. Continue?"
  onClick={handleDeleteCharacter}
/>
```

#### Available Actions:
- `play` - Load/start actions
- `save` - Save actions  
- `delete` - Delete actions (auto-confirmation)
- `edit` - Edit actions
- `view`/`hide` - Visibility toggles
- `add`/`remove` - Add/remove actions
- `track`/`untrack` - Tracking toggles
- `bookmark` - Bookmark actions
- `share` - Share actions
- `settings` - Settings actions
- `confirm`/`cancel` - Confirmation actions

### 3. IconButton (Icon-Only Actions)

Specialized component for icon-only buttons:

```tsx
import { IconButton } from '@/components/ui/IconButton';
import { PlusIcon } from '@heroicons/react/24/outline';

// Basic icon button
<IconButton 
  icon={<PlusIcon />}
  aria-label="Add new item"
  onClick={handleAdd}
/>

// With badge
<IconButton 
  icon={<BellIcon />}
  aria-label="Notifications"
  badge={{ content: 5, variant: 'destructive' }}
  onClick={handleNotifications}
/>

// With tooltip
<IconButton 
  icon={<SettingsIcon />}
  aria-label="Open settings"
  tooltip="Configure your preferences"
  onClick={handleSettings}
/>
```

### 4. ButtonGroup (Related Button Management)

Groups related buttons with consistent spacing and styling:

```tsx
import { ButtonGroup } from '@/components/ui/ButtonGroup';

// Horizontal group with spacing
<ButtonGroup spacing="md">
  <ActionButton action="play" onClick={handlePlay}>Play</ActionButton>
  <ActionButton action="edit" onClick={handleEdit}>Edit</ActionButton>
  <ActionButton action="delete" onClick={handleDelete}>Delete</ActionButton>
</ButtonGroup>

// Segmented control style
<ButtonGroup variant="segmented">
  <Button variant={filter === 'all' ? 'default' : 'outline'}>All</Button>
  <Button variant={filter === 'active' ? 'default' : 'outline'}>Active</Button>
  <Button variant={filter === 'completed' ? 'default' : 'outline'}>Completed</Button>
</ButtonGroup>

// Full width buttons
<ButtonGroup fullWidth spacing="sm">
  <Button>Option 1</Button>
  <Button>Option 2</Button>
</ButtonGroup>

// Vertical orientation
<ButtonGroup orientation="vertical" spacing="sm">
  <Button>First</Button>
  <Button>Second</Button>
  <Button>Third</Button>
</ButtonGroup>
```

## Accessibility Features

### Screen Reader Support
- Automatic announcements for loading, success, and error states
- Proper ARIA attributes for all interactive elements
- Descriptive labels for icon-only buttons

### Keyboard Navigation
- Full keyboard accessibility with proper focus management
- Enter and Space key support for all buttons
- Escape key support for canceling operations

### Visual Accessibility
- High contrast support
- Reduced motion support
- Clear focus indicators
- Consistent visual hierarchy

## Error Handling

### Automatic Error Recovery
```tsx
<Button
  onClick={async () => {
    // This will automatically handle errors
    await riskyOperation();
  }}
  onError={(error) => {
    // Custom error handling
    console.error('Operation failed:', error);
    showNotification('Please try again');
  }}
  errorText="Operation failed"
>
  Risky Action
</Button>
```

### Loading State Management
```tsx
<Button
  onClick={async () => {
    // Loading state is automatically managed
    await longRunningOperation();
  }}
  loadingText="Processing your request..."
  successText="Request completed!"
>
  Submit
</Button>
```

## Best Practices

### 1. Use Semantic Actions
```tsx
// ✅ Good - semantic and clear
<ActionButton action="delete" onClick={handleDelete} />

// ❌ Avoid - generic and unclear
<Button variant="destructive" onClick={handleDelete}>
  <TrashIcon />
</Button>
```

### 2. Provide Proper Labels
```tsx
// ✅ Good - descriptive labels
<ActionButton 
  action="play" 
  iconOnly
  aria-label="Load session for Hero Character"
  tooltip="Continue your adventure"
/>

// ❌ Avoid - generic labels
<IconButton icon={<PlayIcon />} aria-label="Play" />
```

### 3. Group Related Actions
```tsx
// ✅ Good - grouped related actions
<ButtonGroup spacing="sm">
  <ActionButton action="play" />
  <ActionButton action="edit" />
  <ActionButton action="delete" />
</ButtonGroup>

// ❌ Avoid - scattered individual buttons
<div>
  <ActionButton action="play" />
  <div style={{ marginLeft: '8px' }}>
    <ActionButton action="edit" />
  </div>
</div>
```

### 4. Handle Async Operations Properly
```tsx
// ✅ Good - proper async handling
<ActionButton
  action="save"
  onClick={async () => {
    await saveSession();
  }}
  loadingText="Saving session..."
  successText="Session saved!"
  onError={(error) => showErrorToast(error.message)}
/>

// ❌ Avoid - no loading or error handling
<Button onClick={() => saveSession()}>Save</Button>
```

## Migration Guide

### From Old Button Usage
```tsx
// Old way
<Button
  size="icon"
  variant="ghost"
  onClick={() => handleLoadSession(session)}
  disabled={isLoading}
>
  <PlayIcon className="h-4 w-4" />
</Button>

// New way
<ActionButton
  action="play"
  iconOnly
  onClick={() => handleLoadSession(session)}
  aria-label={`Load session for ${session.character.name}`}
  tooltip="Load this session"
  loadingText="Loading session..."
  successText="Session loaded!"
/>
```

This enhanced button system provides a solid foundation for the AI-driven storytelling interface, ensuring consistent user experience and full accessibility compliance.
