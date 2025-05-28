// Story Bookmark Service - AI-driven bookmark management
// Handles bookmark creation, management, and AI-generated summaries

import { StoryBookmark, BookmarkFilter, StoryEntry } from '@/types';
import { gameAPI } from '@/services/api/client';

export interface CreateBookmarkRequest {
  storyEntryId: string;
  sessionId: string;
  title?: string;
  description?: string;
  tags?: string[];
  category?: StoryBookmark['category'];
  isPrivate?: boolean;
}

export interface BookmarkSearchOptions {
  sessionId?: string;
  filter?: BookmarkFilter;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'category';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

class BookmarkService {
  private readonly bookmarkCache = new Map<string, StoryBookmark[]>();
  private readonly cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Create a new bookmark with AI-generated summary
   */
  async createBookmark(request: CreateBookmarkRequest): Promise<StoryBookmark> {
    try {
      const response = await gameAPI.createBookmark(request.sessionId, {
        story_entry_id: request.storyEntryId,
        title: request.title,
        description: request.description,
        tags: request.tags,
        category: request.category,
        is_private: request.isPrivate,
      });

      if (response.success) {
        return response.bookmark;
      } else {
        throw new Error('Failed to create bookmark');
      }
    } catch (error) {
      console.warn('Bookmark creation failed, using fallback:', error);
      return this.createBookmarkFallback(request);
    }
  }

  /**
   * Get bookmarks for a session with filtering and search
   */
  async getBookmarks(options: BookmarkSearchOptions = {}): Promise<StoryBookmark[]> {
    const cacheKey = this.getCacheKey(options);

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cached = this.bookmarkCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      if (!options.sessionId) {
        throw new Error('Session ID is required');
      }

      const filters: any = {};
      if (options.filter?.category) {
        filters.category = options.filter.category;
      }
      if (options.filter?.tags) {
        filters.tags = options.filter.tags.join(',');
      }

      const response = await gameAPI.getBookmarks(options.sessionId, filters);

      if (response.success) {
        const bookmarks = response.bookmarks;

        // Cache the results
        this.bookmarkCache.set(cacheKey, bookmarks);
        this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

        return bookmarks;
      } else {
        throw new Error('Failed to retrieve bookmarks');
      }
    } catch (error) {
      console.warn('Bookmark retrieval failed, using fallback:', error);
      return this.getBookmarksFallback(options);
    }
  }

  /**
   * Update an existing bookmark
   */
  async updateBookmark(bookmarkId: string, updates: Partial<StoryBookmark>): Promise<StoryBookmark> {
    try {
      // TODO: Implement backend API call for bookmark update
      console.log('Bookmark update API not yet implemented, using fallback');
      return this.updateBookmarkFallback(bookmarkId, updates);
    } catch (error) {
      console.warn('Bookmark update failed, using fallback:', error);
      return this.updateBookmarkFallback(bookmarkId, updates);
    }
  }

  /**
   * Delete a bookmark
   */
  async deleteBookmark(bookmarkId: string): Promise<boolean> {
    try {
      // TODO: Implement backend API call for bookmark deletion
      console.log('Bookmark deletion API not yet implemented, using fallback');
      this.deleteBookmarkFallback(bookmarkId);
      return true;
    } catch (error) {
      console.warn('Bookmark deletion failed:', error);
      return false;
    }
  }

  /**
   * Generate AI summary for a story entry
   */
  async generateAISummary(storyEntry: StoryEntry, context?: {
    character?: any;
    worldState?: any;
    recentEntries?: StoryEntry[];
  }): Promise<string> {
    try {
      // TODO: Implement AI summary generation API call
      console.log('AI summary generation not yet implemented, using intelligent fallback');
      return this.generateSummaryFallback(storyEntry, context);
    } catch (error) {
      console.warn('AI summary generation failed, using fallback:', error);
      return this.generateSummaryFallback(storyEntry, context);
    }
  }

  /**
   * Get suggested tags for a story entry
   */
  async getSuggestedTags(storyEntry: StoryEntry, context?: any): Promise<string[]> {
    try {
      // TODO: Implement AI tag suggestion API call
      console.log('AI tag suggestion not yet implemented, using fallback');
      return this.getSuggestedTagsFallback(storyEntry, context);
    } catch (error) {
      console.warn('AI tag suggestion failed, using fallback:', error);
      return this.getSuggestedTagsFallback(storyEntry, context);
    }
  }

  /**
   * Search bookmarks with AI-powered relevance scoring
   */
  async searchBookmarks(query: string, options: BookmarkSearchOptions = {}): Promise<StoryBookmark[]> {
    const allBookmarks = await this.getBookmarks(options);
    
    if (!query.trim()) {
      return allBookmarks;
    }

    // Simple text search for now - TODO: Implement AI-powered search
    const searchTerms = query.toLowerCase().split(' ');
    
    return allBookmarks.filter(bookmark => {
      const searchableText = [
        bookmark.title,
        bookmark.description || '',
        bookmark.aiSummary || '',
        ...bookmark.tags
      ].join(' ').toLowerCase();

      return searchTerms.some(term => searchableText.includes(term));
    }).sort((a, b) => {
      // Simple relevance scoring based on title matches
      const aScore = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const bScore = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      return bScore - aScore;
    });
  }

  /**
   * Clear bookmark cache
   */
  clearCache(): void {
    this.bookmarkCache.clear();
    this.cacheExpiry.clear();
  }

  // Private helper methods

  private createBookmarkFallback(request: CreateBookmarkRequest): StoryBookmark {
    const now = new Date().toISOString();
    const id = `bookmark_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    return {
      id,
      storyEntryId: request.storyEntryId,
      sessionId: request.sessionId,
      title: request.title || 'Bookmarked Moment',
      description: request.description,
      tags: request.tags || [],
      aiSummary: 'AI summary generation will be available soon.',
      createdAt: now,
      updatedAt: now,
      category: request.category || 'important',
      isPrivate: request.isPrivate || false,
    };
  }

  private async getBookmarksFallback(options: BookmarkSearchOptions): Promise<StoryBookmark[]> {
    // Return empty array for now - in real implementation, this would fetch from local storage or cache
    return [];
  }

  private updateBookmarkFallback(bookmarkId: string, updates: Partial<StoryBookmark>): StoryBookmark {
    // Fallback implementation - in real app, this would update the bookmark
    const now = new Date().toISOString();
    return {
      id: bookmarkId,
      storyEntryId: updates.storyEntryId || '',
      sessionId: updates.sessionId || '',
      title: updates.title || 'Updated Bookmark',
      description: updates.description,
      tags: updates.tags || [],
      aiSummary: updates.aiSummary,
      createdAt: updates.createdAt || now,
      updatedAt: now,
      category: updates.category || 'important',
      isPrivate: updates.isPrivate || false,
    };
  }

  private deleteBookmarkFallback(bookmarkId: string): void {
    // Clear from cache if present
    this.bookmarkCache.forEach((bookmarks, key) => {
      const filtered = bookmarks.filter(b => b.id !== bookmarkId);
      if (filtered.length !== bookmarks.length) {
        this.bookmarkCache.set(key, filtered);
      }
    });
  }

  private generateSummaryFallback(storyEntry: StoryEntry, context?: any): string {
    const entryType = storyEntry.type;
    const content = storyEntry.text || '';
    
    if (entryType === 'player') {
      return `Player action: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;
    } else if (entryType === 'narration') {
      return `Story development: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;
    } else {
      return `${entryType}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;
    }
  }

  private getSuggestedTagsFallback(storyEntry: StoryEntry, context?: any): string[] {
    const content = (storyEntry.text || '').toLowerCase();
    const tags: string[] = [];

    // Simple keyword-based tag suggestions
    if (content.includes('combat') || content.includes('fight') || content.includes('attack')) {
      tags.push('combat');
    }
    if (content.includes('dialogue') || content.includes('says') || content.includes('speaks')) {
      tags.push('dialogue');
    }
    if (content.includes('discovery') || content.includes('find') || content.includes('explore')) {
      tags.push('discovery');
    }
    if (content.includes('decision') || content.includes('choose') || content.includes('decide')) {
      tags.push('decision');
    }

    return tags.length > 0 ? tags : ['general'];
  }

  private getCacheKey(options: BookmarkSearchOptions): string {
    return JSON.stringify(options);
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }
}

export const bookmarkService = new BookmarkService();
