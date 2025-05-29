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

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-card border-r border-gray-200 dark:border-gray-800',
          'transition-all duration-300 ease-in-out flex-shrink-0',
          'flex flex-col h-full',
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
        <div className="flex flex-col h-full">
          {/* Mobile Close Button */}
          {isMobile && (
            <div className="flex justify-end p-4 border-b border-gray-200 dark:border-gray-800">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close sidebar"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.panel ? activePanel === item.panel : false;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start h-10 px-3 transition-all duration-200',
                    isActive && 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-l-4 border-blue-500',
                    !isActive && 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  )}
                  onClick={() => handleNavClick(item)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn(
                    'h-5 w-5 mr-3 flex-shrink-0 transition-colors duration-200',
                    isActive && 'text-blue-600 dark:text-blue-400'
                  )} />
                  <span className="truncate font-medium">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      'ml-auto text-xs px-2 py-1 rounded-full transition-colors duration-200',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-primary text-primary-foreground'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>emergentRPG v1.0.0</p>
              <p>AI-Driven Storytelling</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
