// Enhanced ActionButton Component for Game Actions

import React, { forwardRef } from 'react';
import { Button, ButtonProps } from './Button';
import { IconButton } from './IconButton';
import {
  PlayIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BookmarkIcon,
  ShareIcon,
  Cog6ToothIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  XMarkIcon,
  CursorArrowRaysIcon,
  WrenchScrewdriverIcon,
  ArrowsRightLeftIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

// Common game action types
export type GameActionType =
  | 'play' | 'load' | 'save' | 'delete' | 'edit' | 'view' | 'hide'
  | 'download' | 'upload' | 'bookmark' | 'share' | 'settings'
  | 'add' | 'remove' | 'confirm' | 'cancel' | 'track' | 'untrack'
  | 'use' | 'equip' | 'compare' | 'filter';

export interface ActionButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  action: GameActionType;
  iconOnly?: boolean;
  confirmAction?: boolean;
  confirmMessage?: string;
}

// Icon mapping for different actions
const actionIcons: Record<GameActionType, React.ReactNode> = {
  play: <PlayIcon className="h-4 w-4" />,
  load: <ArrowDownTrayIcon className="h-4 w-4" />,
  save: <ArrowUpTrayIcon className="h-4 w-4" />,
  delete: <TrashIcon className="h-4 w-4" />,
  edit: <PencilIcon className="h-4 w-4" />,
  view: <EyeIcon className="h-4 w-4" />,
  hide: <EyeSlashIcon className="h-4 w-4" />,
  download: <ArrowDownTrayIcon className="h-4 w-4" />,
  upload: <ArrowUpTrayIcon className="h-4 w-4" />,
  bookmark: <BookmarkIcon className="h-4 w-4" />,
  share: <ShareIcon className="h-4 w-4" />,
  settings: <Cog6ToothIcon className="h-4 w-4" />,
  add: <PlusIcon className="h-4 w-4" />,
  remove: <MinusIcon className="h-4 w-4" />,
  confirm: <CheckIcon className="h-4 w-4" />,
  cancel: <XMarkIcon className="h-4 w-4" />,
  track: <EyeIcon className="h-4 w-4" />,
  untrack: <EyeSlashIcon className="h-4 w-4" />,
  use: <CursorArrowRaysIcon className="h-4 w-4" />,
  equip: <WrenchScrewdriverIcon className="h-4 w-4" />,
  compare: <ArrowsRightLeftIcon className="h-4 w-4" />,
  filter: <FunnelIcon className="h-4 w-4" />,
};

// Default labels for actions
const actionLabels: Record<GameActionType, string> = {
  play: 'Play',
  load: 'Load',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  view: 'View',
  hide: 'Hide',
  download: 'Download',
  upload: 'Upload',
  bookmark: 'Bookmark',
  share: 'Share',
  settings: 'Settings',
  add: 'Add',
  remove: 'Remove',
  confirm: 'Confirm',
  cancel: 'Cancel',
  track: 'Track',
  untrack: 'Untrack',
  use: 'Use',
  equip: 'Equip',
  compare: 'Compare',
  filter: 'Filter',
};

// Default variants for actions
const actionVariants: Record<GameActionType, ButtonProps['variant']> = {
  play: 'default',
  load: 'outline',
  save: 'default',
  delete: 'destructive',
  edit: 'outline',
  view: 'ghost',
  hide: 'ghost',
  download: 'outline',
  upload: 'outline',
  bookmark: 'ghost',
  share: 'ghost',
  settings: 'ghost',
  add: 'default',
  remove: 'destructive',
  confirm: 'success',
  cancel: 'outline',
  track: 'default',
  untrack: 'outline',
  use: 'default',
  equip: 'default',
  compare: 'outline',
  filter: 'outline',
};

// Default confirmation messages
const actionConfirmMessages: Partial<Record<GameActionType, string>> = {
  delete: 'Are you sure you want to delete this item? This action cannot be undone.',
  remove: 'Are you sure you want to remove this item?',
};

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({
    action,
    iconOnly = false,
    confirmAction,
    confirmMessage,
    children,
    variant,
    'aria-label': ariaLabel,
    ...props
  }, ref) => {
    const icon = actionIcons[action];
    const defaultLabel = actionLabels[action];
    const defaultVariant = actionVariants[action];
    const defaultConfirmMessage = actionConfirmMessages[action];
    
    // Determine if this action should require confirmation by default
    const shouldConfirm = confirmAction ?? ['delete', 'remove'].includes(action);
    const finalConfirmMessage = confirmMessage ?? defaultConfirmMessage;
    
    const buttonProps = {
      ref,
      variant: variant ?? defaultVariant,
      confirmAction: shouldConfirm,
      confirmMessage: finalConfirmMessage,
      'aria-label': ariaLabel ?? `${defaultLabel} action`,
      ...props,
    };

    if (iconOnly) {
      return (
        <IconButton
          icon={icon}
          {...buttonProps}
        />
      );
    }

    return (
      <Button
        leftIcon={icon}
        {...buttonProps}
      >
        {children ?? defaultLabel}
      </Button>
    );
  }
);

ActionButton.displayName = 'ActionButton';

export { ActionButton };
export default ActionButton;
