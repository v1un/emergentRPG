// Quests Panel Component - Quest tracking system

'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentQuests, useGameStore, useCurrentSession } from '@/stores/gameStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/helpers';
import { gameFormatters } from '@/utils/formatting';
import { Quest } from '@/types';
import { dynamicUIService, DynamicUIContent } from '@/services/dynamicUIService';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrophyIcon,
  GiftIcon,
  StarIcon,
  BellIcon,
  EyeIcon,
  EyeSlashIcon,
  FireIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolidIcon,
  TrophyIcon as TrophySolidIcon,
  StarIcon as StarSolidIcon,
} from '@heroicons/react/24/solid';

type QuestFilter = 'all' | 'active' | 'completed' | 'failed';

// Quest completion notification component
interface QuestNotificationProps {
  quest: Quest;
  isVisible: boolean;
  onClose: () => void;
}

function QuestCompletionNotification({ quest, isVisible, onClose }: QuestNotificationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto-close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
      <Card className="w-80 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <TrophySolidIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-800 dark:text-green-200">
                Quest Completed!
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {quest.title}
              </p>
              {quest.rewards && Object.keys(quest.rewards).length > 0 && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  Rewards: {Object.entries(quest.rewards).map(([type, value]) =>
                    `${value} ${type}`
                  ).join(', ')}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function QuestsPanel() {
  const quests = useCurrentQuests();
  const currentSession = useCurrentSession();
  const { updateSession } = useGameStore();
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [filter, setFilter] = useState<QuestFilter>('all');
  const [trackedQuests, setTrackedQuests] = useState<Set<string>>(new Set());
  const [completionNotification, setCompletionNotification] = useState<Quest | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [dynamicContent, setDynamicContent] = useState<DynamicUIContent | null>(null);

  // Load dynamic UI content
  useEffect(() => {
    const loadDynamicContent = async () => {
      try {
        const content = await dynamicUIService.getDynamicUIContent({
          character: currentSession?.character,
          session: currentSession,
          currentLocation: currentSession?.world_state?.current_location,
          gameState: quests.length === 0 ? 'starting' : 'playing',
          panelType: 'quests',
        });
        setDynamicContent(content);
      } catch (error) {
        console.warn('Failed to load dynamic UI content for quests:', error);
      }
    };

    if (currentSession) {
      loadDynamicContent();
    }
  }, [currentSession, quests.length]);

  // Check for newly completed quests
  useEffect(() => {
    const completedQuests = quests.filter(q => q.status === 'completed');
    const lastCompletedQuest = completedQuests[completedQuests.length - 1];

    if (lastCompletedQuest && !showNotification) {
      setCompletionNotification(lastCompletedQuest);
      setShowNotification(true);
    }
  }, [quests, showNotification]);

  // Filter quests based on status
  const filteredQuests = quests.filter(quest => {
    if (filter === 'all') return true;
    return quest.status === filter;
  });

  // Group quests by status
  const questCounts = {
    active: quests.filter(q => q.status === 'active').length,
    completed: quests.filter(q => q.status === 'completed').length,
    failed: quests.filter(q => q.status === 'failed').length,
  };

  const getQuestIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = gameFormatters.questStatus(status);
    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusInfo.className
      )}>
        {statusInfo.text}
      </span>
    );
  };

  // Quest action handlers
  const handleTrackQuest = (quest: Quest) => {
    setTrackedQuests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quest.id)) {
        newSet.delete(quest.id);
      } else {
        newSet.add(quest.id);
      }
      return newSet;
    });
  };

  const handleAbandonQuest = (quest: Quest) => {
    // TODO: Implement quest abandonment logic
    console.log('Abandoning quest:', quest.title);
  };

  const getObjectiveProgress = (quest: Quest) => {
    if (quest.status === 'completed') return 100;
    if (quest.status === 'failed') return 0;

    // Simple progress calculation - in a real implementation,
    // this would track individual objective completion
    const completedObjectives = quest.objectives.length > 0 ? 1 : 0;
    return (completedObjectives / quest.objectives.length) * 100;
  };

  const renderQuestCard = (quest: Quest) => {
    const isTracked = trackedQuests.has(quest.id);
    const progress = getObjectiveProgress(quest);

    return (
      <Card
        key={quest.id}
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-md relative',
          selectedQuest?.id === quest.id && 'ring-2 ring-primary',
          isTracked && 'ring-1 ring-blue-300 dark:ring-blue-700'
        )}
        onClick={() => setSelectedQuest(quest)}
      >
        {/* Tracking indicator */}
        {isTracked && (
          <div className="absolute top-2 right-2">
            <EyeIcon className="h-4 w-4 text-blue-500" />
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {getQuestIcon(quest.status)}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate flex items-center">
                  {quest.title}
                  {isTracked && (
                    <StarSolidIcon className="h-4 w-4 text-yellow-500 ml-2" />
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {quest.description}
                </p>
              </div>
            </div>
            {getStatusBadge(quest.status)}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Objectives:</span>
              <span className="ml-2 font-medium">
                {quest.objectives.length} total
              </span>
            </div>

            {/* Progress Bar */}
            {quest.status === 'active' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {quest.status === 'active' && quest.objectives.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Current: {quest.objectives[0]}
              </div>
            )}

            {/* Rewards Preview */}
            {quest.rewards && Object.keys(quest.rewards).length > 0 && (
              <div className="flex items-center text-xs text-muted-foreground">
                <GiftIcon className="h-3 w-3 mr-1" />
                <span>
                  {Object.entries(quest.rewards).slice(0, 2).map(([type, value]) =>
                    `${value} ${type}`
                  ).join(', ')}
                  {Object.keys(quest.rewards).length > 2 && '...'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (quests.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <ClipboardDocumentListIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {dynamicContent?.emptyStateTitle || 'No Quests Yet'}
          </h3>
          <p className="text-muted-foreground">
            {dynamicContent?.emptyStateMessage || 'Your quest log is empty. Start exploring to discover new adventures!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Quest Completion Notification */}
      {completionNotification && (
        <QuestCompletionNotification
          quest={completionNotification}
          isVisible={showNotification}
          onClose={() => {
            setShowNotification(false);
            setCompletionNotification(null);
          }}
        />
      )}

      <div className="h-full flex">
        {/* Quest List */}
        <div className="flex-1 flex flex-col">
        {/* Header with Stats */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {questCounts.active}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {questCounts.completed}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {questCounts.failed}
              </p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex space-x-2">
            {(['all', 'active', 'completed', 'failed'] as QuestFilter[]).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="capitalize"
              >
                {filterType}
              </Button>
            ))}
          </div>
        </div>

        {/* Quest List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredQuests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No {filter === 'all' ? '' : filter} quests found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuests.map(renderQuestCard)}
            </div>
          )}
        </div>
      </div>

      {/* Quest Detail Sidebar */}
      {selectedQuest && (
        <div className="w-96 border-l border-gray-200 dark:border-gray-800 bg-card p-6">
          <div className="space-y-6">
            {/* Quest Header */}
            <div>
              <div className="flex items-center space-x-3 mb-3">
                {getQuestIcon(selectedQuest.status)}
                <h3 className="text-xl font-semibold text-foreground">
                  {selectedQuest.title}
                </h3>
              </div>
              {getStatusBadge(selectedQuest.status)}
            </div>

            {/* Description */}
            <div>
              <h4 className="font-medium text-foreground mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedQuest.description}
              </p>
            </div>

            {/* Objectives */}
            <div>
              <h4 className="font-medium text-foreground mb-3">
                Objectives ({selectedQuest.objectives.length})
              </h4>
              <div className="space-y-2">
                {selectedQuest.objectives.map((objective, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0',
                      selectedQuest.status === 'completed' 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    )}>
                      {selectedQuest.status === 'completed' && (
                        <CheckCircleIcon className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <p className={cn(
                      'text-sm flex-1',
                      selectedQuest.status === 'completed' 
                        ? 'text-muted-foreground line-through' 
                        : 'text-foreground'
                    )}>
                      {objective}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rewards */}
            {selectedQuest.rewards && Object.keys(selectedQuest.rewards).length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <GiftIcon className="h-4 w-4 mr-2" />
                  Rewards
                </h4>
                <div className="space-y-2">
                  {Object.entries(selectedQuest.rewards).map(([rewardType, value]) => (
                    <div key={rewardType} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm capitalize">
                        {rewardType.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-medium">
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quest Actions */}
            <div className="space-y-2">
              {selectedQuest.status === 'active' && (
                <>
                  <Button
                    className="w-full"
                    variant={trackedQuests.has(selectedQuest.id) ? 'secondary' : 'default'}
                    onClick={() => handleTrackQuest(selectedQuest)}
                  >
                    {trackedQuests.has(selectedQuest.id) ? (
                      <>
                        <EyeSlashIcon className="h-4 w-4 mr-2" />
                        Untrack Quest
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Track Quest
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                    onClick={() => handleAbandonQuest(selectedQuest)}
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Abandon Quest
                  </Button>
                </>
              )}
              {selectedQuest.status === 'completed' && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <TrophySolidIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Quest Completed!
                  </p>
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    <SparklesIcon className="h-3 w-3 inline mr-1" />
                    Achievement Unlocked
                  </div>
                </div>
              )}
              {selectedQuest.status === 'failed' && (
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <XCircleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Quest Failed
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      // TODO: Implement quest retry logic
                      console.log('Retrying quest:', selectedQuest.title);
                    }}
                  >
                    Retry Quest
                  </Button>
                </div>
              )}
            </div>

            {/* Metadata */}
            {selectedQuest.metadata && Object.keys(selectedQuest.metadata).length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-2">Additional Info</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(selectedQuest.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace('_', ' ')}
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  );
}

export default QuestsPanel;
