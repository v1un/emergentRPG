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
    <header className="h-16 bg-card border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 z-50">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-5 w-5" />
        </Button>

        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">eR</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-foreground">emergentRPG</h1>
            {currentSession && (
              <p className="text-xs text-muted-foreground">
                {currentSession.character.name} - Level {currentSession.character.level}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Center Section - Session Info */}
      <div className="hidden md:flex items-center space-x-4">
        {currentSession && (
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {currentSession.character.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentSession.world_state.current_location}
            </p>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {getConnectionIcon()}
          <span className={cn('text-xs hidden sm:inline', connectionInfo.className)}>
            {connectionInfo.text}
          </span>
        </div>

        {/* Error Indicator */}
        {lastError && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="text-red-500 hover:text-red-600"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Error</span>
          </Button>
        )}

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light'} theme`}
        >
          {getThemeIcon()}
        </Button>

        {/* User Menu (Future Implementation) */}
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">U</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
