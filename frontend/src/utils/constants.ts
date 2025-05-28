// Application constants

export const API_ENDPOINTS = {
  // Health and system
  HEALTH: '/api/health',
  PERFORMANCE: '/api/performance',

  // Game sessions
  SESSIONS: '/api/game/sessions',
  SESSION_BY_ID: (id: string) => `/api/game/sessions/${id}`,
  SESSION_ACTION: (id: string) => `/api/game/sessions/${id}/action`,

  // Lorebooks
  LOREBOOKS: '/api/lorebooks',
  LOREBOOK_BY_ID: (id: string) => `/api/lorebooks/${id}`,

  // Scenarios
  SCENARIOS: '/api/scenarios/templates',
  SCENARIO_GENERATE: '/api/scenarios/generate',
  SCENARIO_STATUS: (taskId: string) => `/api/scenarios/status/${taskId}`,

  // AI services
  AI_GENERATE: '/api/ai/generate-response',
  AI_VALIDATE: '/api/ai/validate-action',

  // WebSocket
  WS_GAME: (sessionId: string) => `/ws/game/${sessionId}`,
} as const;

export const WEBSOCKET_MESSAGE_TYPES = {
  // Client to server
  ACTION: 'action',
  PING: 'ping',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',

  // Server to client
  NARRATIVE_RESPONSE: 'narrative_response',
  WORLD_CHANGE: 'world_change',
  CHARACTER_UPDATE: 'character_update',
  QUEST_UPDATE: 'quest_update',
  CONNECTION: 'connection',
  PONG: 'pong',
  ERROR: 'error',
} as const;

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'emergentRPG_userPreferences',
  UI_CONFIG: 'emergentRPG_uiConfig',
  CACHED_SESSIONS: 'emergentRPG_cachedSessions',
  PENDING_ACTIONS: 'emergentRPG_pendingActions',
  LAST_SYNC_TIME: 'emergentRPG_lastSyncTime',
  THEME: 'emergentRPG_theme',
  SIDEBAR_COLLAPSED: 'emergentRPG_sidebarCollapsed',
  ACTIVE_PANEL: 'emergentRPG_activePanel',
} as const;

export const QUERY_KEYS = {
  HEALTH: ['health'],
  PERFORMANCE: ['performance'],
  SESSIONS: ['sessions'],
  SESSION: (id: string) => ['session', id],
  LOREBOOKS: ['lorebooks'],
  LOREBOOK: (id: string) => ['lorebook', id],
  SCENARIOS: ['scenarios'],
  SCENARIO: (id: string) => ['scenario', id],
  GENERATION_TASK: (taskId: string) => ['generationTask', taskId],
} as const;

export const DEFAULT_VALUES = {
  // API configuration
  API_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,

  // Cache configuration
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  STALE_TIME: 1 * 60 * 1000, // 1 minute
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes

  // WebSocket configuration
  WS_RECONNECT_ATTEMPTS: 5,
  WS_RECONNECT_DELAY: 1000,
  WS_PING_INTERVAL: 30000,

  // UI configuration
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 48,
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,

  // Game configuration - These should be dynamically generated based on context
  // Keeping as fallbacks for error states only
  MAX_STORY_ENTRIES: 1000,
  MAX_ACTION_LENGTH: 500,
  AUTO_SAVE_INTERVAL: 30000,
  TYPING_SPEED: 50,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Character defaults - These should be AI-generated based on character background
  // Keeping minimal fallbacks for error states only
  FALLBACK_CHARACTER_HEALTH: 100,
  FALLBACK_CHARACTER_MANA: 50,
  FALLBACK_CHARACTER_LEVEL: 1,
  FALLBACK_CARRY_WEIGHT: 100,
} as const;

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

export const SCREEN_SIZES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

export const PANELS = {
  SESSIONS: 'sessions',
  STORY: 'story',
  CHARACTER: 'character',
  INVENTORY: 'inventory',
  QUESTS: 'quests',
  WORLD: 'world',
} as const;

export const ACTION_TYPES = {
  PLAYER: 'player',
  NARRATION: 'narration',
  ACTION: 'action',
  SYSTEM: 'system',
} as const;

export const QUEST_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const GENERATION_STATUSES = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const CONNECTION_STATUSES = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
} as const;

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export const EQUIPMENT_SLOTS = {
  WEAPON: 'weapon',
  HELMET: 'helmet',
  CHEST: 'chest',
  LEGS: 'legs',
  BOOTS: 'boots',
  GLOVES: 'gloves',
  RING: 'ring',
  NECKLACE: 'necklace',
  SHIELD: 'shield',
} as const;

export const ITEM_RARITIES = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;

export const KEYBOARD_SHORTCUTS = {
  TOGGLE_SIDEBAR: 'ctrl+b',
  FOCUS_ACTION_INPUT: 'ctrl+/',
  QUICK_SAVE: 'ctrl+s',
  TOGGLE_THEME: 'ctrl+shift+t',
  OPEN_HELP: 'f1',
  ESCAPE: 'escape',
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  API_ERROR: 'An error occurred while communicating with the server.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An internal server error occurred. Please try again later.',
  WEBSOCKET_ERROR: 'Real-time connection failed. Some features may not work properly.',
  CACHE_ERROR: 'Failed to load cached data.',
  STORAGE_ERROR: 'Failed to save data locally.',
} as const;

export const SUCCESS_MESSAGES = {
  SESSION_CREATED: 'Game session created successfully!',
  ACTION_PERFORMED: 'Action performed successfully!',
  SESSION_SAVED: 'Game session saved successfully!',
  SETTINGS_UPDATED: 'Settings updated successfully!',
  DATA_EXPORTED: 'Data exported successfully!',
  CONNECTION_RESTORED: 'Connection restored successfully!',
} as const;
