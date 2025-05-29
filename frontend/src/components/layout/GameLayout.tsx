// Main Game Layout Component

'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SkipToContent } from '@/components/ui/Accessibility';
import { preloadGameComponents } from '@/components/ui/LazyWrapper';
import { announceToScreenReader } from '@/utils/accessibility';

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
  // Note: useReducedMotion available if needed for animations

  // Preload game components for better performance
  useEffect(() => {
    preloadGameComponents();
  }, []);

  // Handle responsive behavior with improved breakpoints
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
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

          {/* Main Layout Container - Fixed height with flex layout */}
          <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            {/* Sidebar */}
            <ErrorBoundary>
              <Sidebar
                collapsed={sidebarCollapsed}
                isMobile={isMobile}
                onClose={() => setSidebarCollapsed(true)}
              />
            </ErrorBoundary>

            {/* Main Content Area - Flex-based layout */}
            <main
              id="main-content"
              className="flex-1 flex flex-col overflow-hidden"
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
        </div>
      </WebSocketManager>
    </ErrorBoundary>
  );
}

export default GameLayout;
