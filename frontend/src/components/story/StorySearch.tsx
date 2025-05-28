// Story Search Component - AI-powered story search and navigation
// Provides full-text search, categorization, and intelligent content discovery

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ActionButton } from '@/components/ui/ActionButton';
import { Input } from '@/components/ui/Input';
import { StorySearchResult, StorySearchOptions, StoryEntry } from '@/types';
import { storySearchService } from '@/services/storySearchService';
import { useCurrentSession } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';

interface StorySearchProps {
  onResultSelect: (result: StorySearchResult) => void;
  onClose?: () => void;
  className?: string;
}

interface SearchSuggestion {
  query: string;
  description: string;
  category: string;
  confidence: number;
}

export function StorySearch({ onResultSelect, onClose, className }: StorySearchProps) {
  const currentSession = useCurrentSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StorySearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load suggestions and recent searches on mount
  useEffect(() => {
    if (currentSession) {
      loadSuggestions();
      loadRecentSearches();
    }
  }, [currentSession?.session_id]);

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSuggestions(true);
    }
  }, [searchQuery]);

  const loadSuggestions = async () => {
    if (!currentSession) return;

    try {
      const sessionSuggestions = await storySearchService.getSearchSuggestions(
        currentSession.session_id
      );
      setSuggestions(sessionSuggestions);
    } catch (error) {
      console.error('Failed to load search suggestions:', error);
    }
  };

  const loadRecentSearches = () => {
    const stored = localStorage.getItem(`recentSearches_${currentSession?.session_id}`);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  };

  const saveRecentSearch = (query: string) => {
    if (!currentSession || !query.trim()) return;

    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(
      `recentSearches_${currentSession.session_id}`,
      JSON.stringify(updated)
    );
  };

  const performSearch = async (query: string) => {
    if (!currentSession || !query.trim()) return;

    setLoading(true);
    setShowSuggestions(false);

    try {
      const options: StorySearchOptions = {
        query: query.trim(),
        maxResults: 20,
      };

      const results = await storySearchService.searchStory(
        currentSession.session_id,
        options
      );

      setSearchResults(results);
      saveRecentSearch(query.trim());

      if (results.length === 0) {
        toast.info('No results found for your search');
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.query);
    performSearch(suggestion.query);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(true);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dialogue':
        return '💬';
      case 'action':
        return '⚔️';
      case 'description':
        return '📝';
      case 'system':
        return '⚙️';
      default:
        return '📖';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'dialogue':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'action':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'description':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'system':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
  };

  const highlightSearchTerms = (text: string, query: string) => {
    if (!query.trim()) return text;

    const terms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    let highlightedText = text;

    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'
      );
    });

    return highlightedText;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Search Story</h3>
          <p className="text-muted-foreground">
            Find specific moments in your adventure
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            <XMarkIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          placeholder="Search your story..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Searching...</p>
        </div>
      )}

      {/* Search Suggestions */}
      {showSuggestions && !loading && (
        <div className="space-y-4">
          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="h-4 w-4 text-purple-500" />
                <h4 className="font-medium">AI Suggestions</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((suggestion, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{suggestion.query}</p>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.description}
                          </p>
                        </div>
                        <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Recent Searches</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecentSearchClick(query)}
                    className="text-sm"
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </h4>
            <ActionButton
              action="filter"
              onClick={() => {/* TODO: Implement advanced filters */}}
              aria-label="Advanced filters"
              tooltip="Advanced search filters"
            >
              <FunnelIcon className="h-4 w-4" />
            </ActionButton>
          </div>

          {searchResults.map((result, index) => (
            <Card
              key={result.entryId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onResultSelect(result)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(result.category)}</span>
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      getCategoryColor(result.category)
                    )}>
                      {result.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(result.relevanceScore * 100)}% match
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(result.entry.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTerms(result.matchedText, searchQuery)
                    }}
                  />
                  
                  {result.context.before && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Before:</span> {result.context.before}
                    </div>
                  )}
                  
                  {result.context.after && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">After:</span> {result.context.after}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {searchResults.length === 0 && searchQuery && !loading && !showSuggestions && (
        <div className="text-center py-8">
          <MagnifyingGlassIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
          <p className="text-muted-foreground mb-4">
            Try different keywords or check your spelling
          </p>
          <Button onClick={clearSearch}>
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
}
