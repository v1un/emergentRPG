// Header component with navigation and status indicators

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import {
  Bars3Icon,
  BellIcon,
  Cog6ToothIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { IconButton } from '@/components/ui/IconButton';
import { useGameStore } from '@/stores/gameStore';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { formatConnectionStatus } from '@/utils/helpers';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { 
    currentSession, 
    toggleSidebar
  } = useGameStore();
  const { connectionStatus } = useGameWebSocket();

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const connectionStatusInfo = formatConnectionStatus(connectionStatus);

  // Determine connection status dot classes
  let connectionDotClasses = 'h-2 w-2 rounded-full transition-all duration-300 ';
  if (connectionStatus === 'connected') {
    connectionDotClasses += 'bg-green-500 shadow-lg shadow-green-500/50';
  } else if (connectionStatus === 'connecting') {
    connectionDotClasses += 'bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50';
  } else {
    connectionDotClasses += 'bg-red-500 shadow-lg shadow-red-500/50';
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-primary/20 bg-gradient-to-r from-card/95 to-background/95 px-4 backdrop-blur-xl relative overflow-hidden">
      {/* Magical background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
      
      {/* Left Section */}
      <div className="flex items-center gap-4 relative z-10">
        <IconButton
          icon={<Bars3Icon className="h-5 w-5" />}
          onClick={toggleSidebar}
          variant="ghost"
          size="sm"
          className="hover:bg-primary/10 hover:glow-primary transition-all duration-300"
          aria-label="Toggle sidebar"
        />
        
        {currentSession && (
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {currentSession.character?.name || 'New Adventure'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Session: {currentSession.session_id.slice(0, 8)}...
            </p>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 relative z-10">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-primary/20">
          <div className={connectionDotClasses} />
          <span className={`text-xs ${connectionStatusInfo.className} font-medium`}>
            {connectionStatusInfo.text}
          </span>
        </div>

        {/* Theme Toggle */}
        <IconButton
          icon={theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          onClick={handleThemeToggle}
          variant="ghost"
          size="sm"
          className="hover:bg-primary/10 hover:glow-primary transition-all duration-300"
          aria-label="Toggle theme"
        />

        {/* Notifications */}
        <IconButton
          icon={<BellIcon className="h-5 w-5" />}
          variant="ghost"
          size="sm"
          className="hover:bg-accent/10 hover:glow-accent transition-all duration-300"
          aria-label="Notifications"
          badge={{ content: 1, variant: 'destructive' }}
        />

        {/* Settings */}
        <IconButton
          icon={<Cog6ToothIcon className="h-5 w-5" />}
          variant="ghost"
          size="sm"
          className="hover:bg-primary/10 hover:glow-primary transition-all duration-300"
          aria-label="Settings"
        />

        {/* User Profile */}
        <IconButton
          icon={<UserCircleIcon className="h-5 w-5" />}
          variant="ghost"
          size="sm"
          className="hover:bg-accent/10 hover:glow-accent transition-all duration-300"
          aria-label="User profile"
        />
      </div>
    </header>
  );
}