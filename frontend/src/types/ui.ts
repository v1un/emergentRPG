// UI-related TypeScript type definitions

export type Theme = 'light' | 'dark' | 'auto';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

export type ActivePanel = 'sessions' | 'story' | 'character' | 'inventory' | 'quests' | 'world';

export interface UIConfig {
  theme: Theme;
  sidebarCollapsed: boolean;
  activePanel: ActivePanel;
  showMinimap: boolean;
  enableAnimations: boolean;
  enableSounds: boolean;
  fontSize: 'small' | 'medium' | 'large';
  autoSave: boolean;
  autoSaveInterval: number;
}

export interface UIPreferences {
  theme: Theme;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  enableNotifications: boolean;
  enableKeyboardShortcuts: boolean;
  accessibilityMode: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface ModalConfig {
  isOpen: boolean;
  title: string;
  content: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  onClose?: () => void;
  actions?: Array<{
    label: string;
    variant: 'primary' | 'secondary' | 'danger';
    action: () => void;
  }>;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | undefined;
  };
  options?: Array<{
    value: string;
    label: string;
  }>;
}

export interface TabConfig {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  content: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface MenuItemConfig {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  action?: () => void;
  href?: string;
  disabled?: boolean;
  children?: MenuItemConfig[];
}

export interface TooltipConfig {
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: any;
}

export interface SearchConfig {
  query: string;
  fields: string[];
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

export interface KeyboardShortcut {
  key: string;
  modifiers?: Array<'ctrl' | 'alt' | 'shift' | 'meta'>;
  action: () => void;
  description: string;
  disabled?: boolean;
}

export interface DragDropConfig {
  draggable: boolean;
  droppable: boolean;
  onDragStart?: (item: any) => void;
  onDragEnd?: (item: any) => void;
  onDrop?: (item: any, target: any) => void;
  acceptedTypes?: string[];
}

export interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollToIndex?: number;
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate';
}
