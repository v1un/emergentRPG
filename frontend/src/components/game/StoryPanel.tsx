// Story Panel Component - Main storytelling interface

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCurrentSession, useCurrentStory, useIsAIGenerating, useGameStore, useConnectionStatus } from '@/stores/gameStore';
import { useGameAction } from '@/hooks/useGameAction';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { TypingIndicator } from '@/components/ui/Loading';
import { AIGeneratedContent, AIProcessStatus } from '@/components/ui/AIGeneratedContent';
import { AIConfidenceIndicator } from '@/components/ui/AIConfidenceIndicator';
import { AIInsightsWidget, AIInsightTooltip } from '@/components/ui/AIInsightsWidget';
import { useAIInsights } from '@/services/aiInsightsService';
import { cn, truncateText } from '@/utils/helpers';
import { gameFormatters } from '@/utils/formatting';
import { actionSchema } from '@/utils/validation';
import { StoryEntry, ActionType } from '@/types';
import { ACTION_TYPES } from '@/utils/constants';
import { dynamicUIService, DynamicUIContent } from '@/services/dynamicUIService';
import {
  PaperAirplaneIcon,
  BookmarkIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  XMarkIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkSolidIcon,
} from '@heroicons/react/24/solid';

export function StoryPanel() {
  const currentSession = useCurrentSession();
  const story = useCurrentStory();
  const isAIGenerating = useIsAIGenerating();
  const connectionStatus = useConnectionStatus();

  const [actionInput, setActionInput] = useState('');
  const [actionError, setActionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [bookmarkedEntries, setBookmarkedEntries] = useState<Set<string>>(new Set());
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [dynamicContent, setDynamicContent] = useState<DynamicUIContent | null>(null);

  // Enhanced modal states
  const [showBookmarkManager, setShowBookmarkManager] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showStoryExporter, setShowStoryExporter] = useState(false);

  const storyEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // AI Insights integration
  const { insights, generateMockInsight } = useAIInsights();

  const { performAction, isLoading, error } = useGameAction(
    currentSession?.session_id || '',
    {
      enableOptimisticUpdates: true,
      enableWebSocket: true,
      onSuccess: () => {
        setActionInput('');
        setActionError('');
      },
      onError: (err) => {
        setActionError(err.message);
      },
    }
  );

  // Auto-scroll to bottom when new story entries are added
  useEffect(() => {
    if (storyEndRef.current) {
      storyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [story]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Load dynamic UI content based on context
  useEffect(() => {
    const loadDynamicContent = async () => {
      try {
        const content = await dynamicUIService.getDynamicUIContent({
          character: currentSession?.character,
          session: currentSession || undefined,
          currentLocation: currentSession?.world_state?.current_location,
          recentStory: story.slice(-3), // Last 3 entries for context
          gameState: story.length === 0 ? 'starting' : 'playing',
          panelType: 'story',
        });
        setDynamicContent(content);
      } catch (error) {
        console.warn('Failed to load dynamic UI content:', error);
        // Keep existing content or use fallback
      }
    };

    if (currentSession) {
      loadDynamicContent();
    }
  }, [currentSession, story.length, currentSession?.world_state?.current_location]);

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!actionInput.trim()) {
      setActionError('Please enter an action');
      return;
    }

    // Validate action
    const validation = actionSchema.safeParse(actionInput.trim());
    if (!validation.success) {
      setActionError(validation.error.errors[0].message);
      return;
    }

    try {
      await performAction(actionInput.trim());
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAction(e);
    }
  };

  const getEntryIcon = (type: ActionType) => {
    switch (type) {
      case ACTION_TYPES.PLAYER:
        return '👤';
      case ACTION_TYPES.NARRATION:
        return '📖';
      case ACTION_TYPES.ACTION:
        return '⚡';
      case ACTION_TYPES.SYSTEM:
        return '🔧';
      default:
        return '💬';
    }
  };

  const getEntryStyle = (type: ActionType) => {
    switch (type) {
      case ACTION_TYPES.PLAYER:
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
      case ACTION_TYPES.NARRATION:
        return 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700';
      case ACTION_TYPES.ACTION:
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      case ACTION_TYPES.SYSTEM:
        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700';
    }
  };

  // Enhanced story management functions
  const handleBookmarkEntry = async (entryId: string) => {
    const entry = story.find(e => e.id === entryId);
    if (!entry || !currentSession) return;

    try {
      if (bookmarkedEntries.has(entryId)) {
        // Remove bookmark
        setBookmarkedEntries(prev => {
          const newSet = new Set(prev);
          newSet.delete(entryId);
          return newSet;
        });
        // TODO: Call bookmarkService.deleteBookmark when backend is ready
      } else {
        // Add bookmark
        setBookmarkedEntries(prev => {
          const newSet = new Set(prev);
          newSet.add(entryId);
          return newSet;
        });
        // TODO: Call bookmarkService.createBookmark when backend is ready
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      // Revert optimistic update on error
      setBookmarkedEntries(prev => {
        const newSet = new Set(prev);
        if (newSet.has(entryId)) {
          newSet.delete(entryId);
        } else {
          newSet.add(entryId);
        }
        return newSet;
      });
    }
  };

  const handleBookmarkSelect = (bookmark: any) => {
    // Scroll to the bookmarked entry
    const entryElement = document.getElementById(`story-entry-${bookmark.storyEntryId}`);
    if (entryElement) {
      entryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the entry briefly
      entryElement.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-50');
      setTimeout(() => {
        entryElement.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-50');
      }, 2000);
    }
    setShowBookmarkManager(false);
  };

  const handleSearchResultSelect = (result: any) => {
    // Scroll to the search result entry
    const entryElement = document.getElementById(`story-entry-${result.entryId}`);
    if (entryElement) {
      entryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the entry briefly
      entryElement.classList.add('ring-4', 'ring-green-400', 'ring-opacity-50');
      setTimeout(() => {
        entryElement.classList.remove('ring-4', 'ring-green-400', 'ring-opacity-50');
      }, 2000);
    }
    setShowAdvancedSearch(false);
  };

  const handleExportStory = (format: 'markdown' | 'pdf' | 'txt') => {
    const storyText = story.map(entry => {
      const timestamp = new Date(entry.timestamp).toLocaleString();
      const type = gameFormatters.actionType(entry.type as ActionType);
      return `[${timestamp}] ${type}: ${entry.text}`;
    }).join('\n\n');

    const filename = `${currentSession?.session_id || 'story'}_${new Date().toISOString().split('T')[0]}`;

    if (format === 'markdown') {
      const markdownContent = story.map(entry => {
        const timestamp = new Date(entry.timestamp).toLocaleString();
        const type = gameFormatters.actionType(entry.type as ActionType);
        return `## ${type}\n*${timestamp}*\n\n${entry.text}\n`;
      }).join('\n---\n\n');

      downloadFile(markdownContent, `${filename}.md`, 'text/markdown');
    } else if (format === 'txt') {
      downloadFile(storyText, `${filename}.txt`, 'text/plain');
    } else if (format === 'pdf') {
      // TODO: Implement PDF export
      console.log('PDF export not yet implemented');
    }

    setShowExportMenu(false);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredStory = story.filter(entry => {
    if (!searchQuery) return true;
    return entry.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const displayedStory = showBookmarks
    ? filteredStory.filter(entry => bookmarkedEntries.has(entry.id))
    : filteredStory;

  if (!currentSession) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No active game session</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Story Header with Enhanced Controls */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Story
            </h2>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Live</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            {/* Quick Search Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className={cn(
                'transition-all duration-200',
                showSearch && 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700'
              )}
              aria-label="Toggle quick search"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Quick Search</span>
            </Button>

            {/* Advanced Search */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedSearch(true)}
              aria-label="Advanced search"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Advanced</span>
            </Button>

            {/* Bookmarks Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBookmarks(!showBookmarks)}
              className={cn(
                'transition-all duration-200',
                showBookmarks && 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700'
              )}
              aria-label={`Toggle bookmarks (${bookmarkedEntries.size} saved)`}
            >
              <BookmarkIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Bookmarks</span>
              {bookmarkedEntries.size > 0 && (
                <span className="ml-1 text-xs bg-yellow-500 text-white rounded-full px-1.5 py-0.5">
                  {bookmarkedEntries.size}
                </span>
              )}
            </Button>

            {/* Bookmark Manager */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBookmarkManager(true)}
              aria-label="Manage bookmarks"
            >
              <BookmarkIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Manage</span>
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStoryExporter(true)}
              aria-label="Export story"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Export</span>
            </Button>

            {/* AI Insights Demo (for testing) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateMockInsight('narrative')}
              aria-label="Generate AI insight demo"
              className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
            >
              <CpuChipIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">AI Demo</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mt-3">
            <Input
              placeholder="Search story entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
            />
          </div>
        )}

        {/* Filter Status */}
        {(showBookmarks || searchQuery) && (
          <div className="mt-2 text-sm text-muted-foreground">
            {showBookmarks && `Showing ${displayedStory.length} bookmarked entries`}
            {showBookmarks && searchQuery && ' • '}
            {searchQuery && `Filtered by "${searchQuery}"`}
            {displayedStory.length !== story.length && (
              <button
                onClick={() => {
                  setShowBookmarks(false);
                  setSearchQuery('');
                }}
                className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Story Display */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {displayedStory.length === 0 ? (
          <div className="text-center py-12">
            {story.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {dynamicContent?.emptyStateTitle || 'Your Adventure Begins'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {dynamicContent?.emptyStateMessage || 'Enter your first action to start your AI-driven story adventure.'}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Entries Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {showBookmarks
                    ? "No bookmarked entries found. Bookmark entries by clicking the star icon."
                    : "No entries match your search criteria."
                  }
                </p>
              </>
            )}
          </div>
        ) : (
          displayedStory.map((entry: StoryEntry, index: number) => (
            <Card
              key={entry.id}
              id={`story-entry-${entry.id}`}
              className={cn(
                'p-4 transition-all duration-300 group relative hover:shadow-lg hover:scale-[1.01] transform',
                'animate-in slide-in-from-bottom-2 fade-in duration-500',
                getEntryStyle(entry.type as ActionType),
                bookmarkedEntries.has(entry.id) && 'ring-2 ring-yellow-400 dark:ring-yellow-600 shadow-yellow-100 dark:shadow-yellow-900'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Enhanced Bookmark Button */}
              <button
                onClick={() => handleBookmarkEntry(entry.id)}
                className={cn(
                  'absolute top-3 right-3 p-1 rounded-full transition-all duration-200',
                  'opacity-0 group-hover:opacity-100 hover:bg-yellow-100 dark:hover:bg-yellow-900',
                  bookmarkedEntries.has(entry.id) && 'opacity-100 bg-yellow-50 dark:bg-yellow-950'
                )}
                aria-label={bookmarkedEntries.has(entry.id) ? 'Remove bookmark' : 'Add bookmark'}
              >
                {bookmarkedEntries.has(entry.id) ? (
                  <BookmarkSolidIcon className="h-4 w-4 text-yellow-500 animate-in zoom-in duration-200" />
                ) : (
                  <BookmarkIcon className="h-4 w-4 text-gray-400 hover:text-yellow-500 transition-colors duration-150" />
                )}
              </button>

              <div className="flex items-start space-x-4">
                {/* Enhanced Entry Icon */}
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm mt-1',
                  'bg-gradient-to-br shadow-sm',
                  entry.type === ACTION_TYPES.PLAYER && 'from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800',
                  entry.type === ACTION_TYPES.NARRATION && 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700',
                  entry.type === ACTION_TYPES.ACTION && 'from-green-100 to-green-200 dark:from-green-900 dark:to-green-800',
                  entry.type === ACTION_TYPES.SYSTEM && 'from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800'
                )}>
                  {getEntryIcon(entry.type as ActionType)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Enhanced Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        'text-sm font-semibold px-2 py-1 rounded-full',
                        entry.type === ACTION_TYPES.PLAYER && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                        entry.type === ACTION_TYPES.NARRATION && 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                        entry.type === ACTION_TYPES.ACTION && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                        entry.type === ACTION_TYPES.SYSTEM && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      )}>
                        {gameFormatters.actionType(entry.type as ActionType)}
                      </span>
                      {bookmarkedEntries.has(entry.id) && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded-full">
                          Bookmarked
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {gameFormatters.storyTimestamp(entry.timestamp)}
                    </span>
                  </div>

                  {/* Enhanced Content with AI styling */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {entry.type === ACTION_TYPES.NARRATION ? (
                      <AIGeneratedContent
                        confidence={entry.metadata?.ai_confidence}
                        type="narrative"
                        variant="subtle"
                        showBadge={false}
                        showConfidence={!!entry.metadata?.ai_confidence}
                      >
                        <p className="text-foreground whitespace-pre-wrap leading-relaxed italic">
                          {entry.text}
                        </p>
                      </AIGeneratedContent>
                    ) : (
                      <p className={cn(
                        'text-foreground whitespace-pre-wrap leading-relaxed',
                        entry.type === ACTION_TYPES.PLAYER && 'font-medium text-blue-900 dark:text-blue-100',
                        entry.type === ACTION_TYPES.ACTION && 'text-green-900 dark:text-green-100',
                        entry.type === ACTION_TYPES.SYSTEM && 'text-yellow-900 dark:text-yellow-100 font-mono text-sm'
                      )}>
                        {entry.text}
                      </p>
                    )}
                  </div>

                  {/* AI Insights for AI-generated content */}
                  {entry.type === ACTION_TYPES.NARRATION && entry.metadata?.ai_insight_id && (
                    <div className="mt-3">
                      {(() => {
                        const insight = insights.find(i => i.id === entry.metadata?.ai_insight_id);
                        return insight ? (
                          <AIInsightsWidget
                            insight={insight}
                            variant="compact"
                            showToggle={true}
                          />
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}

        {/* AI Generating Indicator */}
        {isAIGenerating && (
          <AIProcessStatus
            status="generating"
            message="AI is crafting your story..."
            className="mx-auto max-w-md"
          />
        )}

        <div ref={storyEndRef} />
      </div>

      {/* Enhanced Action Input */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 p-4 sm:p-6">
        <form onSubmit={handleSubmitAction} className="space-y-4">
          {/* Input Area */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={dynamicContent?.placeholderText || "What do you do? (Press Enter to submit)"}
                error={actionError || error?.message}
                className={cn(
                  'pr-16 transition-all duration-200',
                  'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  'placeholder:text-gray-400 dark:placeholder:text-gray-500'
                )}
                disabled={isLoading || isAIGenerating}
                maxLength={500}
                aria-label="Enter your action"
                aria-describedby="action-help character-count"
              />

              {/* Character Count Indicator */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className={cn(
                  'text-xs font-mono',
                  actionInput.length > 450 ? 'text-red-500' : 'text-gray-400'
                )}>
                  {actionInput.length}/500
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || isAIGenerating || !actionInput.trim()}
              loading={isLoading}
              className={cn(
                'px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
                'transition-all duration-200 transform hover:scale-105 active:scale-95',
                'shadow-lg hover:shadow-xl',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
              )}
              aria-label="Submit action"
            >
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>

          {/* AI Suggestions */}
          {currentSession.world_state.available_actions && currentSession.world_state.available_actions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  AI Suggestions:
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentSession.world_state.available_actions.slice(0, 3).map((suggestion, index) => (
                  <Button
                    key={`suggestion-${index}-${suggestion.slice(0, 10)}`}
                    variant="outline"
                    size="sm"
                    onClick={() => setActionInput(suggestion)}
                    disabled={isLoading || isAIGenerating}
                    className={cn(
                      'text-xs transition-all duration-200 hover:scale-105',
                      'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950',
                      'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    )}
                    aria-label={`Use suggestion: ${suggestion}`}
                  >
                    <span className="max-w-[200px] truncate">
                      {truncateText(suggestion, 30)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-muted-foreground">
            <div id="action-help" className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Enter</kbd>
                <span>to submit</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Shift+Enter</kbd>
                <span>for new line</span>
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className={cn(
                'flex items-center space-x-1',
                connectionStatus === 'connected' && 'text-green-600 dark:text-green-400',
                connectionStatus === 'connecting' && 'text-yellow-600 dark:text-yellow-400',
                connectionStatus === 'disconnected' && 'text-red-600 dark:text-red-400',
                connectionStatus === 'error' && 'text-red-600 dark:text-red-400'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  connectionStatus === 'connected' && 'bg-green-500',
                  connectionStatus === 'connecting' && 'bg-yellow-500 animate-pulse',
                  connectionStatus === 'disconnected' && 'bg-red-500',
                  connectionStatus === 'error' && 'bg-red-500'
                )} />
                <span>
                  {connectionStatus === 'connected' && (dynamicContent?.statusMessages.connected || 'Connected')}
                  {connectionStatus === 'connecting' && (dynamicContent?.statusMessages.connecting || 'Connecting...')}
                  {connectionStatus === 'disconnected' && (dynamicContent?.statusMessages.disconnected || 'Disconnected')}
                  {connectionStatus === 'error' && (dynamicContent?.statusMessages.error || 'Connection Error')}
                </span>
              </div>

              {/* AI Status */}
              {isAIGenerating && (
                <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>{dynamicContent?.statusMessages.aiThinking || 'AI is thinking...'}</span>
                </div>
              )}
              {!isAIGenerating && actionInput.trim() && connectionStatus === 'connected' && (
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{dynamicContent?.statusMessages.readyToSend || 'Ready to send'}</span>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Enhanced Modal Components */}

      {/* Bookmark Manager Modal */}
      {showBookmarkManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Bookmark Manager</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBookmarkManager(false)}
                aria-label="Close bookmark manager"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* TODO: Replace with actual BookmarkManager component when imports are fixed */}
              <div className="text-center py-12">
                <BookmarkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Bookmark Manager</h3>
                <p className="text-muted-foreground">
                  Advanced bookmark management will be available here.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Advanced Story Search</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedSearch(false)}
                aria-label="Close advanced search"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* TODO: Replace with actual StorySearch component when imports are fixed */}
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Advanced Search</h3>
                <p className="text-muted-foreground">
                  AI-powered story search will be available here.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Exporter Modal */}
      {showStoryExporter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Export Story</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStoryExporter(false)}
                aria-label="Close story exporter"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* TODO: Replace with actual StoryExporter component when imports are fixed */}
              <div className="text-center py-12">
                <ArrowDownTrayIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Story Exporter</h3>
                <p className="text-muted-foreground">
                  Advanced export options will be available here.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoryPanel;
