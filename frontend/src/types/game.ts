// Game-related TypeScript type definitions
// Based on backend Pydantic models

export type ActionType = 'player' | 'narration' | 'action' | 'system';

export interface StoryEntry {
  id: string;
  type: ActionType;
  text: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CharacterStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export type EquipmentSlot = 'weapon' | 'armor' | 'helmet' | 'boots' | 'accessory';

export interface Character {
  name: string;
  level: number;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  experience: number;
  stats: CharacterStats;
  class_name: string;
  background?: string;
  equipped_items: Record<EquipmentSlot, string>;
  max_carry_weight: number;
  metadata?: Record<string, any>;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  item_type: string;
  rarity: string;
  value: number;
  weight: number;
  quantity: number;
  properties: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  objectives: string[];
  rewards: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WorldState {
  current_location: string;
  time_of_day: string;
  weather: string;
  special_conditions: string[];
  npcs_present: string[];
  available_actions: string[];
  metadata?: Record<string, any>;
}

export interface GameSession {
  session_id: string;
  character: Character;
  inventory: InventoryItem[];
  quests: Quest[];
  story: StoryEntry[];
  world_state: WorldState;
  scenario_id?: string;
  lorebook_id?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface PlayerAction {
  sessionId: string;
  action: string;
  timestamp: Date;
}

export interface ActionResult {
  success: boolean;
  action_result: {
    player_action: StoryEntry;
    ai_response: StoryEntry;
  };
  updated_session: GameSession;
  world_changes?: Partial<WorldState>;
}

export interface GenerationRequest {
  series_title: string;
  series_type: string;
  genre: string;
  setting: string;
  power_system: string;
  tone: string;
  themes: string[];
}

export interface GenerationTask {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface ScenarioTemplate {
  id: string;
  title: string;
  description: string;
  genre: string;
  setting: string;
  initial_narrative?: string;
  metadata?: Record<string, any>;
}

export interface Lorebook {
  id: string;
  title: string;
  description: string;
  characters: Record<string, any>[];
  locations: Record<string, any>[];
  lore: Record<string, any>[];
  metadata?: Record<string, any>;
}

export interface CreateSessionRequest {
  lorebook_id?: string;
  character_name?: string;
  scenario_template_id?: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  services: Record<string, any>;
  performance: Record<string, any>;
  configuration: Record<string, any>;
}

export interface PerformanceMetrics {
  timestamp: string;
  summary: {
    total_operations: number;
    avg_response_time: number;
    error_rate: number;
    cache_hit_rate: number;
  };
  operations: Array<{
    operation: string;
    avg_duration: number;
    total_calls: number;
    error_rate: number;
  }>;
}
