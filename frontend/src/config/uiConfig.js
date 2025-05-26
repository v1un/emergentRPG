// Dynamic UI Configuration System
// This file manages all configurable UI elements

import { 
  User, 
  Backpack, 
  ScrollText, 
  Star, 
  Sword, 
  Shield, 
  Wand2,
  Heart,
  Eye,
  MessageSquare,
  Zap,
  Home,
  Settings as SettingsIcon,
  Map,
  Book,
  Trophy,
} from 'lucide-react';

// Default UI Configuration
export const DEFAULT_UI_CONFIG = {
  // Panel/Tab configurations for the game interface
  gamePanels: [
    { 
      id: 'character', 
      label: 'Character', 
      icon: 'User',
      position: 0,
      enabled: true,
      component: 'CharacterPanel',
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: 'Backpack',
      position: 1,
      enabled: true,
      component: 'InventoryPanel',
    },
    { 
      id: 'quests', 
      label: 'Quests', 
      icon: 'ScrollText',
      position: 2,
      enabled: true,
      component: 'QuestsPanel',
    },
    { 
      id: 'map', 
      label: 'Map', 
      icon: 'Map',
      position: 3,
      enabled: false,
      component: 'MapPanel',
    },
    { 
      id: 'achievements', 
      label: 'Achievements', 
      icon: 'Trophy',
      position: 4,
      enabled: false,
      component: 'AchievementsPanel',
    },
  ],

  // Quick actions for the game interface
  quickActions: [
    { 
      id: 'look', 
      text: 'Look around', 
      icon: 'Star',
      category: 'exploration',
      position: 0,
      enabled: true,
      hotkey: 'l',
    },
    { 
      id: 'attack', 
      text: 'Attack', 
      icon: 'Sword',
      category: 'combat',
      position: 1,
      enabled: true,
      hotkey: 'a',
    },
    { 
      id: 'defend', 
      text: 'Defend', 
      icon: 'Shield',
      category: 'combat',
      position: 2,
      enabled: true,
      hotkey: 'd',
    },
    { 
      id: 'cast_spell', 
      text: 'Cast spell', 
      icon: 'Wand2',
      category: 'magic',
      position: 3,
      enabled: true,
      hotkey: 'c',
    },
    { 
      id: 'search', 
      text: 'Search', 
      icon: 'Eye',
      category: 'exploration',
      position: 4,
      enabled: false,
      hotkey: 's',
    },
    { 
      id: 'rest', 
      text: 'Rest', 
      icon: 'Heart',
      category: 'utility',
      position: 5,
      enabled: false,
      hotkey: 'r',
    },
    { 
      id: 'talk', 
      text: 'Talk', 
      icon: 'MessageSquare',
      category: 'social',
      position: 6,
      enabled: false,
      hotkey: 't',
    },
  ],

  // Navigation configuration
  navigation: [
    { 
      id: 'landing', 
      label: 'Home', 
      icon: 'Home',
      position: 0,
      enabled: true,
    },
    { 
      id: 'generator', 
      label: 'Generate', 
      icon: 'Wand2',
      position: 1,
      enabled: true,
    },
    { 
      id: 'lorebooks', 
      label: 'Lorebooks', 
      icon: 'ScrollText',
      position: 2,
      enabled: true,
    },
    { 
      id: 'config', 
      label: 'Settings', 
      icon: 'SettingsIcon',
      position: 3,
      enabled: true,
    },
  ],

  // Color and rarity configurations
  rarityColors: {
    common: 'border-gray-400',
    uncommon: 'border-green-400',
    rare: 'border-blue-400',
    epic: 'border-purple-400',
    legendary: 'border-orange-400',
    artifact: 'border-red-400'
  },

  // Theme configurations
  themes: {
    default: {
      name: 'Dark Fantasy',
      colors: {
        primary: 'dungeon-orange',
        secondary: 'dungeon-text-secondary',
        background: 'dungeon-dark',
        surface: 'dungeon-darker'
      }
    },
    light: {
      name: 'Light Mode',
      colors: {
        primary: 'blue-600',
        secondary: 'gray-600',
        background: 'white',
        surface: 'gray-50'
      }
    },
    forest: {
      name: 'Forest',
      colors: {
        primary: 'green-600',
        secondary: 'green-400',
        background: 'green-900',
        surface: 'green-800'
      }
    }
  },

  // Layout configurations
  layout: {
    sidebarWidth: 320,
    compactMode: false,
    showTooltips: true,
    animationsEnabled: true,
    autoSave: true,
    autoSaveInterval: 30000 // 30 seconds
  }
};

// Icon mapping for dynamic icon rendering
export const ICON_MAP = {
  User,
  Backpack,
  ScrollText,
  Star,
  Sword,
  Shield,
  Wand2,
  Heart,
  Eye,
  MessageSquare,
  Zap,
  Home,
  SettingsIcon,
  Map,
  Book,
  Trophy
};

// User preference keys for localStorage
export const UI_STORAGE_KEYS = {
  UI_CONFIG: 'emergentRPG_ui_config',
  THEME: 'emergentRPG_theme',
  LAYOUT: 'emergentRPG_layout',
  QUICK_ACTIONS: 'emergentRPG_quick_actions',
  PANELS: 'emergentRPG_panels'
};

export default DEFAULT_UI_CONFIG;
