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

export function Sidebar({ collapsed, isMobile, onClose }: SidebarProps) {
  const { setActivePanel } = useGameStore();
  const activePanel = useActivePanel();

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

  const sidebarWidth = collapsed ? 'w-0' : 'w-64';
  const sidebarTransform = collapsed ? '-translate-x-full' : 'translate-x-0';

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out z-50',
          isMobile ? 'w-64' : sidebarWidth,
          isMobile ? sidebarTransform : ''
        )}
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

      {/* Spacer for non-mobile */}
      {!isMobile && (
        <div
          className={cn(
            'transition-all duration-300 ease-in-out flex-shrink-0',
            collapsed ? 'w-0' : 'w-64'
          )}
        />
      )}
    </>
  );
}

export default Sidebar;
