// Header Component with Navigation and Controls

'use client';

import React from 'react';
import { useGameStore, useConnectionStatus, useCurrentSession } from '@/stores/gameStore';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { cn, formatConnectionStatus } from '@/utils/helpers';
import { 
  Bars3Icon, 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  isMobile: boolean;
}

export function Header({ onToggleSidebar, sidebarCollapsed, isMobile }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const connectionStatus = useConnectionStatus();
  const currentSession = useCurrentSession();
  const { clearError, lastError } = useGameStore();

  const connectionInfo = formatConnectionStatus(connectionStatus);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="h-4 w-4" />;
      case 'dark':
        return <MoonIcon className="h-4 w-4" />;
      default:
        return <ComputerDesktopIcon className="h-4 w-4" />;
    }
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <WifiIcon className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <WifiIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <header className="h-16 bg-gradient-story border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 z-50 backdrop-blur-md glass">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden hover:bg-primary/10 transition-all duration-200"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-5 w-5" />
        </Button>

        {/* Enhanced Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center glow-primary">
            <span className="text-primary-foreground font-bold text-sm">eR</span>
            <div className="absolute inset-0 bg-gradient-primary rounded-xl opacity-50 animate-pulse-glow"></div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              emergentRPG
            </h1>
            {currentSession && (
              <p className="text-xs text-muted-foreground font-medium">
                <span className="text-accent">{currentSession.character.name}</span> - Level {currentSession.character.level}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Center Section - Session Info */}
      <div className="hidden md:flex items-center space-x-4">
        {currentSession && (
          <div className="text-center px-4 py-2 bg-gradient-secondary rounded-lg border border-gray-200/50 dark:border-gray-800/50">
            <p className="text-sm font-semibold text-foreground">
              {currentSession.character.name}
            </p>
            <p className="text-xs text-muted-foreground">
              📍 {currentSession.world_state.current_location}
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Right Section */}
      <div className="flex items-center space-x-3">
        {/* Enhanced Connection Status */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-secondary rounded-full border border-gray-200/50 dark:border-gray-800/50">
          {getConnectionIcon()}
          <span className={cn('text-xs hidden sm:inline font-medium', connectionInfo.className)}>
            {connectionInfo.text}
          </span>
        </div>

        {/* Enhanced Error Indicator */}
        {lastError && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-all duration-200"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Error</span>
          </Button>
        )}

        {/* Enhanced Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          className="hover:bg-primary/10 transition-all duration-200 hover:glow-primary"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light'} theme`}
        >
          {getThemeIcon()}
        </Button>

        {/* Enhanced User Menu */}
        <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center border border-gray-200/50 dark:border-gray-800/50 hover:glow-accent transition-all duration-200 cursor-pointer">
          <span className="text-xs font-bold text-accent-foreground">U</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
