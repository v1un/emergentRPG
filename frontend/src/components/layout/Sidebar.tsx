// Sidebar navigation component

'use client';

import React from 'react';
import {
  BookOpenIcon,
  UserIcon,
  CubeIcon,
  MapIcon,
  DocumentTextIcon,
  SparklesIcon,
  FolderIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useGameStore } from '@/stores/gameStore';
import { PANELS } from '@/utils/constants';
import { cn } from '@/utils/helpers';
import { ActivePanel } from '@/types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  panel: ActivePanel;
}

const navItems: NavItem[] = [
  { id: 'story', label: 'Story', icon: BookOpenIcon, panel: PANELS.STORY as ActivePanel },
  { id: 'character', label: 'Character', icon: UserIcon, panel: PANELS.CHARACTER as ActivePanel },
  { id: 'inventory', label: 'Inventory', icon: CubeIcon, panel: PANELS.INVENTORY as ActivePanel },
  { id: 'world', label: 'World', icon: MapIcon, panel: PANELS.WORLD as ActivePanel },
  { id: 'quests', label: 'Quests', icon: DocumentTextIcon, panel: PANELS.QUESTS as ActivePanel },
  { id: 'ai-insights', label: 'AI Insights', icon: SparklesIcon, panel: PANELS.AI_INSIGHTS as ActivePanel },
  { id: 'sessions', label: 'Sessions', icon: FolderIcon, panel: PANELS.SESSIONS as ActivePanel },
];

export function Sidebar() {
  const { activePanel, setActivePanel, sidebarCollapsed, toggleSidebar } = useGameStore();

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-primary/20 bg-gradient-to-b from-card to-background/95 backdrop-blur-xl transition-all duration-300 relative overflow-hidden',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Magical background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
      
      {/* Logo/Title */}
      <div className={cn(
        "flex h-16 items-center border-b border-primary/20 relative z-10 transition-all duration-300",
        sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {!sidebarCollapsed && (
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            EmergentRPG
          </h2>
        )}
        <IconButton
          icon={sidebarCollapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
          onClick={toggleSidebar}
          variant="ghost"
          size="sm"
          className="hover:bg-primary/10 hover:glow-primary transition-all duration-300"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-3 relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.panel;

          return (
            <Button
              key={item.id}
              onClick={() => setActivePanel(item.panel)}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'w-full transition-all duration-300 group relative overflow-hidden',
                sidebarCollapsed 
                  ? 'justify-center px-0 h-12 w-12 mx-auto rounded-xl' 
                  : 'justify-start px-3 h-11 rounded-lg',
                isActive && 'bg-gradient-primary text-primary-foreground glow-primary shadow-lg',
                !isActive && 'hover:bg-primary/10 hover:text-primary hover:glow-primary/50',
                'border border-transparent hover:border-primary/20'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {/* Icon container with proper alignment */}
              <div className={cn(
                "flex items-center justify-center transition-all duration-300",
                sidebarCollapsed ? "w-6 h-6" : "w-5 h-5 flex-shrink-0"
              )}>
                <Icon className={cn(
                  "transition-all duration-300",
                  sidebarCollapsed ? "h-6 w-6" : "h-5 w-5",
                  isActive && "drop-shadow-lg"
                )} />
              </div>
              
              {/* Label with fade animation */}
              {!sidebarCollapsed && (
                <span className="ml-3 font-medium transition-all duration-300 group-hover:translate-x-1">
                  {item.label}
                </span>
              )}
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-lg"></div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-primary/20 p-4 relative z-10">
        {!sidebarCollapsed ? (
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Version 0.1.0
            </p>
            <p className="opacity-70">© 2024 EmergentRPG</p>
          </div>
        ) : (
          <div className="text-center text-xs text-muted-foreground">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center mx-auto glow-primary">
              <span className="text-xs font-bold text-primary-foreground">✨</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}