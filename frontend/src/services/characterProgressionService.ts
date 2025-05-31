// Character Progression Service - AI-driven character development tracking
// Handles milestone tracking, progression insights, and character growth analysis

import { CharacterMilestone, CharacterProgressionInsight, Character, StoryEntry } from '@/types';
import { gameAPI } from '@/services/api/client';

export interface ProgressionAnalysis {
  overallGrowth: number; // 0-100 score
  dominantTraits: string[];
  growthAreas: string[];
  recentChanges: CharacterMilestone[];
  insights: CharacterProgressionInsight[];
}

export interface MilestoneCreationRequest {
  sessionId: string;
  characterName: string;
  type: CharacterMilestone['type'];
  title: string;
  description: string;
  relatedStoryEntryId?: string;
  metadata?: Record<string, any>;
}

class CharacterProgressionService {
  private readonly milestoneCache = new Map<string, CharacterMilestone[]>();
  private readonly insightCache = new Map<string, CharacterProgressionInsight[]>();
  private readonly cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Track character progression and generate insights
   */
  async analyzeCharacterProgression(sessionId: string): Promise<ProgressionAnalysis> {
    try {
      const response = await gameAPI.getCharacterProgression(sessionId);

      if (response.success) {
        return response.progression_analysis;
      } else {
        throw new Error('Failed to get character progression');
      }
    } catch (error) {
      console.warn('Character progression analysis failed, using fallback:', error);
      return this.analyzeProgressionFallback(sessionId);
    }
  }

  /**
   * Create a new character milestone
   */
  async createMilestone(request: MilestoneCreationRequest): Promise<CharacterMilestone> {
    try {
      // TODO: Implement backend API call for milestone creation
      console.log('Milestone creation API not yet implemented, using fallback');
      return this.createMilestoneFallback(request);
    } catch (error) {
      console.warn('Milestone creation failed, using fallback:', error);
      return this.createMilestoneFallback(request);
    }
  }

  /**
   * Get character milestones for a session
   */
  async getMilestones(sessionId: string): Promise<CharacterMilestone[]> {
    const cacheKey = `milestones_${sessionId}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cached = this.milestoneCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // TODO: Implement backend API call for milestone retrieval
      console.log('Milestone retrieval API not yet implemented, using fallback');
      const milestones = await this.getMilestonesFallback(sessionId);
      
      // Cache the results
      this.milestoneCache.set(cacheKey, milestones);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      
      return milestones;
    } catch (error) {
      console.warn('Milestone retrieval failed, using fallback:', error);
      return this.getMilestonesFallback(sessionId);
    }
  }

  /**
   * Generate AI insights about character development
   */
  async generateProgressionInsights(sessionId: string): Promise<CharacterProgressionInsight[]> {
    const cacheKey = `insights_${sessionId}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cached = this.insightCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // TODO: Implement backend AI insights API
      console.log('AI insights generation not yet implemented, using fallback');
      const insights = await this.generateInsightsFallback(sessionId);
      
      // Cache the results
      this.insightCache.set(cacheKey, insights);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      
      return insights;
    } catch (error) {
      console.warn('Insights generation failed, using fallback:', error);
      return this.generateInsightsFallback(sessionId);
    }
  }

  /**
   * Detect potential milestones from story entries
   */
  async detectMilestones(sessionId: string, recentEntries: StoryEntry[]): Promise<CharacterMilestone[]> {
    try {
      // TODO: Implement AI milestone detection API
      console.log('AI milestone detection not yet implemented, using fallback');
      return this.detectMilestonesFallback(sessionId, recentEntries);
    } catch (error) {
      console.warn('Milestone detection failed, using fallback:', error);
      return this.detectMilestonesFallback(sessionId, recentEntries);
    }
  }

  /**
   * Get character development timeline
   */
  async getProgressionTimeline(sessionId: string): Promise<{
    milestones: CharacterMilestone[];
    insights: CharacterProgressionInsight[];
    timeline: Array<{
      date: string;
      events: (CharacterMilestone | CharacterProgressionInsight)[];
    }>;
  }> {
    try {
      const [milestones, insights] = await Promise.all([
        this.getMilestones(sessionId),
        this.generateProgressionInsights(sessionId),
      ]);

      // Group events by date
      const timelineMap = new Map<string, (CharacterMilestone | CharacterProgressionInsight)[]>();
      
      [...milestones, ...insights].forEach(event => {
        const date = new Date(event.timestamp).toDateString();
        const existing = timelineMap.get(date) || [];
        existing.push(event);
        timelineMap.set(date, existing);
      });

      const timeline = Array.from(timelineMap.entries())
        .map(([date, events]) => ({ date, events }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return { milestones, insights, timeline };
    } catch (error) {
      console.warn('Timeline generation failed:', error);
      return { milestones: [], insights: [], timeline: [] };
    }
  }

  /**
   * Clear progression cache
   */
  clearCache(): void {
    this.milestoneCache.clear();
    this.insightCache.clear();
    this.cacheExpiry.clear();
  }

  // Private helper methods

  private async analyzeProgressionFallback(sessionId: string): Promise<ProgressionAnalysis> {
    try {
      const session = await gameAPI.getSession(sessionId);
      const character = session.session.character;
      const story = session.session.story;
      
      // Simple analysis based on character level and story length
      const overallGrowth = Math.min(100, (character.level - 1) * 20 + (story.length / 10));
      
      const dominantTraits = this.analyzeDominantTraits(character);
      const growthAreas = this.identifyGrowthAreas(character);
      const recentChanges = await this.getMilestones(sessionId);
      const insights = await this.generateProgressionInsights(sessionId);

      return {
        overallGrowth,
        dominantTraits,
        growthAreas,
        recentChanges: recentChanges.slice(-5), // Last 5 milestones
        insights: insights.slice(-3), // Last 3 insights
      };
    } catch (error) {
      console.error('Progression analysis fallback failed:', error);
      return {
        overallGrowth: 0,
        dominantTraits: [],
        growthAreas: [],
        recentChanges: [],
        insights: [],
      };
    }
  }

  private createMilestoneFallback(request: MilestoneCreationRequest): CharacterMilestone {
    const now = new Date().toISOString();
    const id = `milestone_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    return {
      id,
      sessionId: request.sessionId,
      characterName: request.characterName,
      type: request.type,
      title: request.title,
      description: request.description,
      timestamp: now,
      relatedStoryEntryId: request.relatedStoryEntryId,
      metadata: request.metadata,
    };
  }

  private async getMilestonesFallback(sessionId: string): Promise<CharacterMilestone[]> {
    // Return empty array for now - in real implementation, this would fetch from storage
    return [];
  }

  private async generateInsightsFallback(sessionId: string): Promise<CharacterProgressionInsight[]> {
    try {
      const session = await gameAPI.getSession(sessionId);
      const character = session.session.character;
      const story = session.session.story;
      
      const insights: CharacterProgressionInsight[] = [];
      const now = new Date().toISOString();

      // Generate basic insights based on character data
      if (character.level > 1) {
        insights.push({
          id: `insight_level_${Date.now()}`,
          characterName: character.name,
          insightType: 'growth_pattern',
          title: 'Character Advancement',
          description: `${character.name} has reached level ${character.level}, showing consistent growth and development.`,
          aiGenerated: false,
          confidence: 0.8,
          relatedMilestones: [],
          timestamp: now,
        });
      }

      if (story.length > 20) {
        insights.push({
          id: `insight_story_${Date.now()}`,
          characterName: character.name,
          insightType: 'decision_analysis',
          title: 'Story Engagement',
          description: `${character.name} has participated in ${story.length} story moments, demonstrating active engagement with the narrative.`,
          aiGenerated: false,
          confidence: 0.7,
          relatedMilestones: [],
          timestamp: now,
        });
      }

      return insights;
    } catch (error) {
      console.error('Insights generation fallback failed:', error);
      return [];
    }
  }

  private async detectMilestonesFallback(sessionId: string, recentEntries: StoryEntry[]): Promise<CharacterMilestone[]> {
    const milestones: CharacterMilestone[] = [];
    
    try {
      const session = await gameAPI.getSession(sessionId);
      const character = session.session.character;
      
      recentEntries.forEach(entry => {
        const text = (entry.text || '').toLowerCase();
        
        // Detect level up mentions
        if (text.includes('level up') || text.includes('gained a level')) {
          milestones.push(this.createMilestoneFallback({
            sessionId,
            characterName: character.name,
            type: 'level_up',
            title: 'Level Up Achievement',
            description: `${character.name} gained a level through their adventures.`,
            relatedStoryEntryId: entry.id,
          }));
        }
        
        // Detect skill gains
        if (text.includes('learned') || text.includes('skill') || text.includes('ability')) {
          milestones.push(this.createMilestoneFallback({
            sessionId,
            characterName: character.name,
            type: 'skill_gain',
            title: 'New Skill Acquired',
            description: `${character.name} developed new abilities or skills.`,
            relatedStoryEntryId: entry.id,
          }));
        }
        
        // Detect story achievements
        if (text.includes('achievement') || text.includes('accomplished') || text.includes('victory')) {
          milestones.push(this.createMilestoneFallback({
            sessionId,
            characterName: character.name,
            type: 'story_achievement',
            title: 'Story Achievement',
            description: `${character.name} accomplished something significant in their journey.`,
            relatedStoryEntryId: entry.id,
          }));
        }
      });
      
      return milestones;
    } catch (error) {
      console.error('Milestone detection fallback failed:', error);
      return [];
    }
  }

  private analyzeDominantTraits(character: Character): string[] {
    const stats = character.stats;
    const traits: string[] = [];
    
    // Find highest stats
    const statEntries = Object.entries(stats);
    const maxStat = Math.max(...statEntries.map(([_, value]) => value));
    
    statEntries.forEach(([stat, value]) => {
      if (value === maxStat) {
        traits.push(stat);
      }
    });

    // Add class-based traits
    traits.push(character.class_name.toLowerCase());
    
    return traits;
  }

  private identifyGrowthAreas(character: Character): string[] {
    const stats = character.stats;
    const areas: string[] = [];
    
    // Find lowest stats as growth areas
    const statEntries = Object.entries(stats);
    const minStat = Math.min(...statEntries.map(([_, value]) => value));
    
    statEntries.forEach(([stat, value]) => {
      if (value === minStat) {
        areas.push(stat);
      }
    });

    return areas;
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }
}

export const characterProgressionService = new CharacterProgressionService();
