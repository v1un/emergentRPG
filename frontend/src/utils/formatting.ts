// Formatting utilities for display

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { ActionType, Character, InventoryItem, Quest } from '@/types';

/**
 * Formats dates for display
 */
export const dateFormatters = {
  /**
   * Formats a date as a short date string (e.g., "Jan 15, 2024")
   */
  short: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, 'MMM d, yyyy') : 'Invalid date';
  },

  /**
   * Formats a date as a long date string (e.g., "January 15, 2024")
   */
  long: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, 'MMMM d, yyyy') : 'Invalid date';
  },

  /**
   * Formats a date with time (e.g., "Jan 15, 2024 at 3:30 PM")
   */
  withTime: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, 'MMM d, yyyy \'at\' h:mm a') : 'Invalid date';
  },

  /**
   * Formats a date as relative time (e.g., "2 hours ago")
   */
  relative: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? formatDistanceToNow(dateObj, { addSuffix: true }) : 'Invalid date';
  },

  /**
   * Formats time only (e.g., "3:30 PM")
   */
  timeOnly: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, 'h:mm a') : 'Invalid time';
  },
};

/**
 * Formats numbers for display
 */
export const numberFormatters = {
  /**
   * Formats a number with thousand separators
   */
  withSeparators: (value: number): string => {
    return new Intl.NumberFormat().format(value);
  },

  /**
   * Formats a number as currency
   */
  currency: (value: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  },

  /**
   * Formats a number as a percentage
   */
  percentage: (value: number, decimals = 1): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  /**
   * Formats a number with units (e.g., "1.2K", "3.4M")
   */
  withUnits: (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  },

  /**
   * Formats a decimal number with specified precision
   */
  decimal: (value: number, decimals = 2): string => {
    return value.toFixed(decimals);
  },

  /**
   * Formats a number as an ordinal (e.g., "1st", "2nd", "3rd")
   */
  ordinal: (value: number): string => {
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = value % 100;
    return value + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  },
};

/**
 * Formats text for display
 */
export const textFormatters = {
  /**
   * Capitalizes the first letter of a string
   */
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  /**
   * Converts text to title case
   */
  titleCase: (text: string): string => {
    return text
      .split(' ')
      .map(word => textFormatters.capitalize(word))
      .join(' ');
  },

  /**
   * Truncates text with ellipsis
   */
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  },

  /**
   * Formats text for display in a sentence
   */
  sentence: (text: string): string => {
    const trimmed = text.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  },

  /**
   * Converts camelCase to readable text
   */
  camelToReadable: (text: string): string => {
    return text
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  },

  /**
   * Converts snake_case to readable text
   */
  snakeToReadable: (text: string): string => {
    return text
      .split('_')
      .map(word => textFormatters.capitalize(word))
      .join(' ');
  },

  /**
   * Pluralizes a word based on count
   */
  pluralize: (word: string, count: number, plural?: string): string => {
    if (count === 1) return word;
    return plural || word + 's';
  },
};

/**
 * Game-specific formatters
 */
export const gameFormatters = {
  /**
   * Formats action type for display
   */
  actionType: (type: ActionType): string => {
    const typeMap: Record<ActionType, string> = {
      player: 'Player Action',
      narration: 'Narration',
      action: 'Action',
      system: 'System Message',
    };
    return typeMap[type] || textFormatters.titleCase(type);
  },

  /**
   * Formats character level with ordinal
   */
  characterLevel: (level: number): string => {
    return `Level ${level}`;
  },

  /**
   * Formats health as a fraction and percentage
   */
  health: (current: number, max: number): string => {
    const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
    return `${current}/${max} (${percentage}%)`;
  },

  /**
   * Formats experience points with progress to next level
   */
  experience: (current: number, nextLevel: number): string => {
    const progress = nextLevel > 0 ? Math.round((current / nextLevel) * 100) : 100;
    return `${numberFormatters.withSeparators(current)} XP (${progress}% to next level)`;
  },

  /**
   * Formats item rarity with appropriate styling class
   */
  itemRarity: (rarity: string): { text: string; className: string } => {
    const rarityMap: Record<string, { text: string; className: string }> = {
      common: { text: 'Common', className: 'text-gray-600' },
      uncommon: { text: 'Uncommon', className: 'text-green-600' },
      rare: { text: 'Rare', className: 'text-blue-600' },
      epic: { text: 'Epic', className: 'text-purple-600' },
      legendary: { text: 'Legendary', className: 'text-orange-600' },
    };
    return rarityMap[rarity.toLowerCase()] || { text: textFormatters.titleCase(rarity), className: 'text-gray-600' };
  },

  /**
   * Formats quest status with appropriate styling
   */
  questStatus: (status: string): { text: string; className: string } => {
    const statusMap: Record<string, { text: string; className: string }> = {
      active: { text: 'Active', className: 'text-blue-600 bg-blue-100' },
      completed: { text: 'Completed', className: 'text-green-600 bg-green-100' },
      failed: { text: 'Failed', className: 'text-red-600 bg-red-100' },
    };
    return statusMap[status.toLowerCase()] || { text: textFormatters.titleCase(status), className: 'text-gray-600 bg-gray-100' };
  },

  /**
   * Formats weight with appropriate units
   */
  weight: (weight: number): string => {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(1)} kg`;
    }
    return `${weight} g`;
  },

  /**
   * Formats carry capacity
   */
  carryCapacity: (current: number, max: number): string => {
    const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
    return `${gameFormatters.weight(current)} / ${gameFormatters.weight(max)} (${percentage}%)`;
  },

  /**
   * Formats character stats for display
   */
  characterStats: (character: Character): string => {
    const { stats } = character;
    return `STR: ${stats.strength}, DEX: ${stats.dexterity}, CON: ${stats.constitution}, INT: ${stats.intelligence}, WIS: ${stats.wisdom}, CHA: ${stats.charisma}`;
  },

  /**
   * Formats item value as gold pieces
   */
  itemValue: (value: number): string => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}pp`; // Platinum pieces
    } else if (value >= 100) {
      return `${(value / 100).toFixed(1)}gp`; // Gold pieces
    } else if (value >= 10) {
      return `${(value / 10).toFixed(1)}sp`; // Silver pieces
    }
    return `${value}cp`; // Copper pieces
  },

  /**
   * Formats story entry timestamp for chat-like display
   */
  storyTimestamp: (timestamp: string): string => {
    const date = parseISO(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return dateFormatters.timeOnly(date);
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEE h:mm a');
    } else {
      return dateFormatters.short(date);
    }
  },
};

/**
 * Utility function to format file sizes
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Utility function to format duration in milliseconds
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}


