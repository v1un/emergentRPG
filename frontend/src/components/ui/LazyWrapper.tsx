// Lazy Loading Wrapper Component - Code splitting and performance optimization

'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/Loading';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function LazyWrapper({ 
  children, 
  fallback = <LoadingSpinner />,
  errorFallback 
}: LazyWrapperProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  loadingComponent?: React.ReactNode,
  errorComponent?: React.ReactNode
) {
  return function LazyComponent(props: P) {
    return (
      <LazyWrapper 
        fallback={loadingComponent} 
        errorFallback={errorComponent}
      >
        <Component {...props} />
      </LazyWrapper>
    );
  };
}

// Lazy load game components with optimized loading states
export const LazyCharacterPanel = lazy(() => 
  import('@/components/game/CharacterPanel').then(module => ({
    default: module.CharacterPanel
  }))
);

export const LazyInventoryPanel = lazy(() => 
  import('@/components/game/InventoryPanel').then(module => ({
    default: module.InventoryPanel
  }))
);

export const LazyQuestsPanel = lazy(() => 
  import('@/components/game/QuestsPanel').then(module => ({
    default: module.QuestsPanel
  }))
);

export const LazyWorldPanel = lazy(() => 
  import('@/components/game/WorldPanel').then(module => ({
    default: module.WorldPanel
  }))
);

export const LazyStoryPanel = lazy(() => 
  import('@/components/game/StoryPanel').then(module => ({
    default: module.StoryPanel
  }))
);

// Preload components for better UX
export const preloadGameComponents = () => {
  // Preload all game components
  import('@/components/game/CharacterPanel');
  import('@/components/game/InventoryPanel');
  import('@/components/game/QuestsPanel');
  import('@/components/game/WorldPanel');
  import('@/components/game/StoryPanel');
};

// Component-specific loading states
export const CharacterPanelLoading = () => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner />
      <p className="text-sm text-muted-foreground mt-2">Loading character data...</p>
    </div>
  </div>
);

export const InventoryPanelLoading = () => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner />
      <p className="text-sm text-muted-foreground mt-2">Loading inventory...</p>
    </div>
  </div>
);

export const QuestsPanelLoading = () => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner />
      <p className="text-sm text-muted-foreground mt-2">Loading quests...</p>
    </div>
  </div>
);

export const WorldPanelLoading = () => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner />
      <p className="text-sm text-muted-foreground mt-2">Loading world data...</p>
    </div>
  </div>
);

export const StoryPanelLoading = () => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner />
      <p className="text-sm text-muted-foreground mt-2">Loading story...</p>
    </div>
  </div>
);

export default LazyWrapper;
