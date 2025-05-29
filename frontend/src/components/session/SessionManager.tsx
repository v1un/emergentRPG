// Session Manager Component - Create and manage game sessions

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameAPI } from '@/services/api/client';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/Button';
import { ActionButton } from '@/components/ui/ActionButton';
import { ButtonGroup } from '@/components/ui/ButtonGroup';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LoadingSpinner, LoadingCard } from '@/components/ui/Loading';
import { cn } from '@/utils/helpers';
import { dateFormatters, gameFormatters } from '@/utils/formatting';
import { createSessionSchema } from '@/utils/validation';
import { GameSession, GameSessionSummary, CreateSessionRequest } from '@/types';
import { QUERY_KEYS } from '@/utils/constants';
import {
  PlusIcon,
  PlayIcon,
  TrashIcon,
  BookOpenIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface SessionManagerProps {
  onSessionSelect: (session: GameSession) => void;
}

export function SessionManager({ onSessionSelect }: SessionManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateSessionRequest>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const queryClient = useQueryClient();
  const { setCurrentSession, setLoadingSession } = useGameStore();

  // Fetch existing sessions
  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: QUERY_KEYS.SESSIONS,
    queryFn: () => gameAPI.getSessions(),
  });

  // Fetch scenarios for creation
  const { data: scenariosData } = useQuery({
    queryKey: QUERY_KEYS.SCENARIOS,
    queryFn: () => gameAPI.getScenarios(),
    enabled: showCreateForm,
  });

  // Fetch lorebooks for creation
  const { data: lorebooksData } = useQuery({
    queryKey: QUERY_KEYS.LOREBOOKS,
    queryFn: () => gameAPI.getLorebooks(),
    enabled: showCreateForm,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (data: CreateSessionRequest) => gameAPI.createSession(data),
    onSuccess: async (result) => {
      toast.success('Game session created successfully!');
      setShowCreateForm(false);
      setCreateFormData({});
      setFormErrors({});
      
      // Fetch the new session and select it
      try {
        const sessionData = await gameAPI.getSession(result.session_id);
        onSessionSelect(sessionData.session);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SESSIONS });
      } catch (error) {
        console.error('Failed to fetch new session:', error);
        toast.error('Session created but failed to load');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create session');
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => gameAPI.deleteSession(sessionId),
    onSuccess: () => {
      toast.success('Session deleted successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SESSIONS });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete session');
    },
  });

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = createSessionSchema.safeParse(createFormData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    createSessionMutation.mutate(createFormData);
  };

  const handleLoadSession = async (session: GameSessionSummary) => {
    setLoadingSession(true);
    try {
      // Fetch fresh session data
      const sessionData = await gameAPI.getSession(session.session_id);
      onSessionSelect(sessionData.session);
      toast.success(`Loaded session: ${session.character.name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load session');
    } finally {
      setLoadingSession(false);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  // Create a demo session for testing navigation
  const handleCreateDemoSession = () => {
    const demoSession: GameSession = {
      session_id: 'demo-session-' + Date.now(),
      character: {
        name: 'Demo Hero',
        class_name: 'Adventurer',
        level: 5,
        health: 85,
        max_health: 100,
        mana: 40,
        max_mana: 50,
        experience: 1250,
        stats: {
          strength: 15,
          dexterity: 12,
          constitution: 14,
          intelligence: 13,
          wisdom: 11,
          charisma: 10,
        },
        equipped_items: {
          weapon: 'Steel Sword',
          helmet: '',
          chest: '',
          legs: '',
          boots: '',
          gloves: '',
          ring: '',
          necklace: '',
          shield: '',
        },
        max_carry_weight: 100,
      },
      world_state: {
        current_location: 'Mystical Forest Clearing',
        time_of_day: 'afternoon',
        weather: 'clear',
        available_actions: [
          'Explore the ancient ruins to the north',
          'Follow the winding path deeper into the forest',
          'Examine the mysterious glowing crystals',
          'Rest by the peaceful stream',
        ],
        npcs_present: ['Forest Guardian', 'Wise Owl'],
        environment_description: 'A peaceful clearing surrounded by ancient trees, with a gentle stream flowing nearby.',
        special_conditions: ['Magical aura present'],
      },
      inventory: [
        {
          id: 'sword-1',
          name: 'Steel Sword',
          type: 'weapon',
          rarity: 'common',
          description: 'A well-crafted steel sword with a sharp edge.',
          quantity: 1,
          equipped: true,
          equipment_slot: 'weapon',
          weight: 3.5,
          durability: 80,
          max_durability: 100,
          metadata: { attack: 15 },
        },
        {
          id: 'potion-1',
          name: 'Health Potion',
          type: 'consumable',
          rarity: 'common',
          description: 'Restores 50 health points.',
          quantity: 3,
          equipped: false,
          weight: 0.2,
          metadata: { healing: 50 },
        },
      ],
      quests: [
        {
          id: 'quest-1',
          title: 'The Lost Artifact',
          description: 'Find the ancient artifact hidden in the mystical forest.',
          status: 'active',
          progress: {
            current: 1,
            total: 3,
            completed_objectives: [true, false, false],
            percentage: 33,
            is_complete: false,
          },
          objectives: [
            'Explore the forest clearing',
            'Locate the ancient ruins',
            'Retrieve the artifact',
          ],
          rewards: { experience: 500, gold: 100 },
          dependencies: [],
          failure_conditions: ['Character dies', 'Time limit exceeded'],
        },
      ],
      story: [
        {
          id: 'story-1',
          type: 'narration',
          text: 'You find yourself standing in a mystical forest clearing, surrounded by towering ancient trees. Shafts of golden sunlight filter through the canopy above, illuminating patches of soft moss and colorful wildflowers. The air is filled with the gentle sounds of nature - birds singing, leaves rustling, and a distant stream babbling.',
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: 'story-2',
          type: 'player',
          text: 'I look around carefully, taking in my surroundings.',
          timestamp: new Date(Date.now() - 240000).toISOString(),
        },
        {
          id: 'story-3',
          type: 'narration',
          text: 'As you survey the clearing, you notice several points of interest. To the north, partially hidden by overgrown vines, you can make out the weathered stone walls of what appear to be ancient ruins. Strange, glowing crystals embedded in the ground pulse with a soft blue light. A crystal-clear stream winds its way through the eastern edge of the clearing, its gentle flow creating a soothing melody.',
          timestamp: new Date(Date.now() - 180000).toISOString(),
        },
      ],
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updated_at: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
    };

    onSessionSelect(demoSession);
    toast.success('Demo session loaded! Navigate using the sidebar.');
  };

  const sessions = sessionsData?.sessions || [];
  const scenarios = scenariosData?.templates || [];
  const lorebooks = lorebooksData?.lorebooks || [];

  if (showCreateForm) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Game Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSession} className="space-y-6">
              {/* Character Name */}
              <Input
                label="Character Name"
                placeholder="Enter your character's name"
                value={createFormData.character_name || ''}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, character_name: e.target.value }))}
                error={formErrors.character_name}
                leftIcon={<UserIcon className="h-4 w-4" />}
              />

              {/* Scenario Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scenario Template (Optional)
                </label>
                <select
                  value={createFormData.scenario_template_id || ''}
                  onChange={(e) => setCreateFormData(prev => ({ 
                    ...prev, 
                    scenario_template_id: e.target.value || undefined 
                  }))}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="">Select a scenario...</option>
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.title} - {scenario.genre}
                    </option>
                  ))}
                </select>
                {formErrors.scenario_template_id && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.scenario_template_id}</p>
                )}
              </div>

              {/* Lorebook Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lorebook (Optional)
                </label>
                <select
                  value={createFormData.lorebook_id || ''}
                  onChange={(e) => setCreateFormData(prev => ({ 
                    ...prev, 
                    lorebook_id: e.target.value || undefined 
                  }))}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="">Select a lorebook...</option>
                  {lorebooks.map((lorebook) => (
                    <option key={lorebook.id} value={lorebook.id}>
                      {lorebook.title}
                    </option>
                  ))}
                </select>
                {formErrors.lorebook_id && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.lorebook_id}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  loading={createSessionMutation.isPending}
                  className="flex-1"
                >
                  Create Session
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateFormData({});
                    setFormErrors({});
                  }}
                  disabled={createSessionMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 relative">
      {/* Magical background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-3xl"></div>

      {/* Enhanced Magical Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 relative z-10">
        <div className="text-center lg:text-left mb-6 lg:mb-0">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            ✨ Game Sessions
          </h1>
          <p className="text-muted-foreground text-lg">
            Create a new magical adventure or continue an existing journey
          </p>
          <div className="flex justify-center lg:justify-start space-x-2 mt-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
        <ButtonGroup spacing="lg" className="justify-center lg:justify-end">
          <ActionButton
            action="play"
            onClick={handleCreateDemoSession}
            aria-label="Create demo session"
            tooltip="Try a demo session to explore the magical interface"
            loadingText="Creating demo..."
            successText="Demo loaded!"
            className="bg-gradient-secondary hover:bg-gradient-primary hover:text-primary-foreground transition-all duration-300 hover:glow-primary"
          >
            🎮 Demo Session
          </ActionButton>
          <ActionButton
            action="add"
            onClick={() => setShowCreateForm(true)}
            aria-label="Create new session"
            tooltip="Create a new magical adventure"
            className="bg-gradient-primary hover:bg-gradient-accent transition-all duration-300 glow-primary hover:glow-accent"
          >
            ✨ New Session
          </ActionButton>
        </ButtonGroup>
      </div>

      {/* Sessions Grid */}
      {isLoadingSessions ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <LoadingCard key={index} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 relative z-10">
          <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 glow-primary animate-float">
            <BookOpenIcon className="h-12 w-12 text-primary-foreground" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            No Game Sessions Yet
          </h3>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Create your first magical game session to begin your AI-driven adventure in a world of endless possibilities.
          </p>
          <ButtonGroup spacing="lg" className="justify-center">
            <ActionButton
              action="play"
              variant="outline"
              onClick={handleCreateDemoSession}
              aria-label="Try demo session"
              tooltip="Experience the AI storytelling with a demo session"
              loadingText="Creating demo..."
              successText="Demo ready!"
              className="border-primary/30 hover:bg-gradient-primary hover:text-primary-foreground transition-all duration-300 hover:glow-primary"
            >
              🎮 Try Demo Session
            </ActionButton>
            <ActionButton
              action="add"
              onClick={() => setShowCreateForm(true)}
              aria-label="Create first session"
              tooltip="Create your first AI-driven adventure"
              className="bg-gradient-primary hover:bg-gradient-accent transition-all duration-300 glow-primary hover:glow-accent"
            >
              ✨ Create First Session
            </ActionButton>
          </ButtonGroup>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {sessions.map((session) => (
            <Card key={session.session_id} className="group hover:shadow-2xl transition-all duration-500 hover:scale-105 glass border border-gray-200/50 dark:border-gray-800/50 hover:glow-primary">
              <CardHeader className="bg-gradient-secondary/30 border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-gradient-primary rounded-full animate-pulse"></div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {session.character.name}
                      </CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      ⚔️ Level {session.character.level} {session.character.class_name}
                    </p>
                  </div>
                  <ButtonGroup spacing="sm">
                    <ActionButton
                      action="play"
                      iconOnly
                      onClick={() => handleLoadSession(session)}
                      disabled={deleteSessionMutation.isPending}
                      aria-label={`Load session for ${session.character.name}`}
                      tooltip="Load this magical session"
                      loadingText="Loading session..."
                      successText="Session loaded!"
                      className="hover:bg-gradient-primary hover:text-primary-foreground transition-all duration-300 hover:glow-primary"
                    />
                    <ActionButton
                      action="delete"
                      iconOnly
                      onClick={() => handleDeleteSession(session.session_id)}
                      disabled={deleteSessionMutation.isPending}
                      aria-label={`Delete session for ${session.character.name}`}
                      tooltip="Delete this session"
                      confirmAction
                      confirmMessage={`Are you sure you want to delete the session for ${session.character.name}? This action cannot be undone.`}
                      loadingText="Deleting..."
                      successText="Deleted!"
                      className="hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
                    />
                  </ButtonGroup>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground bg-gradient-secondary/20 rounded-lg p-3">
                    <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-medium">Last played {dateFormatters.relative(session.updated_at)}</span>
                  </div>

                  <div className="bg-gradient-secondary/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">📍</span>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current Location</p>
                    </div>
                    <p className="font-semibold text-foreground">{session.world_state.current_location}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-secondary/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">❤️</span>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Health</p>
                      </div>
                      <p className="font-semibold text-foreground">
                        {gameFormatters.health(session.character.health, session.character.max_health)}
                      </p>
                    </div>

                    <div className="bg-gradient-secondary/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">📖</span>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Story</p>
                      </div>
                      <p className="font-semibold text-foreground">{session.story_length || 0} entries</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default SessionManager;
