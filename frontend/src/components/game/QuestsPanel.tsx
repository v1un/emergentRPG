// Quests Panel Component - Quest tracking system

'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentQuests, useCurrentSession } from '@/stores/gameStore';
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
  GiftIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
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

function QuestCompletionNotification({ quest, isVisible, onClose }: Readonly<QuestNotificationProps>) {
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
      <Card className="w-80 bg-gradient-accent/30 border-accent/20 backdrop-blur-sm glow-accent/30">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <TrophySolidIcon className="h-6 w-6 text-accent flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <h4 className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Quest Completed!
              </h4>
              <p className="text-sm text-accent mt-1">
                {quest.title}
              </p>
              {quest.rewards && Object.keys(quest.rewards).length > 0 && (
                <div className="mt-2 text-xs text-accent">
                  Rewards: {Object.entries(quest.rewards).map(([type, value]) =>
                    `${value} ${type}`
                  ).join(', ')}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-accent hover:text-primary"
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
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [filter, setFilter] = useState<QuestFilter>('all');
  const [trackedQuests, setTrackedQuests] = useState<Set<string>>(new Set());
  const [completionNotification, setCompletionNotification] = useState<Quest | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [dynamicContent, setDynamicContent] = useState<DynamicUIContent | null>(null);

  // Calculate quest objective progress
  const getObjectiveProgress = (quest: Quest): number => {
    if (!quest.objectives || quest.objectives.length === 0) return 0;
    if (quest.status === 'completed') return 100;
    if (quest.status === 'failed') return 0;
    
    // For now, return a simple progress based on quest status
    // In a real implementation, this would track individual objective completion
    return quest.status === 'active' ? 50 : 0;
  };

  // Load dynamic UI content
  useEffect(() => {
    const loadDynamicContent = async () => {
      try {
        const content = await dynamicUIService.getDynamicUIContent({
          character: currentSession?.character,
          session: currentSession || undefined,
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

  if (quests.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-gradient-story relative overflow-hidden">
        <div className="absolute inset-0 bg-magical-dots opacity-20 pointer-events-none"></div>
        <div className="floating-orb absolute top-10 right-10 w-4 h-4 bg-accent/30 rounded-full animate-float"></div>
        <div className="floating-orb absolute bottom-20 left-8 w-3 h-3 bg-primary/20 rounded-full animate-float-delayed"></div>
        <div className="text-center relative z-10">
          <ClipboardDocumentListIcon className="h-12 w-12 text-accent mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            {dynamicContent?.emptyStateTitle ?? 'No Quests Yet'}
          </h3>
          <p className="text-primary-foreground/80">
            {dynamicContent?.emptyStateMessage ?? 'Your quest log is empty. Start exploring to discover new adventures!'}
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
      <div className="h-full flex bg-gradient-story relative overflow-hidden">
        {/* Magical Background Effects */}
        <div className="absolute inset-0 bg-magical-dots opacity-20 pointer-events-none"></div>
        <div className="floating-orb absolute top-10 right-10 w-4 h-4 bg-accent/30 rounded-full animate-float"></div>
        <div className="floating-orb absolute bottom-20 left-8 w-3 h-3 bg-primary/20 rounded-full animate-float-delayed"></div>
        {/* Quest List */}
        <div className="flex-1 flex flex-col relative z-10">
          {/* Header with Stats */}
          <div className="p-6 border-b border-primary/20 bg-gradient-primary/30 backdrop-blur-sm glow-primary/30">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400 glow-blue">
                  {questCounts.active}
                </p>
                <p className="text-sm text-primary-foreground/70">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400 glow-green">
                  {questCounts.completed}
                </p>
                <p className="text-sm text-primary-foreground/70">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400 glow-red">
                  {questCounts.failed}
                </p>
                <p className="text-sm text-primary-foreground/70">Failed</p>
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
                  className={cn('capitalize', filter === filterType ? 'glow-accent' : '')}
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
                <p className="text-primary-foreground/70">
                  No {filter === 'all' ? '' : filter} quests found.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuests.map((quest) => (
                  <Card
                    key={quest.id}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:shadow-md relative bg-gradient-accent/20 border-accent/20 hover:glow-accent',
                      selectedQuest?.id === quest.id && 'ring-2 ring-accent',
                      trackedQuests.has(quest.id) && 'ring-1 ring-blue-300 dark:ring-blue-700'
                    )}
                    onClick={() => setSelectedQuest(quest)}
                  >
                    {/* Tracking indicator */}
                    {trackedQuests.has(quest.id) && (
                      <div className="absolute top-2 right-2">
                        <EyeIcon className="h-4 w-4 text-blue-400 animate-pulse" />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getQuestIcon(quest.status)}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate flex items-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                              {quest.title}
                              {trackedQuests.has(quest.id) && (
                                <StarSolidIcon className="h-4 w-4 text-yellow-400 ml-2 animate-pulse" />
                              )}
                            </CardTitle>
                            <p className="text-sm text-primary-foreground/80 mt-1 line-clamp-2">
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
                          <span className="text-primary-foreground/70">Objectives:</span>
                          <span className="ml-2 font-medium">
                            {quest.objectives.length} total
                          </span>
                        </div>
                        {/* Progress Bar */}
                        {quest.status === 'active' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-primary-foreground/70">Progress</span>
                              <span className="font-medium">{Math.round(getObjectiveProgress(quest))}%</span>
                            </div>
                            <div className="w-full bg-gradient-primary/10 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-accent to-primary h-2 rounded-full transition-all duration-300 glow-accent"
                                style={{ width: `${getObjectiveProgress(quest)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {quest.status === 'active' && quest.objectives.length > 0 && (
                          <div className="text-xs text-primary-foreground/70">
                            Current: {quest.objectives[0]}
                          </div>
                        )}
                        {/* Rewards Preview */}
                        {quest.rewards && Object.keys(quest.rewards).length > 0 && (
                          <div className="flex items-center text-xs text-primary-foreground/70">
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
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Quest Detail Sidebar */}
        {selectedQuest && (
          <div className="w-96 border-l border-accent/30 bg-gradient-accent/30 p-6 backdrop-blur-sm glow-accent/30 relative z-20">
            <div className="space-y-6">
              {/* Quest Header */}
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  {getQuestIcon(selectedQuest.status)}
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {selectedQuest.title}
                  </h3>
                </div>
                {getStatusBadge(selectedQuest.status)}
              </div>
              {/* Description */}
              <div>
                <h4 className="font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">Description</h4>
                <p className="text-sm text-primary-foreground/80 leading-relaxed">
                  {selectedQuest.description}
                </p>
              </div>
              {/* Objectives */}
              <div>
                <h4 className="font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
                  Objectives ({selectedQuest.objectives.length})
                </h4>
                <div className="space-y-2">
                  {selectedQuest.objectives.map((objective) => (
                    <div key={objective} className="flex items-start space-x-3">
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0',
                        selectedQuest.status === 'completed' 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-primary/30'
                      )}>
                        {selectedQuest.status === 'completed' && (
                          <CheckCircleIcon className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <p className={cn(
                        'text-sm flex-1',
                        selectedQuest.status === 'completed' 
                          ? 'text-primary-foreground/70 line-through' 
                          : 'text-primary-foreground'
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
                  <h4 className="font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3 flex items-center">
                    <GiftIcon className="h-4 w-4 mr-2" />
                    Rewards
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(selectedQuest.rewards).map(([rewardType, value]) => (
                      <div key={rewardType} className="flex justify-between items-center p-2 bg-gradient-primary/10 rounded border border-primary/10 hover:glow-primary transition-all duration-300">
                        <span className="text-sm capitalize text-primary-foreground/80">
                          {rewardType.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-medium text-primary-foreground">
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
                  <div className="text-center p-4 bg-gradient-primary/10 rounded-lg">
                    <TrophySolidIcon className="h-8 w-8 text-accent mx-auto mb-2 animate-pulse" />
                    <p className="text-sm font-medium text-accent">
                      Quest Completed!
                    </p>
                    <div className="mt-2 text-xs text-accent">
                      <SparklesIcon className="h-3 w-3 inline mr-1" />
                      Achievement Unlocked
                    </div>
                  </div>
                )}
                {selectedQuest.status === 'failed' && (
                  <div className="text-center p-4 bg-gradient-accent/10 rounded-lg">
                    <XCircleIcon className="h-8 w-8 text-red-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm font-medium text-red-400">
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
                  <h4 className="font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">Additional Info</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(selectedQuest.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-primary-foreground/70 capitalize">
                          {key.replace('_', ' ')}
                        </span>
                        <span className="font-medium text-primary-foreground">{String(value)}</span>
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
