// API-related TypeScript type definitions

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class APIError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  session_id?: string;
}

export interface GameMessage {
  type: 'narrative' | 'world' | 'character' | 'quest' | 'error';
  data: any;
}

export interface WebSocketCallbacks {
  sessionId?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onNarrativeUpdate?: (data: any) => void;
  onWorldUpdate?: (data: any) => void;
  onCharacterUpdate?: (data: any) => void;
  onQuestUpdate?: (data: any) => void;
  onError?: (error: Error) => void;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface GameUpdate {
  type: string;
  session_id: string;
  data: any;
  timestamp: Date;
  user_id?: string;
}

export interface ScenarioFilters {
  genre?: string;
  setting?: string;
  difficulty?: string;
  duration?: string;
}

export interface LorebookFilters {
  genre?: string;
  setting?: string;
  character_count?: number;
  location_count?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface APIConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  retries?: number;
}
