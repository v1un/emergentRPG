// Main Game Layout Component

'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/helpers';
import { DEFAULT_VALUES } from '@/utils/constants';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SkipToContent, useReducedMotion } from '@/components/ui/Accessibility';
import { preloadGameComponents } from '@/components/ui/LazyWrapper';
import { announceToScreenReader, handleKeyboardNavigation } from '@/utils/accessibility';

// Import layout components
import Header from './Header';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Footer from './Footer';
import { WebSocketManager } from '@/components/game/WebSocketManager';

interface GameLayoutProps {
  children: React.ReactNode;
}

export function GameLayout({ children }: Readonly<GameLayoutProps>) {
  const { sidebarCollapsed, setSidebarCollapsed } = useGameStore();
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Preload game components for better performance
  useEffect(() => {
    preloadGameComponents();
  }, []);

  // Handle responsive behavior with improved breakpoints
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);

      // Auto-collapse sidebar on mobile and small tablets
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }

      // Auto-expand sidebar on desktop if it was auto-collapsed
      if (window.innerWidth >= 1024 && sidebarCollapsed) {
        // Only auto-expand if it was collapsed due to mobile view
        const wasAutoCollapsed = localStorage.getItem('sidebar-auto-collapsed') === 'true';
        if (wasAutoCollapsed) {
          setSidebarCollapsed(false);
          localStorage.removeItem('sidebar-auto-collapsed');
        }
      }

      // Remember if sidebar was auto-collapsed for mobile
      if (mobile && !sidebarCollapsed) {
        localStorage.setItem('sidebar-auto-collapsed', 'true');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  // Announce layout changes to screen readers
  useEffect(() => {
    if (sidebarCollapsed) {
      announceToScreenReader('Sidebar collapsed');
    } else {
      announceToScreenReader('Sidebar expanded');
    }
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    handleKeyboardNavigation(e, {
      onEscape: () => setSidebarCollapsed(true),
      onEnter: () => setSidebarCollapsed(true),
      onSpace: () => setSidebarCollapsed(true),
    });
  };

  return (
    <ErrorBoundary>
      <WebSocketManager>
        <div className="min-h-screen bg-background text-foreground">
          {/* Skip to content for accessibility */}
          <SkipToContent targetId="main-content" />

          {/* Header */}
          <ErrorBoundary>
            <Header
              onToggleSidebar={toggleSidebar}
              sidebarCollapsed={sidebarCollapsed}
              isMobile={isMobile}
            />
          </ErrorBoundary>

          <div className="flex h-[calc(100vh-4rem)]">
            {/* Sidebar */}
            <ErrorBoundary>
              <Sidebar
                collapsed={sidebarCollapsed}
                isMobile={isMobile}
                onClose={() => setSidebarCollapsed(true)}
              />
            </ErrorBoundary>

            {/* Main Content Area */}
            <main
              id="main-content"
              className={cn(
                'flex-1 flex flex-col transition-all duration-300 ease-in-out',
                sidebarCollapsed ? 'ml-0' : `ml-${DEFAULT_VALUES.SIDEBAR_WIDTH}px`,
                isMobile && 'ml-0'
              )}
              role="main"
              aria-label="Game content"
            >
              <ErrorBoundary>
                <MainContent>
                  {children}
                </MainContent>
              </ErrorBoundary>

              {/* Footer */}
              <ErrorBoundary>
                <Footer />
              </ErrorBoundary>
            </main>
          </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && !sidebarCollapsed && (
          <button
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden border-none cursor-pointer"
            onClick={() => setSidebarCollapsed(true)}
            onKeyDown={handleOverlayKeyDown}
            aria-label="Close sidebar overlay"
            type="button"
          />
        )}
        </div>
      </WebSocketManager>
    </ErrorBoundary>
  );
}

export default GameLayout;
