// Game-related TypeScript type definitions
// Based on backend Pydantic models

export type ActionType = 'player' | 'narration' | 'action' | 'system';

export interface StoryEntry {
  id: string;
  type: ActionType;
  text: string;
  timestamp: string;
  metadata?: {
    ai_confidence?: number; // 0-1 scale for AI confidence
    ai_context?: string[]; // Context the AI considered
    ai_generated?: boolean; // Whether this was AI-generated
    ai_insight_id?: string; // ID of associated AI insight
    [key: string]: any;
  };
}

export interface CharacterStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export type EquipmentSlot = 'weapon' | 'helmet' | 'chest' | 'legs' | 'boots' | 'gloves' | 'ring' | 'necklace' | 'shield';

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
  type: string; // weapon, armor, consumable, misc
  rarity: string;
  description?: string;
  quantity: number;
  equipped: boolean;
  equipment_slot?: EquipmentSlot;
  weight: number;
  durability?: number;
  max_durability?: number;
  metadata?: Record<string, any>;
}

export interface QuestProgress {
  current: number;
  total: number;
  completed_objectives: boolean[];
  percentage: number;
  is_complete: boolean;
}

export interface QuestDependency {
  quest_id: string;
  required_status: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed' | 'hidden';
  progress: QuestProgress;
  objectives: string[];
  rewards?: Record<string, any>;
  dependencies: QuestDependency[];
  time_limit?: number;
  failure_conditions: string[];
  metadata?: Record<string, any>;
}

export interface WorldState {
  current_location: string;
  time_of_day: string;
  weather: string;
  npcs_present: string[];
  available_actions: string[];
  environment_description: string;
  special_conditions: string[];
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

// Session summary for list views (from /api/game/sessions)
export interface GameSessionSummary {
  session_id: string;
  character: Character;
  world_state: WorldState;
  story_length: number;
  created_at: string;
  updated_at: string;
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

// Bookmark system types
export interface StoryBookmark {
  id: string;
  storyEntryId: string;
  sessionId: string;
  title: string;
  description?: string;
  tags: string[];
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
  category: 'important' | 'character_development' | 'plot_point' | 'dialogue' | 'action' | 'custom';
  isPrivate: boolean;
}

export interface BookmarkFilter {
  category?: string;
  tags?: string[];
  searchQuery?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Export system types
export interface StoryExportOptions {
  format: 'pdf' | 'markdown' | 'text' | 'json';
  includeCharacterInfo: boolean;
  includeWorldState: boolean;
  includeBookmarks: boolean;
  includeTimestamps: boolean;
  customTitle?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ExportProgress {
  id: string;
  status: 'preparing' | 'generating' | 'formatting' | 'complete' | 'error';
  progress: number;
  message: string;
  downloadUrl?: string;
  error?: string;
}

// Search and navigation types
export interface StorySearchResult {
  entryId: string;
  entry: StoryEntry;
  relevanceScore: number;
  matchedText: string;
  context: {
    before: string;
    after: string;
  };
  category: 'dialogue' | 'action' | 'description' | 'system';
}

export interface StorySearchOptions {
  query: string;
  categories?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  includeBookmarked?: boolean;
  maxResults?: number;
}

// Character progression types
export interface CharacterMilestone {
  id: string;
  sessionId: string;
  characterName: string;
  type: 'level_up' | 'skill_gain' | 'story_achievement' | 'relationship_change' | 'custom';
  title: string;
  description: string;
  timestamp: string;
  relatedStoryEntryId?: string;
  metadata?: Record<string, any>;
}

export interface CharacterProgressionInsight {
  id: string;
  characterName: string;
  insightType: 'growth_pattern' | 'decision_analysis' | 'relationship_dynamics' | 'skill_development';
  title: string;
  description: string;
  aiGenerated: boolean;
  confidence: number;
  relatedMilestones: string[];
  timestamp: string;
}
