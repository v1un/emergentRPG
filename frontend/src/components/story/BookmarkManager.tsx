// Bookmark Manager Component - Story bookmarking and management interface
// Provides bookmark creation, editing, filtering, and AI-generated summaries

'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookmarkIcon, 
  BookmarkSlashIcon,
  TagIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ActionButton } from '@/components/ui/ActionButton';
import { Input } from '@/components/ui/Input';
import { StoryBookmark, BookmarkFilter, StoryEntry } from '@/types';
import { bookmarkService } from '@/services/bookmarkService';
import { useCurrentSession } from '@/stores/gameStore';
import { cn } from '@/utils/helpers';
import { toast } from 'react-hot-toast';

interface BookmarkManagerProps {
  storyEntries: StoryEntry[];
  bookmarkedEntries: Set<string>;
  onBookmarkToggle: (entryId: string) => void;
  onBookmarkSelect: (bookmark: StoryBookmark) => void;
  className?: string;
}

interface BookmarkFormData {
  title: string;
  description: string;
  tags: string[];
  category: StoryBookmark['category'];
  isPrivate: boolean;
}

export function BookmarkManager({
  storyEntries,
  bookmarkedEntries,
  onBookmarkToggle,
  onBookmarkSelect,
  className
}: BookmarkManagerProps) {
  const currentSession = useCurrentSession();
  const [bookmarks, setBookmarks] = useState<StoryBookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<StoryBookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<BookmarkFilter>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<StoryBookmark | null>(null);
  const [formData, setFormData] = useState<BookmarkFormData>({
    title: '',
    description: '',
    tags: [],
    category: 'important',
    isPrivate: false,
  });

  // Load bookmarks on mount and session change
  useEffect(() => {
    if (currentSession) {
      loadBookmarks();
    }
  }, [currentSession?.session_id]);

  // Filter bookmarks when search or filter changes
  useEffect(() => {
    filterBookmarks();
  }, [bookmarks, searchQuery, filter]);

  const loadBookmarks = async () => {
    if (!currentSession) return;
    
    setLoading(true);
    try {
      const sessionBookmarks = await bookmarkService.getBookmarks({
        sessionId: currentSession.session_id,
        filter,
      });
      setBookmarks(sessionBookmarks);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const filterBookmarks = async () => {
    if (!searchQuery && !filter.category && !filter.tags?.length) {
      setFilteredBookmarks(bookmarks);
      return;
    }

    try {
      const filtered = await bookmarkService.searchBookmarks(searchQuery, {
        sessionId: currentSession?.session_id,
        filter,
      });
      setFilteredBookmarks(filtered);
    } catch (error) {
      console.error('Failed to filter bookmarks:', error);
      setFilteredBookmarks(bookmarks);
    }
  };

  const handleCreateBookmark = async (storyEntry: StoryEntry) => {
    if (!currentSession) return;

    try {
      // Generate AI summary and suggested tags
      const [aiSummary, suggestedTags] = await Promise.all([
        bookmarkService.generateAISummary(storyEntry, {
          character: currentSession.character,
          worldState: currentSession.world_state,
          recentEntries: storyEntries.slice(-3),
        }),
        bookmarkService.getSuggestedTags(storyEntry, {
          character: currentSession.character,
          worldState: currentSession.world_state,
        }),
      ]);

      const bookmark = await bookmarkService.createBookmark({
        storyEntryId: storyEntry.id,
        sessionId: currentSession.session_id,
        title: formData.title || `Bookmark - ${new Date().toLocaleDateString()}`,
        description: formData.description,
        tags: formData.tags.length > 0 ? formData.tags : suggestedTags,
        category: formData.category,
        isPrivate: formData.isPrivate,
      });

      setBookmarks(prev => [...prev, bookmark]);
      onBookmarkToggle(storyEntry.id);
      setShowCreateForm(false);
      resetForm();
      toast.success('Bookmark created successfully!');
    } catch (error) {
      console.error('Failed to create bookmark:', error);
      toast.error('Failed to create bookmark');
    }
  };

  const handleUpdateBookmark = async () => {
    if (!editingBookmark) return;

    try {
      const updated = await bookmarkService.updateBookmark(editingBookmark.id, {
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        category: formData.category,
        isPrivate: formData.isPrivate,
      });

      setBookmarks(prev => prev.map(b => b.id === updated.id ? updated : b));
      setEditingBookmark(null);
      resetForm();
      toast.success('Bookmark updated successfully!');
    } catch (error) {
      console.error('Failed to update bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return;

    try {
      await bookmarkService.deleteBookmark(bookmarkId);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      toast.success('Bookmark deleted successfully!');
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      toast.error('Failed to delete bookmark');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      tags: [],
      category: 'important',
      isPrivate: false,
    });
  };

  const startEditing = (bookmark: StoryBookmark) => {
    setEditingBookmark(bookmark);
    setFormData({
      title: bookmark.title,
      description: bookmark.description || '',
      tags: bookmark.tags,
      category: bookmark.category,
      isPrivate: bookmark.isPrivate,
    });
    setShowCreateForm(true);
  };

  const getCategoryIcon = (category: StoryBookmark['category']) => {
    switch (category) {
      case 'character_development':
        return '👤';
      case 'plot_point':
        return '📖';
      case 'dialogue':
        return '💬';
      case 'action':
        return '⚔️';
      case 'important':
        return '⭐';
      default:
        return '📌';
    }
  };

  const getCategoryColor = (category: StoryBookmark['category']) => {
    switch (category) {
      case 'character_development':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'plot_point':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'dialogue':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'action':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'important':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filter Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <ActionButton
            action="filter"
            onClick={() => {/* TODO: Implement filter modal */}}
            aria-label="Filter bookmarks"
            tooltip="Filter bookmarks by category and tags"
          >
            <FunnelIcon className="h-4 w-4" />
          </ActionButton>
          <ActionButton
            action="add"
            onClick={() => setShowCreateForm(true)}
            aria-label="Create bookmark"
            tooltip="Create a new bookmark"
          >
            <PlusIcon className="h-4 w-4" />
          </ActionButton>
        </div>
      </div>

      {/* Bookmark List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading bookmarks...</p>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-8">
            <BookmarkSlashIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Bookmarks Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filter.category || filter.tags?.length
                ? 'No bookmarks match your search criteria.'
                : 'Start bookmarking important story moments to build your collection.'}
            </p>
            <ActionButton
              action="add"
              onClick={() => setShowCreateForm(true)}
            >
              Create First Bookmark
            </ActionButton>
          </div>
        ) : (
          filteredBookmarks.map((bookmark) => (
            <Card
              key={bookmark.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onBookmarkSelect(bookmark)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(bookmark.category)}</span>
                      <h4 className="font-medium text-foreground truncate">
                        {bookmark.title}
                      </h4>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        getCategoryColor(bookmark.category)
                      )}>
                        {bookmark.category.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {bookmark.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {bookmark.description}
                      </p>
                    )}
                    
                    {bookmark.aiSummary && (
                      <div className="flex items-start gap-2 mb-2">
                        <SparklesIcon className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground italic line-clamp-2">
                          {bookmark.aiSummary}
                        </p>
                      </div>
                    )}
                    
                    {bookmark.tags.length > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <TagIcon className="h-3 w-3 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {bookmark.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      {new Date(bookmark.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(bookmark);
                      }}
                      aria-label="Edit bookmark"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBookmark(bookmark.id);
                      }}
                      aria-label="Delete bookmark"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
