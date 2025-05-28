// Story Export Service - AI-driven story export functionality
// Handles PDF, Markdown, and text export with AI-enhanced formatting

import { StoryExportOptions, ExportProgress, StoryBookmark } from '@/types';
import { gameAPI } from '@/services/api/client';
import { bookmarkService } from './bookmarkService';

export interface ExportRequest {
  sessionId: string;
  options: StoryExportOptions;
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  filename: string;
  fileSize?: number;
  error?: string;
}

class StoryExportService {
  private readonly exportProgress = new Map<string, ExportProgress>();
  private readonly exportCallbacks = new Map<string, (progress: ExportProgress) => void>();

  /**
   * Start story export process
   */
  async startExport(request: ExportRequest): Promise<string> {
    try {
      const response = await gameAPI.startStoryExport(request.sessionId, request.options);

      if (response.success) {
        const exportId = response.export_id;

        // Initialize progress tracking
        const initialProgress: ExportProgress = {
          id: exportId,
          status: 'preparing',
          progress: 0,
          message: 'Export started...',
        };

        this.exportProgress.set(exportId, initialProgress);

        // Start polling for progress updates
        this.pollExportProgress(exportId, request.sessionId);

        return exportId;
      } else {
        throw new Error('Failed to start export');
      }
    } catch (error) {
      console.warn('Export failed, using fallback:', error);
      const exportId = `export_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      this.processExportFallback(exportId, request);
      return exportId;
    }
  }

  /**
   * Get export progress
   */
  getExportProgress(exportId: string): ExportProgress | null {
    return this.exportProgress.get(exportId) || null;
  }

  /**
   * Subscribe to export progress updates
   */
  subscribeToProgress(exportId: string, callback: (progress: ExportProgress) => void): () => void {
    this.exportCallbacks.set(exportId, callback);
    
    // Return unsubscribe function
    return () => {
      this.exportCallbacks.delete(exportId);
    };
  }

  /**
   * Cancel an ongoing export
   */
  async cancelExport(exportId: string): Promise<boolean> {
    const progress = this.exportProgress.get(exportId);
    if (!progress || progress.status === 'complete' || progress.status === 'error') {
      return false;
    }

    try {
      // TODO: Implement backend API call for export cancellation
      console.log('Export cancellation API not yet implemented');
      
      // Update progress to cancelled
      this.updateProgress(exportId, {
        status: 'error',
        progress: 0,
        message: 'Export cancelled by user',
        error: 'Cancelled',
      });
      
      return true;
    } catch (error) {
      console.warn('Export cancellation failed:', error);
      return false;
    }
  }

  /**
   * Get available export formats based on story content
   */
  async getAvailableFormats(sessionId: string): Promise<Array<{
    format: StoryExportOptions['format'];
    name: string;
    description: string;
    recommended: boolean;
  }>> {
    try {
      // Get session data to determine best formats
      const session = await gameAPI.getSession(sessionId);
      const storyLength = session.session.story.length;
      
      const formats = [
        {
          format: 'markdown' as const,
          name: 'Markdown',
          description: 'Formatted text with styling, perfect for sharing and editing',
          recommended: true,
        },
        {
          format: 'text' as const,
          name: 'Plain Text',
          description: 'Simple text format, compatible with any text editor',
          recommended: false,
        },
        {
          format: 'json' as const,
          name: 'JSON Data',
          description: 'Raw data format for developers and advanced users',
          recommended: false,
        },
      ];

      // Add PDF option for longer stories
      if (storyLength > 20) {
        formats.unshift({
          format: 'pdf' as const,
          name: 'PDF Document',
          description: 'Professional document format with rich formatting',
          recommended: storyLength > 50,
        });
      }

      return formats;
    } catch (error) {
      console.warn('Failed to get session data for format recommendations:', error);
      
      // Return default formats
      return [
        {
          format: 'markdown' as const,
          name: 'Markdown',
          description: 'Formatted text with styling',
          recommended: true,
        },
        {
          format: 'text' as const,
          name: 'Plain Text',
          description: 'Simple text format',
          recommended: false,
        },
      ];
    }
  }

  /**
   * Generate export preview
   */
  async generatePreview(sessionId: string, options: StoryExportOptions): Promise<string> {
    try {
      const session = await gameAPI.getSession(sessionId);

      if (options.format === 'markdown') {
        return this.generateMarkdownPreview(session.session, options);
      } else if (options.format === 'text') {
        return this.generateTextPreview(session.session, options);
      } else {
        return 'Preview not available for this format';
      }
    } catch (error) {
      console.warn('Failed to generate preview:', error);
      return 'Preview generation failed';
    }
  }

  /**
   * Clean up completed exports
   */
  cleanupExport(exportId: string): void {
    this.exportProgress.delete(exportId);
    this.exportCallbacks.delete(exportId);
  }

  // Private helper methods

  /**
   * Poll export progress from backend
   */
  private async pollExportProgress(exportId: string, sessionId: string): Promise<void> {
    const pollInterval = 2000; // 2 seconds
    const maxPolls = 150; // 5 minutes max
    let pollCount = 0;

    const poll = async () => {
      try {
        const response = await gameAPI.getExportStatus(sessionId, exportId);

        const progress: ExportProgress = {
          id: exportId,
          status: response.status as ExportProgress['status'],
          progress: response.progress,
          message: response.message,
          downloadUrl: response.download_url,
        };

        this.updateProgress(exportId, progress);

        // Continue polling if not complete and under max polls
        if (response.status !== 'complete' && response.status !== 'error' && pollCount < maxPolls) {
          pollCount++;
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        console.error('Error polling export progress:', error);
        this.updateProgress(exportId, {
          status: 'error',
          progress: 0,
          message: 'Failed to get export status',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    // Start polling
    setTimeout(poll, pollInterval);
  }

  private async processExportFallback(exportId: string, request: ExportRequest): Promise<void> {
    try {
      // Simulate export process with progress updates
      this.updateProgress(exportId, {
        status: 'generating',
        progress: 10,
        message: 'Fetching story data...',
      });

      // Get session data
      const session = await gameAPI.getSession(request.sessionId);
      
      this.updateProgress(exportId, {
        status: 'generating',
        progress: 30,
        message: 'Processing story entries...',
      });

      // Get bookmarks if requested
      let bookmarks: StoryBookmark[] = [];
      if (request.options.includeBookmarks) {
        bookmarks = await bookmarkService.getBookmarks({ sessionId: request.sessionId });
      }

      this.updateProgress(exportId, {
        status: 'formatting',
        progress: 60,
        message: 'Formatting content...',
      });

      // Generate content based on format
      let content: string;

      switch (request.options.format) {
        case 'markdown':
          content = this.generateMarkdownContent(session.session, request.options, bookmarks);
          break;
        case 'text':
          content = this.generateTextContent(session.session, request.options, bookmarks);
          break;
        case 'json':
          content = this.generateJsonContent(session.session, request.options, bookmarks);
          break;
        default:
          throw new Error(`Unsupported format: ${request.options.format}`);
      }

      this.updateProgress(exportId, {
        status: 'formatting',
        progress: 90,
        message: 'Finalizing export...',
      });

      // Create download URL (in real implementation, this would be a backend-generated URL)
      const blob = new Blob([content], { 
        type: this.getMimeType(request.options.format) 
      });
      const downloadUrl = URL.createObjectURL(blob);

      this.updateProgress(exportId, {
        status: 'complete',
        progress: 100,
        message: 'Export complete!',
        downloadUrl,
      });

    } catch (error) {
      console.error('Export processing failed:', error);
      this.updateProgress(exportId, {
        status: 'error',
        progress: 0,
        message: 'Export failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private updateProgress(exportId: string, updates: Partial<ExportProgress>): void {
    const current = this.exportProgress.get(exportId);
    if (!current) return;

    const updated = { ...current, ...updates };
    this.exportProgress.set(exportId, updated);

    // Notify subscribers
    const callback = this.exportCallbacks.get(exportId);
    if (callback) {
      callback(updated);
    }
  }

  private generateMarkdownContent(session: any, options: StoryExportOptions, bookmarks: StoryBookmark[]): string {
    const title = options.customTitle ?? `${session.character.name}'s Adventure`;
    let content = `# ${title}\n\n`;

    if (options.includeCharacterInfo) {
      content += `## Character Information\n\n`;
      content += `**Name:** ${session.character.name}\n`;
      content += `**Level:** ${session.character.level}\n`;
      content += `**Class:** ${session.character.class_name}\n`;
      if (session.character.background) {
        content += `**Background:** ${session.character.background}\n`;
      }
      content += `\n`;
    }

    if (options.includeWorldState) {
      content += `## World State\n\n`;
      content += `**Location:** ${session.world_state.current_location}\n`;
      content += `**Time:** ${session.world_state.time_of_day}\n`;
      content += `**Weather:** ${session.world_state.weather}\n\n`;
    }

    content += `## Story\n\n`;
    
    session.story.forEach((entry: any, index: number) => {
      const timestamp = options.includeTimestamps ? 
        ` *(${new Date(entry.timestamp).toLocaleString()})*` : '';
      
      content += `### Entry ${index + 1}${timestamp}\n\n`;
      content += `**${entry.type.replace('_', ' ').toUpperCase()}:** ${entry.text}\n\n`;
    });

    if (options.includeBookmarks && bookmarks.length > 0) {
      content += `## Bookmarks\n\n`;
      bookmarks.forEach(bookmark => {
        content += `### ${bookmark.title}\n\n`;
        if (bookmark.description) {
          content += `${bookmark.description}\n\n`;
        }
        if (bookmark.tags.length > 0) {
          content += `**Tags:** ${bookmark.tags.join(', ')}\n\n`;
        }
      });
    }

    return content;
  }

  private generateTextContent(session: any, options: StoryExportOptions, bookmarks: StoryBookmark[]): string {
    const title = options.customTitle ?? `${session.character.name}'s Adventure`;
    let content = `${title}\n${'='.repeat(title.length)}\n\n`;

    if (options.includeCharacterInfo) {
      content += `CHARACTER INFORMATION\n`;
      content += `Name: ${session.character.name}\n`;
      content += `Level: ${session.character.level}\n`;
      content += `Class: ${session.character.class_name}\n`;
      if (session.character.background) {
        content += `Background: ${session.character.background}\n`;
      }
      content += `\n`;
    }

    content += `STORY\n${'='.repeat(5)}\n\n`;
    
    session.story.forEach((entry: any, index: number) => {
      const timestamp = options.includeTimestamps ? 
        ` (${new Date(entry.timestamp).toLocaleString()})` : '';
      
      content += `Entry ${index + 1}${timestamp}\n`;
      content += `${entry.type.replace('_', ' ').toUpperCase()}: ${entry.text}\n\n`;
    });

    return content;
  }

  private generateJsonContent(session: any, options: StoryExportOptions, bookmarks: StoryBookmark[]): string {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        format: 'json',
        options,
      },
      session: {
        id: session.session_id,
        character: options.includeCharacterInfo ? session.character : undefined,
        worldState: options.includeWorldState ? session.world_state : undefined,
        story: session.story,
      },
      bookmarks: options.includeBookmarks ? bookmarks : undefined,
    };

    return JSON.stringify(exportData, null, 2);
  }

  private generateMarkdownPreview(session: any, options: StoryExportOptions): string {
    const preview = this.generateMarkdownContent(session, options, []);
    return preview.substring(0, 1000) + (preview.length > 1000 ? '\n\n... (preview truncated)' : '');
  }

  private generateTextPreview(session: any, options: StoryExportOptions): string {
    const preview = this.generateTextContent(session, options, []);
    return preview.substring(0, 1000) + (preview.length > 1000 ? '\n\n... (preview truncated)' : '');
  }

  private getMimeType(format: StoryExportOptions['format']): string {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'markdown':
        return 'text/markdown';
      case 'text':
        return 'text/plain';
      case 'json':
        return 'application/json';
      default:
        return 'text/plain';
    }
  }
}

export const storyExportService = new StoryExportService();
