// Story Search Service - AI-powered story search and navigation
// Handles full-text search, categorization, and intelligent content discovery

import { StorySearchResult, StorySearchOptions, StoryEntry } from '@/types';
import { gameAPI } from '@/services/api/client';

export interface SearchFilters {
  categories?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  includeBookmarked?: boolean;
  entryTypes?: string[];
}

export interface SearchSuggestion {
  query: string;
  description: string;
  category: string;
  confidence: number;
}

class StorySearchService {
  private readonly searchCache = new Map<string, StorySearchResult[]>();
  private readonly cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Search story entries with AI-powered relevance scoring
   */
  async searchStory(sessionId: string, options: StorySearchOptions): Promise<StorySearchResult[]> {
    const cacheKey = this.getCacheKey(sessionId, options);

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await gameAPI.searchStory(sessionId, options);

      if (response.success) {
        const results = response.results;

        // Cache the results
        this.searchCache.set(cacheKey, results);
        this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

        return results;
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.warn('Story search failed, using fallback:', error);
      return this.searchStoryFallback(sessionId, options);
    }
  }

  /**
   * Get search suggestions based on story content
   */
  async getSearchSuggestions(sessionId: string, partialQuery?: string): Promise<SearchSuggestion[]> {
    try {
      // TODO: Implement AI-powered search suggestions API
      console.log('AI search suggestions not yet implemented, using fallback');
      return this.getSearchSuggestionsFallback(sessionId, partialQuery);
    } catch (error) {
      console.warn('Search suggestions failed, using fallback:', error);
      return this.getSearchSuggestionsFallback(sessionId, partialQuery);
    }
  }

  /**
   * Categorize story entries using AI
   */
  async categorizeStoryEntries(entries: StoryEntry[]): Promise<Map<string, string[]>> {
    try {
      // TODO: Implement AI categorization API
      console.log('AI categorization not yet implemented, using fallback');
      return this.categorizeEntriesFallback(entries);
    } catch (error) {
      console.warn('Story categorization failed, using fallback:', error);
      return this.categorizeEntriesFallback(entries);
    }
  }

  /**
   * Find similar story moments
   */
  async findSimilarMoments(entryId: string, sessionId: string, limit: number = 5): Promise<StorySearchResult[]> {
    try {
      // TODO: Implement AI similarity search API
      console.log('AI similarity search not yet implemented, using fallback');
      return this.findSimilarMomentsFallback(entryId, sessionId, limit);
    } catch (error) {
      console.warn('Similar moments search failed, using fallback:', error);
      return this.findSimilarMomentsFallback(entryId, sessionId, limit);
    }
  }

  /**
   * Get story navigation suggestions
   */
  async getNavigationSuggestions(sessionId: string, currentEntryId?: string): Promise<{
    previousImportant: StorySearchResult[];
    nextMilestones: StorySearchResult[];
    relatedMoments: StorySearchResult[];
  }> {
    try {
      const session = await gameAPI.getSession(sessionId);
      const story = session.session.story;
      
      // Find current entry index
      const currentIndex = currentEntryId ? 
        story.findIndex(entry => entry.id === currentEntryId) : 
        story.length - 1;

      return {
        previousImportant: await this.findPreviousImportantMoments(story, currentIndex),
        nextMilestones: await this.findUpcomingMilestones(story, currentIndex),
        relatedMoments: await this.findRelatedMoments(story, currentIndex),
      };
    } catch (error) {
      console.warn('Navigation suggestions failed:', error);
      return {
        previousImportant: [],
        nextMilestones: [],
        relatedMoments: [],
      };
    }
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
    this.cacheExpiry.clear();
  }

  // Private helper methods

  private async searchStoryFallback(sessionId: string, options: StorySearchOptions): Promise<StorySearchResult[]> {
    try {
      const session = await gameAPI.getSession(sessionId);
      const story = session.session.story;
      
      if (!options.query.trim()) {
        return [];
      }

      const searchTerms = options.query.toLowerCase().split(' ').filter(term => term.length > 0);
      const results: StorySearchResult[] = [];

      story.forEach((entry, index) => {
        const entryText = (entry.text || '').toLowerCase();
        const matchedTerms = searchTerms.filter(term => entryText.includes(term));
        
        if (matchedTerms.length > 0) {
          const relevanceScore = matchedTerms.length / searchTerms.length;
          const matchedText = this.extractMatchedText(entry.text || '', searchTerms);
          const context = this.getEntryContext(story, index);
          
          results.push({
            entryId: entry.id,
            entry,
            relevanceScore,
            matchedText,
            context,
            category: this.categorizeEntry(entry),
          });
        }
      });

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Apply limit
      return results.slice(0, options.maxResults ?? 20);
    } catch (error) {
      console.error('Search fallback failed:', error);
      return [];
    }
  }

  private getSearchSuggestionsFallback(sessionId: string, partialQuery?: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [
      {
        query: 'combat',
        description: 'Find all combat encounters and battles',
        category: 'action',
        confidence: 0.9,
      },
      {
        query: 'dialogue',
        description: 'Search for conversations and character interactions',
        category: 'social',
        confidence: 0.9,
      },
      {
        query: 'discovery',
        description: 'Find moments of exploration and discovery',
        category: 'exploration',
        confidence: 0.8,
      },
      {
        query: 'decision',
        description: 'Locate important choices and their consequences',
        category: 'story',
        confidence: 0.8,
      },
      {
        query: 'character development',
        description: 'Find character growth and progression moments',
        category: 'character',
        confidence: 0.7,
      },
    ];

    if (partialQuery) {
      return suggestions.filter(s => 
        s.query.toLowerCase().includes(partialQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(partialQuery.toLowerCase())
      );
    }

    return suggestions;
  }

  private categorizeEntriesFallback(entries: StoryEntry[]): Map<string, string[]> {
    const categories = new Map<string, string[]>();
    
    entries.forEach(entry => {
      const category = this.categorizeEntry(entry);
      const existing = categories.get(category) || [];
      existing.push(entry.id);
      categories.set(category, existing);
    });

    return categories;
  }

  private categorizeEntry(entry: StoryEntry): 'dialogue' | 'action' | 'description' | 'system' {
    const text = (entry.text || '').toLowerCase();
    
    if (entry.type === 'system') {
      return 'system';
    }
    
    // Simple keyword-based categorization
    if (text.includes('"') || text.includes('says') || text.includes('speaks') || text.includes('tells')) {
      return 'dialogue';
    }
    
    if (text.includes('attack') || text.includes('fight') || text.includes('combat') || 
        text.includes('run') || text.includes('jump') || text.includes('climb')) {
      return 'action';
    }
    
    return 'description';
  }

  private async findSimilarMomentsFallback(entryId: string, sessionId: string, limit: number): Promise<StorySearchResult[]> {
    try {
      const session = await gameAPI.getSession(sessionId);
      const story = session.session.story;
      
      const targetEntry = story.find(entry => entry.id === entryId);
      if (!targetEntry) {
        return [];
      }

      const targetWords = (targetEntry.text || '').toLowerCase().split(' ');
      const results: StorySearchResult[] = [];

      story.forEach((entry, index) => {
        if (entry.id === entryId) return; // Skip the target entry
        
        const entryWords = (entry.text || '').toLowerCase().split(' ');
        const commonWords = targetWords.filter(word => 
          word.length > 3 && entryWords.includes(word)
        );
        
        if (commonWords.length > 0) {
          const similarity = commonWords.length / Math.max(targetWords.length, entryWords.length);
          
          if (similarity > 0.1) { // Minimum similarity threshold
            results.push({
              entryId: entry.id,
              entry,
              relevanceScore: similarity,
              matchedText: commonWords.join(', '),
              context: this.getEntryContext(story, index),
              category: this.categorizeEntry(entry),
            });
          }
        }
      });

      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return results.slice(0, limit);
    } catch (error) {
      console.error('Similar moments search failed:', error);
      return [];
    }
  }

  private async findPreviousImportantMoments(story: StoryEntry[], currentIndex: number): Promise<StorySearchResult[]> {
    const results: StorySearchResult[] = [];
    
    // Look for important moments before current index
    for (let i = Math.max(0, currentIndex - 10); i < currentIndex; i++) {
      const entry = story[i];
      if (this.isImportantMoment(entry)) {
        results.push({
          entryId: entry.id,
          entry,
          relevanceScore: 1.0,
          matchedText: 'Important moment',
          context: this.getEntryContext(story, i),
          category: this.categorizeEntry(entry),
        });
      }
    }

    return results.slice(-3); // Return last 3 important moments
  }

  private async findUpcomingMilestones(story: StoryEntry[], currentIndex: number): Promise<StorySearchResult[]> {
    // For now, return empty array since we can't predict future story
    return [];
  }

  private async findRelatedMoments(story: StoryEntry[], currentIndex: number): Promise<StorySearchResult[]> {
    if (currentIndex < 0 || currentIndex >= story.length) {
      return [];
    }

    const currentEntry = story[currentIndex];
    return this.findSimilarMomentsFallback(currentEntry.id, '', 3);
  }

  private isImportantMoment(entry: StoryEntry): boolean {
    const text = (entry.text || '').toLowerCase();
    const importantKeywords = [
      'level up', 'achievement', 'discovery', 'important', 'critical',
      'decision', 'choice', 'consequence', 'victory', 'defeat'
    ];
    
    return importantKeywords.some(keyword => text.includes(keyword));
  }

  private extractMatchedText(text: string, searchTerms: string[]): string {
    const words = text.split(' ');
    const matchedIndices: number[] = [];
    
    words.forEach((word, index) => {
      if (searchTerms.some(term => word.toLowerCase().includes(term))) {
        matchedIndices.push(index);
      }
    });

    if (matchedIndices.length === 0) {
      return text.substring(0, 100);
    }

    // Get context around matched words
    const start = Math.max(0, Math.min(...matchedIndices) - 5);
    const end = Math.min(words.length, Math.max(...matchedIndices) + 5);
    
    return words.slice(start, end).join(' ');
  }

  private getEntryContext(story: StoryEntry[], index: number): { before: string; after: string } {
    const before = index > 0 ? 
      (story[index - 1].text || '').substring(0, 50) + '...' : '';
    const after = index < story.length - 1 ? 
      (story[index + 1].text || '').substring(0, 50) + '...' : '';
    
    return { before, after };
  }

  private getCacheKey(sessionId: string, options: StorySearchOptions): string {
    return `${sessionId}_${JSON.stringify(options)}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }
}

export const storySearchService = new StorySearchService();
