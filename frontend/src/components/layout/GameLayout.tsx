// Main game layout component

'use client';

import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { WebSocketManager } from '@/components/game/WebSocketManager';
import { PerformanceMonitor } from '@/components/ui/PerformanceMonitor';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface GameLayoutProps {
  children?: React.ReactNode;
}

export function GameLayout({ children }: Readonly<GameLayoutProps>) {

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-hidden">
        {/* WebSocket Manager */}
        <WebSocketManager />

        {/* Performance Monitor (dev only) */}
        {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header />

          {/* Main Content */}
          <main className="flex-1 overflow-hidden relative">
            {/* Magical background effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-accent/3 pointer-events-none"></div>
            <div className="relative z-10 h-full">
              {children || <MainContent />}
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}