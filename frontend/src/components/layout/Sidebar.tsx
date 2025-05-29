// Sidebar Navigation Component

'use client';

import React from 'react';
import { useGameStore, useActivePanel } from '@/stores/gameStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/helpers';
import { PANELS } from '@/utils/constants';
import {
  BookOpenIcon,
  UserIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  HomeIcon,
  XMarkIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  collapsed: boolean;
  isMobile: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  panel?: string;
  href?: string;
  badge?: string | number;
}

export function Sidebar({ collapsed, isMobile, onClose }: Readonly<SidebarProps>) {
  const { setActivePanel } = useGameStore();
  const activePanel = useActivePanel();

  // Touch handling for mobile swipe-to-close
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  // Prevent body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (isMobile && !collapsed) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isMobile, collapsed]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;

    if (isLeftSwipe && isMobile) {
      onClose();
    }
  };

  const navItems: NavItem[] = [
    {
      id: 'sessions',
      label: 'Sessions',
      icon: HomeIcon,
      panel: PANELS.SESSIONS,
    },
    {
      id: 'story',
      label: 'Story',
      icon: BookOpenIcon,
      panel: PANELS.STORY,
    },
    {
      id: 'character',
      label: 'Character',
      icon: UserIcon,
      panel: PANELS.CHARACTER,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: ShoppingBagIcon,
      panel: PANELS.INVENTORY,
    },
    {
      id: 'quests',
      label: 'Quests',
      icon: ClipboardDocumentListIcon,
      panel: PANELS.QUESTS,
    },
    {
      id: 'world',
      label: 'World',
      icon: GlobeAltIcon,
      panel: PANELS.WORLD,
    },
    {
      id: 'ai_insights',
      label: 'AI Insights',
      icon: CpuChipIcon,
      panel: PANELS.AI_INSIGHTS,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Cog6ToothIcon,
      href: '/settings',
    },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.panel) {
      setActivePanel(item.panel as any);
    }

    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Enhanced Magical Sidebar */}
      <aside
        className={cn(
          'bg-gradient-story border-r border-gray-200 dark:border-gray-800 backdrop-blur-md glass',
          'transition-all duration-300 ease-in-out flex-shrink-0',
          'flex flex-col h-full relative',
          // Desktop: use width transitions
          !isMobile && (collapsed ? 'w-0 overflow-hidden' : 'w-64'),
          // Mobile: use absolute positioning with full width
          isMobile && (collapsed
            ? 'absolute -left-64 w-64 z-50'
            : 'absolute left-0 w-64 z-50'
          )
        )}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {/* Magical background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
        <div className="flex flex-col h-full">
          {/* Enhanced Mobile Close Button */}
          {isMobile && (
            <div className="flex justify-end p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-secondary/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-primary/10 transition-all duration-200"
                aria-label="Close sidebar"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Enhanced Navigation */}
          <nav className="flex-1 p-4 space-y-2 relative z-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.panel ? activePanel === item.panel : false;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start h-12 px-4 transition-all duration-300 group relative overflow-hidden',
                    isActive && 'bg-gradient-primary text-primary-foreground border-l-4 border-accent glow-primary',
                    !isActive && 'hover:bg-primary/10 hover:text-primary hover:border-l-2 hover:border-primary/50'
                  )}
                  onClick={() => handleNavClick(item)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Magical hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <Icon className={cn(
                    'h-5 w-5 mr-3 flex-shrink-0 transition-all duration-300 relative z-10',
                    isActive && 'text-primary-foreground animate-float',
                    !isActive && 'group-hover:text-primary group-hover:scale-110'
                  )} />
                  <span className={cn(
                    'truncate font-semibold relative z-10 transition-all duration-300',
                    isActive && 'text-primary-foreground',
                    !isActive && 'group-hover:text-primary'
                  )}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={cn(
                      'ml-auto text-xs px-2 py-1 rounded-full transition-all duration-300 relative z-10',
                      isActive
                        ? 'bg-accent text-accent-foreground glow-accent'
                        : 'bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Enhanced Magical Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gradient-secondary/30 relative z-10">
            <div className="text-xs text-muted-foreground space-y-1 text-center">
              <p className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                emergentRPG v1.0.0
              </p>
              <p className="italic">✨ AI-Driven Storytelling ✨</p>
              <div className="flex justify-center space-x-1 mt-2">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
