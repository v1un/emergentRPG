// Main Content Area Component

'use client';

import React from 'react';
import { useGameStore, useActivePanel, useCurrentSession } from '@/stores/gameStore';
import { LoadingState } from '@/components/ui/Loading';
import { PANELS } from '@/utils/constants';
import {
  LazyStoryPanel,
  LazyCharacterPanel,
  LazyInventoryPanel,
  LazyQuestsPanel,
  LazyWorldPanel,
  StoryPanelLoading,
  CharacterPanelLoading,
  InventoryPanelLoading,
  QuestsPanelLoading,
  WorldPanelLoading,
  LazyWrapper
} from '@/components/ui/LazyWrapper';
import { SessionsPanel } from '@/components/game/SessionsPanel';
import { AIInsightsGamePanel } from '@/components/game/AIInsightsGamePanel';

interface MainContentProps {
  children?: React.ReactNode;
}

export function MainContent({ children }: Readonly<MainContentProps>) {
  const activePanel = useActivePanel();
  const currentSession = useCurrentSession();
  const { isLoadingSession, lastError } = useGameStore();

  // If children are provided (from pages), render them instead of panels
  if (children) {
    return (
      <div className="flex-1 overflow-hidden">
        <LoadingState
          isLoading={isLoadingSession}
          message="Loading game session..."
        >
          {children}
        </LoadingState>
      </div>
    );
  }

  // If no session is loaded and we're not on the sessions panel, show welcome message
  if (!currentSession && !isLoadingSession && activePanel !== PANELS.SESSIONS) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Welcome to emergentRPG</h2>
          <p className="text-muted-foreground max-w-md">
            Start your AI-driven storytelling adventure by creating a new game session or loading an existing one.
          </p>
          <div className="space-y-2">
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors">
              Create New Session
            </button>
            <br />
            <button className="text-primary hover:text-primary/80 transition-colors">
              Load Existing Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (lastError && !isLoadingSession) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md">{lastError}</p>
          <button 
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render the appropriate panel based on activePanel with lazy loading
  const renderPanel = () => {
    switch (activePanel) {
      case PANELS.SESSIONS:
        return <SessionsPanel />;
      case PANELS.STORY:
        return (
          <LazyWrapper fallback={<StoryPanelLoading />}>
            <LazyStoryPanel />
          </LazyWrapper>
        );
      case PANELS.CHARACTER:
        return (
          <LazyWrapper fallback={<CharacterPanelLoading />}>
            <LazyCharacterPanel />
          </LazyWrapper>
        );
      case PANELS.INVENTORY:
        return (
          <LazyWrapper fallback={<InventoryPanelLoading />}>
            <LazyInventoryPanel />
          </LazyWrapper>
        );
      case PANELS.QUESTS:
        return (
          <LazyWrapper fallback={<QuestsPanelLoading />}>
            <LazyQuestsPanel />
          </LazyWrapper>
        );
      case PANELS.WORLD:
        return (
          <LazyWrapper fallback={<WorldPanelLoading />}>
            <LazyWorldPanel />
          </LazyWrapper>
        );
      case PANELS.AI_INSIGHTS:
        return <AIInsightsGamePanel variant="modal" className="h-full" />;
      default:
        return (
          <LazyWrapper fallback={<StoryPanelLoading />}>
            <LazyStoryPanel />
          </LazyWrapper>
        ); // Default to story panel
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <LoadingState
        isLoading={isLoadingSession}
        message="Loading game session..."
      >
        <div className="h-full flex flex-col">
          {/* Panel Header */}
          <div className="border-b border-gray-200 dark:border-gray-800 bg-card/50 px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {activePanel.replace('_', ' ')}
            </h2>
            {currentSession && activePanel !== PANELS.SESSIONS && (
              <p className="text-sm text-muted-foreground">
                {currentSession.character.name} in {currentSession.world_state.current_location}
              </p>
            )}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {renderPanel()}
          </div>
        </div>
      </LoadingState>
    </div>
  );
}

export default MainContent;
