// Main Game Page - Session selection and game interface

'use client';

import React from 'react';
import { GameLayout } from '@/components/layout/GameLayout';
import { SessionManager } from '@/components/session/SessionManager';
import { useGameStore } from '@/stores/gameStore';
import { GameSession } from '@/types';

export default function Home() {
  const { currentSession, setCurrentSession } = useGameStore();

  const handleSessionSelect = (session: GameSession) => {
    setCurrentSession(session);
  };

  // If no session is active, show session manager
  if (!currentSession) {
    return (
      <GameLayout>
        <SessionManager onSessionSelect={handleSessionSelect} />
      </GameLayout>
    );
  }

  // If session is active, let MainContent handle panel navigation
  return <GameLayout />;
}
