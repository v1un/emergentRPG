// Sessions Management Panel - Allows users to view, switch, and manage game sessions

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameAPI } from '@/services/api/client';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/Loading';
import { cn } from '@/utils/helpers';
import { dateFormatters } from '@/utils/formatting';
import { GameSession, GameSessionSummary } from '@/types';
import { QUERY_KEYS, PANELS } from '@/utils/constants';
import toast from 'react-hot-toast';
import {
  PlayIcon,
  TrashIcon,
  PlusIcon,
  UserIcon,
  ClockIcon,
  MapPinIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

export function SessionsPanel() {
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { 
    currentSession, 
    setCurrentSession, 
    setActivePanel,
    setLoadingSession 
  } = useGameStore();

  // Fetch existing sessions
  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: QUERY_KEYS.SESSIONS,
    queryFn: () => gameAPI.getSessions(),
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => gameAPI.deleteSession(sessionId),
    onSuccess: (_, sessionId) => {
      toast.success('Session deleted successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SESSIONS });
      
      // If the deleted session was the current session, clear it
      if (currentSession?.session_id === sessionId) {
        setCurrentSession(null);
      }
    },
    onError: (error: any) => {
      toast.error(error.message ?? 'Failed to delete session');
    },
  });

  const sessions = sessionsData?.sessions || [];

  const handleLoadSession = async (session: GameSessionSummary) => {
    if (session.session_id === currentSession?.session_id) {
      // If it's the current session, just switch to story panel
      setActivePanel(PANELS.STORY);
      toast.success('Switched to current session');
      return;
    }

    setLoadingSessionId(session.session_id);
    setLoadingSession(true);
    
    try {
      // Fetch fresh session data
      const sessionData = await gameAPI.getSession(session.session_id);
      setCurrentSession(sessionData.session);
      setActivePanel(PANELS.STORY); // Switch to story panel after loading
      toast.success(`Loaded session: ${session.character.name}`);
    } catch (error: any) {
      toast.error(error.message ?? 'Failed to load session');
    } finally {
      setLoadingSessionId(null);
      setLoadingSession(false);
    }
  };

  const handleDeleteSession = (sessionId: string, characterName: string) => {
    if (confirm(`Are you sure you want to delete the session for "${characterName}"? This action cannot be undone.`)) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const handleCreateNewSession = () => {
    // Clear current session to show session manager
    setCurrentSession(null);
    toast('Create a new session below');
  };

  if (isLoadingSessions) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Game Sessions</h2>
          <p className="text-muted-foreground">
            Manage your adventures and switch between different characters
          </p>
        </div>
        <Button onClick={handleCreateNewSession}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Current Session Indicator */}
      {currentSession && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <CardTitle className="text-lg text-primary">
                    Currently Playing: {currentSession.character.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Level {currentSession.character.level} {currentSession.character.class_name} in {currentSession.world_state.current_location}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActivePanel(PANELS.STORY)}
              >
                Continue Playing
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Game Sessions
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first game session to begin your AI-driven adventure.
          </p>
          <Button onClick={handleCreateNewSession}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create First Session
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const isCurrentSession = currentSession?.session_id === session.session_id;
            const isLoading = loadingSessionId === session.session_id;
            
            return (
              <Card 
                key={session.session_id} 
                className={cn(
                  "hover:shadow-lg transition-all duration-200",
                  isCurrentSession && "ring-2 ring-primary/50 bg-primary/5"
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className="text-lg">
                          {session.character.name}
                        </CardTitle>
                        {isCurrentSession && (
                          <StarIcon className="h-4 w-4 text-primary fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Level {session.character.level} {session.character.class_name}
                      </p>
                      
                      {/* Session Details */}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPinIcon className="h-3 w-3" />
                          <span>{session.world_state.current_location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>
                            {dateFormatters.relative(new Date(session.updated_at))}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>Story entries: {session.story_length ?? 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-1 ml-2">
                      <Button
                        size="icon"
                        variant={isCurrentSession ? "default" : "ghost"}
                        onClick={() => handleLoadSession(session)}
                        disabled={isLoading || deleteSessionMutation.isPending}
                        className="h-8 w-8"
                      >
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <PlayIcon className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteSession(session.session_id, session.character.name)}
                        disabled={isLoading || deleteSessionMutation.isPending}
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Session Preview */}
                <CardContent className="pt-0">
                  {(session.story_length ?? 0) > 0 && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <p className="line-clamp-2">
                        Last played {dateFormatters.relative(new Date(session.updated_at))}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SessionsPanel;
