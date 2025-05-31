// Dynamic UI Service - AI-driven UI text and messages
// Replaces hardcoded UI text with contextual, AI-generated content

import { Character, GameSession, StoryEntry } from '@/types';
import { gameAPI } from '@/services/api/client';

export interface UIContext {
  character?: Character;
  session?: GameSession;
  currentLocation?: string;
  recentStory?: StoryEntry[];
  gameState?: 'starting' | 'playing' | 'paused' | 'completed';
  panelType?: 'story' | 'character' | 'inventory' | 'quests' | 'world';
}

export interface DynamicUIContent {
  emptyStateTitle: string;
  emptyStateMessage: string;
  placeholderText: string;
  statusMessages: {
    connecting: string;
    connected: string;
    disconnected: string;
    error: string;
    aiThinking: string;
    readyToSend: string;
  };
  actionSuggestions?: string[];
}

export interface AIUIResponse {
  empty_state_title?: string;
  empty_state_message?: string;
  placeholder_text?: string;
  status_messages?: {
    connecting?: string;
    connected?: string;
    disconnected?: string;
    error?: string;
    ai_thinking?: string;
    ready_to_send?: string;
  };
  action_suggestions?: string[];
}

class DynamicUIService {
  private readonly contentCache = new Map<string, DynamicUIContent>();
  private readonly cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get dynamic UI content based on context
   */
  async getDynamicUIContent(context: UIContext): Promise<DynamicUIContent> {
    const cacheKey = this.generateCacheKey(context);

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.contentCache.get(cacheKey)!;
    }

    // TODO: Implement AI content generation endpoint in backend
    // For now, use contextual fallback which provides excellent dynamic content
    console.log('Using contextual fallback for dynamic UI content (AI endpoint not yet implemented)');
    const fallbackContent = this.generateContextualFallback(context);
    this.setCacheContent(cacheKey, fallbackContent);
    return fallbackContent;

    /* Disabled until backend endpoint is implemented
    try {
      // Try to get AI-generated content
      const aiContent = await this.generateAIContent(context);
      this.setCacheContent(cacheKey, aiContent);
      return aiContent;
    } catch (error) {
      console.warn('AI UI content generation failed, using contextual fallback:', error);
      const fallbackContent = this.generateContextualFallback(context);
      this.setCacheContent(cacheKey, fallbackContent);
      return fallbackContent;
    }
    */
  }

  /**
   * Generate AI-driven UI content
   */
  private async generateAIContent(context: UIContext): Promise<DynamicUIContent> {
    // Use the existing generateAIResponse method as a workaround
    // until a dedicated UI content endpoint is added to the backend
    const response = await gameAPI.generateAIResponse({
      character: context.character,
      current_location: context.currentLocation,
      recent_story: context.recentStory?.slice(-3), // Last 3 entries for context
      game_state: context.gameState,
      panel_type: context.panelType,
    }, 'generate_ui_content');

    return this.parseAIUIResponse(response.response);
  }

  /**
   * Parse AI response into UI content
   */
  private parseAIUIResponse(aiResponse: AIUIResponse): DynamicUIContent {
    return {
      emptyStateTitle: aiResponse.empty_state_title ?? 'Your Adventure Awaits',
      emptyStateMessage: aiResponse.empty_state_message ?? 'Begin your journey by taking your first action.',
      placeholderText: aiResponse.placeholder_text ?? 'What do you do?',
      statusMessages: {
        connecting: aiResponse.status_messages?.connecting ?? 'Connecting to your adventure...',
        connected: aiResponse.status_messages?.connected ?? 'Ready for adventure',
        disconnected: aiResponse.status_messages?.disconnected ?? 'Connection lost',
        error: aiResponse.status_messages?.error ?? 'Something went wrong',
        aiThinking: aiResponse.status_messages?.ai_thinking ?? 'The story unfolds...',
        readyToSend: aiResponse.status_messages?.ready_to_send ?? 'Ready to continue',
      },
      actionSuggestions: aiResponse.action_suggestions ?? [],
    };
  }

  /**
   * Generate contextual fallback content
   */
  private generateContextualFallback(context: UIContext): DynamicUIContent {
    return {
      emptyStateTitle: this.getContextualEmptyTitle(context),
      emptyStateMessage: this.getContextualEmptyMessage(context),
      placeholderText: this.getContextualPlaceholder(context),
      statusMessages: this.getContextualStatusMessages(context),
      actionSuggestions: this.getContextualActionSuggestions(context),
    };
  }

  /**
   * Get contextual empty state title
   */
  private getContextualEmptyTitle(context: UIContext): string {
    const { character, panelType, gameState } = context;
    const characterName = character?.name ?? 'Your Character';

    switch (panelType) {
      case 'story':
        if (gameState === 'starting') {
          return `${characterName}'s Adventure Begins`;
        }
        return 'No Story Entries Found';

      case 'character':
        return `${characterName}'s Profile`;

      case 'inventory':
        return `${characterName}'s Inventory`;

      case 'quests':
        return 'Quest Log';

      case 'world':
        return 'World Information';

      default:
        return 'Your Adventure Awaits';
    }
  }

  /**
   * Get contextual empty state message
   */
  private getContextualEmptyMessage(context: UIContext): string {
    const { character, panelType, gameState, currentLocation } = context;
    const characterName = character?.name ?? 'your character';
    const location = currentLocation ?? 'the world';

    switch (panelType) {
      case 'story':
        if (gameState === 'starting') {
          return `Take your first action to begin ${characterName}'s story in ${location}.`;
        }
        return 'No entries match your current search or filter criteria.';
      
      case 'character':
        return `View ${characterName}'s stats, equipment, and progression here.`;
      
      case 'inventory':
        return `${characterName}'s inventory is empty. Explore ${location} to find items and equipment.`;
      
      case 'quests':
        return `No active quests. Explore ${location} and interact with characters to discover new adventures.`;
      
      case 'world':
        return `Explore ${location} to discover its secrets and learn about the world around you.`;
      
      default:
        return `Begin your adventure as ${characterName} in ${location}.`;
    }
  }

  /**
   * Get contextual placeholder text
   */
  private getContextualPlaceholder(context: UIContext): string {
    const { character, currentLocation, recentStory } = context;
    const characterName = character?.name ?? 'your character';
    const location = currentLocation ?? 'this area';

    // Base placeholders
    const placeholders = [
      `What does ${characterName} do?`,
      `How does ${characterName} respond?`,
      `Describe ${characterName}'s action...`,
    ];

    // Add location-specific placeholders
    if (currentLocation) {
      placeholders.push(
        `What does ${characterName} do in ${location}?`,
        `How does ${characterName} explore ${location}?`,
      );
    }

    // Add context from recent story
    if (recentStory && recentStory.length > 0) {
      const lastEntry = recentStory[recentStory.length - 1];
      if (lastEntry.type === 'narration') {
        placeholders.push(
          `How does ${characterName} react to this?`,
          `What's ${characterName}'s response?`,
        );
      }
    }

    return placeholders[Math.floor(Math.random() * placeholders.length)];
  }

  /**
   * Get contextual status messages
   */
  private getContextualStatusMessages(context: UIContext): DynamicUIContent['statusMessages'] {
    const characterName = context.character?.name ?? 'your character';

    return {
      connecting: `Connecting ${characterName} to the adventure...`,
      connected: `${characterName} is ready for action`,
      disconnected: `${characterName} has been disconnected`,
      error: `Something went wrong with ${characterName}'s connection`,
      aiThinking: `The world responds to ${characterName}...`,
      readyToSend: `${characterName} is ready to act`,
    };
  }

  /**
   * Get contextual action suggestions
   */
  private getContextualActionSuggestions(context: UIContext): string[] {
    const { character, currentLocation, recentStory } = context;
    const suggestions: string[] = [];

    // Basic actions
    suggestions.push('Look around', 'Check surroundings');

    // Character-specific actions
    if (character) {
      suggestions.push('Check inventory', 'Review character status');
      
      // Class-specific suggestions
      const className = character.class_name?.toLowerCase();
      switch (className) {
        case 'warrior':
        case 'fighter':
          suggestions.push('Ready weapon', 'Assess threats');
          break;
        case 'mage':
        case 'wizard':
          suggestions.push('Sense magic', 'Study surroundings');
          break;
        case 'rogue':
        case 'thief':
          suggestions.push('Search for secrets', 'Listen carefully');
          break;
        case 'cleric':
        case 'priest':
          suggestions.push('Pray for guidance', 'Sense undead');
          break;
      }
    }

    // Location-specific suggestions
    if (currentLocation) {
      const location = currentLocation.toLowerCase();
      if (location.includes('forest')) {
        suggestions.push('Follow the path', 'Listen to nature');
      } else if (location.includes('town') || location.includes('city')) {
        suggestions.push('Find an inn', 'Talk to locals');
      } else if (location.includes('dungeon') || location.includes('cave')) {
        suggestions.push('Light a torch', 'Proceed carefully');
      }
    }

    // Context from recent story
    if (recentStory && recentStory.length > 0) {
      const lastEntry = recentStory[recentStory.length - 1];
      if (lastEntry.text.toLowerCase().includes('door')) {
        suggestions.push('Open the door', 'Examine the door');
      } else if (lastEntry.text.toLowerCase().includes('npc') || lastEntry.text.toLowerCase().includes('person')) {
        suggestions.push('Talk to them', 'Approach carefully');
      }
    }

    return suggestions.slice(0, 6); // Limit to 6 suggestions
  }

  /**
   * Get dynamic export options based on story content
   */
  getExportOptions(context: UIContext): Array<{ label: string; value: string; description: string }> {
    const { character, session } = context;
    const characterName = character?.name ?? 'Character';
    const storyLength = session?.story?.length ?? 0;

    const options = [
      {
        label: 'Export as Text',
        value: 'text',
        description: `Plain text version of ${characterName}'s adventure`,
      },
      {
        label: 'Export as Markdown',
        value: 'markdown',
        description: `Formatted markdown with ${storyLength} story entries`,
      },
    ];

    // Add conditional export options
    if (storyLength > 50) {
      options.push({
        label: 'Export as PDF',
        value: 'pdf',
        description: `Professional PDF of ${characterName}'s complete adventure`,
      });
    }

    if (character && character.level > 5) {
      options.push({
        label: 'Character Sheet Export',
        value: 'character',
        description: `${characterName}'s character sheet and progression`,
      });
    }

    return options;
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(context: UIContext): string {
    return JSON.stringify({
      characterId: context.character?.name,
      location: context.currentLocation,
      gameState: context.gameState,
      panelType: context.panelType,
      storyLength: context.recentStory?.length ?? 0,
    });
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  private setCacheContent(cacheKey: string, content: DynamicUIContent): void {
    this.contentCache.set(cacheKey, content);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now >= expiry) {
        this.contentCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }
}

export const dynamicUIService = new DynamicUIService();
