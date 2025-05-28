// Main types export file
// Re-exports all type definitions for easy importing

// Game types
export type {
  ActionType,
  StoryEntry,
  CharacterStats,
  EquipmentSlot,
  Character,
  InventoryItem,
  Quest,
  WorldState,
  GameSession,
  GameSessionSummary,
  PlayerAction,
  ActionResult,
  GenerationRequest,
  GenerationTask,
  ScenarioTemplate,
  Lorebook,
  CreateSessionRequest,
  HealthStatus,
  PerformanceMetrics,
  StoryBookmark,
  BookmarkFilter,
  StoryExportOptions,
  ExportProgress,
  StorySearchResult,
  StorySearchOptions,
  CharacterMilestone,
  CharacterProgressionInsight,
} from './game';

// API types
export type {
  APIResponse,
  WebSocketMessage,
  GameMessage,
  WebSocketCallbacks,
  ConnectionStatus,
  GameUpdate,
  ScenarioFilters,
  LorebookFilters,
  PaginatedResponse,
  APIConfig,
  CacheEntry,
  RequestOptions,
} from './api';

export { NetworkError, APIError } from './api';

// UI types
export type {
  Theme,
  ScreenSize,
  ActivePanel,
  UIConfig,
  UIPreferences,
  LoadingState,
  NotificationConfig,
  ModalConfig,
  FormField,
  TabConfig,
  MenuItemConfig,
  TooltipConfig,
  PaginationConfig,
  SortConfig,
  FilterConfig,
  SearchConfig,
  KeyboardShortcut,
  DragDropConfig,
  VirtualizationConfig,
  AnimationConfig,
} from './ui';

// Common utility types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface TimestampedEntity extends BaseEntity {
  timestamp: string;
}

export interface MetadataEntity extends BaseEntity {
  metadata?: Record<string, any>;
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type EventHandler<T = any> = (event: T) => void;

export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

export type Callback<T = void> = () => T;

export type AsyncCallback<T = void> = () => Promise<T>;

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface InteractiveProps extends ComponentProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: EventHandler<React.MouseEvent>;
  onKeyDown?: EventHandler<React.KeyboardEvent>;
}

export interface FormProps extends ComponentProps {
  onSubmit?: EventHandler<React.FormEvent>;
  onReset?: EventHandler<React.FormEvent>;
  onValidate?: (values: any) => Record<string, string>;
}

export interface ListProps<T> extends ComponentProps {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  emptyMessage?: string;
  loading?: boolean;
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> extends ComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  filtering?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
    value: any;
  }>;
  selection?: {
    selectedKeys: string[];
    onSelectionChange: (keys: string[]) => void;
    multiple?: boolean;
  };
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
}

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartProps extends ComponentProps {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  colors?: string[];
  height?: number;
  width?: number;
}
