// Footer Component

'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore, useConnectionStatus, useIsAIGenerating } from '@/stores/gameStore';
import { TypingIndicator } from '@/components/ui/Loading';
import { cn, formatConnectionStatus } from '@/utils/helpers';

export function Footer() {
  const connectionStatus = useConnectionStatus();
  const isAIGenerating = useIsAIGenerating();
  const { lastUpdate } = useGameStore();
  const [isClient, setIsClient] = useState(false);

  const connectionInfo = formatConnectionStatus(connectionStatus);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <footer className="h-12 bg-card border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 text-xs text-muted-foreground">
      {/* Left Section - AI Status */}
      <div className="flex items-center space-x-4">
        {isAIGenerating && (
          <TypingIndicator message="AI is generating response..." />
        )}
        {!isAIGenerating && (
          <span>Ready for your next action</span>
        )}
      </div>

      {/* Center Section - Last Update */}
      <div className="hidden md:block">
        {isClient && lastUpdate && (
          <span>
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Right Section - Connection Status */}
      <div className="flex items-center space-x-2">
        <div className={cn('w-2 h-2 rounded-full', {
          'bg-green-500': connectionStatus === 'connected',
          'bg-yellow-500': connectionStatus === 'connecting',
          'bg-red-500': connectionStatus === 'error',
          'bg-gray-400': connectionStatus === 'disconnected',
        })} />
        <span className={connectionInfo.className}>
          {connectionInfo.text}
        </span>
      </div>
    </footer>
  );
}

export default Footer;
