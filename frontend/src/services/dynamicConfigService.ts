// Dynamic Configuration Service - AI-driven game configuration
// Replaces hardcoded game mechanics with AI-generated values

import { Character, GameSession, StoryEntry } from '@/types';
import { gameAPIClient } from '@/services/gameAPIClient';
import { DEFAULT_VALUES } from '@/utils/constants';

export interface GameContext {
  character?: Character;
  session?: GameSession;
  storyLength?: number;
  currentLocation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  playstyle?: 'combat' | 'exploration' | 'social' | 'balanced';
}

export interface DynamicGameConfig {
  maxStoryEntries: number;
  maxActionLength: number;
  autoSaveInterval: number;
  typingSpeed: number;
  aiResponseTimeout: number;
  suggestionCount: number;
  contextWindow: number;
  difficultyModifiers: {
    healthMultiplier: number;
    manaMultiplier: number;
    experienceMultiplier: number;
    challengeRating: number;
  };
  adaptiveSettings: {
    enableDynamicDifficulty: boolean;
    enableContextualSuggestions: boolean;
    enablePersonalizedNarration: boolean;
    enableEmergentStorylines: boolean;
  };
}

class DynamicConfigService {
  private configCache = new Map<string, DynamicGameConfig>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Get dynamic game configuration based on context
   */
  async getDynamicGameConfig(context: GameContext): Promise<DynamicGameConfig> {
    const cacheKey = this.generateCacheKey(context);
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.configCache.get(cacheKey)!;
    }

    try {
      // Try to get AI-generated configuration
      const aiConfig = await this.generateAIConfig(context);
      this.setCacheContent(cacheKey, aiConfig);
      return aiConfig;
    } catch (error) {
      console.warn('AI config generation failed, using adaptive fallback:', error);
      const fallbackConfig = this.generateAdaptiveFallback(context);
      this.setCacheContent(cacheKey, fallbackConfig);
      return fallbackConfig;
    }
  }

  /**
   * Generate AI-driven configuration
   */
  private async generateAIConfig(context: GameContext): Promise<DynamicGameConfig> {
    const response = await gameAPIClient.post('/api/ai/generate-game-config', {
      character: context.character,
      session_id: context.session?.session_id,
      story_length: context.storyLength,
      current_location: context.currentLocation,
      difficulty: context.difficulty,
      playstyle: context.playstyle,
    });

    return this.parseAIConfigResponse(response.data);
  }

  /**
   * Parse AI response into game configuration
   */
  private parseAIConfigResponse(aiResponse: any): DynamicGameConfig {
    return {
      maxStoryEntries: aiResponse.max_story_entries || 1000,
      maxActionLength: aiResponse.max_action_length || 500,
      autoSaveInterval: aiResponse.auto_save_interval || 30000,
      typingSpeed: aiResponse.typing_speed || 50,
      aiResponseTimeout: aiResponse.ai_response_timeout || 30000,
      suggestionCount: aiResponse.suggestion_count || 6,
      contextWindow: aiResponse.context_window || 10,
      difficultyModifiers: {
        healthMultiplier: aiResponse.difficulty_modifiers?.health_multiplier || 1.0,
        manaMultiplier: aiResponse.difficulty_modifiers?.mana_multiplier || 1.0,
        experienceMultiplier: aiResponse.difficulty_modifiers?.experience_multiplier || 1.0,
        challengeRating: aiResponse.difficulty_modifiers?.challenge_rating || 1.0,
      },
      adaptiveSettings: {
        enableDynamicDifficulty: aiResponse.adaptive_settings?.enable_dynamic_difficulty ?? true,
        enableContextualSuggestions: aiResponse.adaptive_settings?.enable_contextual_suggestions ?? true,
        enablePersonalizedNarration: aiResponse.adaptive_settings?.enable_personalized_narration ?? true,
        enableEmergentStorylines: aiResponse.adaptive_settings?.enable_emergent_storylines ?? true,
      },
    };
  }

  /**
   * Generate adaptive fallback configuration
   */
  private generateAdaptiveFallback(context: GameContext): DynamicGameConfig {
    const baseConfig = this.getBaseConfiguration();
    
    // Adapt based on character level and experience
    if (context.character) {
      baseConfig.maxStoryEntries = Math.max(1000, context.character.level * 100);
      baseConfig.maxActionLength = Math.max(500, 300 + context.character.level * 20);
      
      // Adjust typing speed based on character intelligence
      const intelligence = context.character.stats?.intelligence || 10;
      baseConfig.typingSpeed = Math.max(30, Math.min(100, 30 + intelligence * 3));
    }

    // Adapt based on story length
    if (context.storyLength) {
      if (context.storyLength > 500) {
        baseConfig.autoSaveInterval = 15000; // More frequent saves for long stories
        baseConfig.contextWindow = 15; // Larger context window
      } else if (context.storyLength < 50) {
        baseConfig.suggestionCount = 8; // More suggestions for new players
        baseConfig.typingSpeed = 40; // Slower typing for beginners
      }
    }

    // Adapt based on difficulty
    switch (context.difficulty) {
      case 'easy':
        baseConfig.difficultyModifiers.healthMultiplier = 1.5;
        baseConfig.difficultyModifiers.manaMultiplier = 1.3;
        baseConfig.difficultyModifiers.experienceMultiplier = 1.2;
        baseConfig.difficultyModifiers.challengeRating = 0.7;
        baseConfig.suggestionCount = 8;
        break;
      case 'hard':
        baseConfig.difficultyModifiers.healthMultiplier = 0.8;
        baseConfig.difficultyModifiers.manaMultiplier = 0.9;
        baseConfig.difficultyModifiers.experienceMultiplier = 1.5;
        baseConfig.difficultyModifiers.challengeRating = 1.4;
        baseConfig.suggestionCount = 4;
        break;
      default: // medium
        baseConfig.difficultyModifiers.healthMultiplier = 1.0;
        baseConfig.difficultyModifiers.manaMultiplier = 1.0;
        baseConfig.difficultyModifiers.experienceMultiplier = 1.0;
        baseConfig.difficultyModifiers.challengeRating = 1.0;
        baseConfig.suggestionCount = 6;
    }

    // Adapt based on playstyle
    switch (context.playstyle) {
      case 'combat':
        baseConfig.aiResponseTimeout = 20000; // Faster responses for combat
        baseConfig.adaptiveSettings.enableDynamicDifficulty = true;
        break;
      case 'exploration':
        baseConfig.maxActionLength = 800; // Longer descriptions for exploration
        baseConfig.contextWindow = 20; // More context for world building
        break;
      case 'social':
        baseConfig.suggestionCount = 10; // More dialogue options
        baseConfig.adaptiveSettings.enablePersonalizedNarration = true;
        break;
      case 'balanced':
      default:
        // Use base configuration
        break;
    }

    return baseConfig;
  }

  /**
   * Get base configuration
   */
  private getBaseConfiguration(): DynamicGameConfig {
    return {
      maxStoryEntries: DEFAULT_VALUES.MAX_STORY_ENTRIES,
      maxActionLength: DEFAULT_VALUES.MAX_ACTION_LENGTH,
      autoSaveInterval: DEFAULT_VALUES.AUTO_SAVE_INTERVAL,
      typingSpeed: DEFAULT_VALUES.TYPING_SPEED,
      aiResponseTimeout: 30000,
      suggestionCount: 6,
      contextWindow: 10,
      difficultyModifiers: {
        healthMultiplier: 1.0,
        manaMultiplier: 1.0,
        experienceMultiplier: 1.0,
        challengeRating: 1.0,
      },
      adaptiveSettings: {
        enableDynamicDifficulty: true,
        enableContextualSuggestions: true,
        enablePersonalizedNarration: true,
        enableEmergentStorylines: true,
      },
    };
  }

  /**
   * Get dynamic action suggestions based on context
   */
  async getDynamicActionSuggestions(context: GameContext): Promise<string[]> {
    try {
      const response = await gameAPIClient.post('/api/ai/generate-action-suggestions', {
        character: context.character,
        current_location: context.currentLocation,
        recent_story: context.session?.story?.slice(-5), // Last 5 entries
        playstyle: context.playstyle,
        difficulty: context.difficulty,
      });

      return response.data.suggestions || this.getFallbackSuggestions(context);
    } catch (error) {
      console.warn('AI action suggestions failed, using fallback:', error);
      return this.getFallbackSuggestions(context);
    }
  }

  /**
   * Get fallback action suggestions
   */
  private getFallbackSuggestions(context: GameContext): string[] {
    const suggestions: string[] = [];
    
    // Basic actions
    suggestions.push('Look around', 'Check surroundings');
    
    // Character-specific suggestions
    if (context.character) {
      suggestions.push('Check inventory', 'Review status');
      
      const className = context.character.class_name?.toLowerCase();
      switch (className) {
        case 'warrior':
        case 'fighter':
          suggestions.push('Ready weapon', 'Assess threats', 'Stand guard');
          break;
        case 'mage':
        case 'wizard':
          suggestions.push('Sense magic', 'Study surroundings', 'Cast detect magic');
          break;
        case 'rogue':
        case 'thief':
          suggestions.push('Search for secrets', 'Listen carefully', 'Check for traps');
          break;
        case 'cleric':
        case 'priest':
          suggestions.push('Pray for guidance', 'Sense undead', 'Bless the area');
          break;
      }
    }

    // Location-specific suggestions
    if (context.currentLocation) {
      const location = context.currentLocation.toLowerCase();
      if (location.includes('forest')) {
        suggestions.push('Follow the path', 'Listen to nature', 'Climb a tree');
      } else if (location.includes('town') || location.includes('city')) {
        suggestions.push('Find an inn', 'Talk to locals', 'Visit the market');
      } else if (location.includes('dungeon') || location.includes('cave')) {
        suggestions.push('Light a torch', 'Proceed carefully', 'Check for exits');
      }
    }

    // Playstyle-specific suggestions
    switch (context.playstyle) {
      case 'combat':
        suggestions.push('Prepare for battle', 'Scout for enemies');
        break;
      case 'exploration':
        suggestions.push('Explore thoroughly', 'Map the area');
        break;
      case 'social':
        suggestions.push('Look for people', 'Start a conversation');
        break;
    }

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(context: GameContext): string {
    return JSON.stringify({
      characterLevel: context.character?.level,
      characterClass: context.character?.class_name,
      storyLength: context.storyLength,
      location: context.currentLocation,
      difficulty: context.difficulty,
      playstyle: context.playstyle,
    });
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  private setCacheContent(cacheKey: string, content: DynamicGameConfig): void {
    this.configCache.set(cacheKey, content);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now >= expiry) {
        this.configCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }
}

export const dynamicConfigService = new DynamicConfigService();
