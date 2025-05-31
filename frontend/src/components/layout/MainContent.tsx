// Main content area that renders different panels based on active selection

'use client';

import React, { Suspense } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { PANELS } from '@/utils/constants';
import { LoadingSpinner } from '@/components/ui/Loading';
import { LazyWrapper } from '@/components/ui/LazyWrapper';

// Lazy load panels for better performance
const StoryPanel = React.lazy(() => import('@/components/game/StoryPanel'));
const CharacterPanel = React.lazy(() => import('@/components/game/CharacterPanel'));
const InventoryPanel = React.lazy(() => import('@/components/game/InventoryPanel'));
const WorldPanel = React.lazy(() => import('@/components/game/WorldPanel'));
const QuestsPanel = React.lazy(() => import('@/components/game/QuestsPanel'));
const AIInsightsGamePanel = React.lazy(() => import('@/components/game/AIInsightsGamePanel'));
const SessionsPanel = React.lazy(() => import('@/components/game/SessionsPanel'));

export function MainContent() {
  const { activePanel } = useGameStore();

  const renderPanel = () => {
    switch (activePanel) {
      case PANELS.STORY:
        return (
          <LazyWrapper>
            <StoryPanel />
          </LazyWrapper>
        );
      case PANELS.CHARACTER:
        return (
          <LazyWrapper>
            <CharacterPanel />
          </LazyWrapper>
        );
      case PANELS.INVENTORY:
        return (
          <LazyWrapper>
            <InventoryPanel />
          </LazyWrapper>
        );
      case PANELS.WORLD:
        return (
          <LazyWrapper>
            <WorldPanel />
          </LazyWrapper>
        );
      case PANELS.QUESTS:
        return (
          <LazyWrapper>
            <QuestsPanel />
          </LazyWrapper>
        );
      case PANELS.AI_INSIGHTS:
        return (
          <LazyWrapper>
            <AIInsightsGamePanel />
          </LazyWrapper>
        );
      case PANELS.SESSIONS:
        return (
          <LazyWrapper>
            <SessionsPanel />
          </LazyWrapper>
        );
      default:
        return (
          <div className="flex h-full items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 glow-primary animate-float">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
                Choose Your Adventure
              </h3>
              <p className="text-muted-foreground">
                Select a panel from the sidebar to begin your magical journey
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full overflow-hidden bg-gradient-story relative">
      {/* Magical background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
      
      <Suspense fallback={
        <div className="flex h-full items-center justify-center relative z-10">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading magical content...</p>
          </div>
        </div>
      }>
        <div className="relative z-10 h-full">
          {renderPanel()}
        </div>
      </Suspense>
    </div>
  );
}