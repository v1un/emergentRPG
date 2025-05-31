// Main Game Page - Session selection and game interface

'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GameLayout } from '@/components/layout/GameLayout';
import { SessionManager } from '@/components/session/SessionManager';
import { useGameStore } from '@/stores/gameStore';
import { gameAPI } from '@/services/api/client';
import { QUERY_KEYS, PANELS } from '@/utils/constants';
import { GameSession } from '@/types';

export default function Home() {
  const { currentSession, setCurrentSession, setActivePanel } = useGameStore();

  // Fetch available sessions
  const { data: sessionsData } = useQuery({
    queryKey: QUERY_KEYS.SESSIONS,
    queryFn: () => gameAPI.getSessions(),
  });

  // Auto-select the first session if none is selected and sessions are available
  useEffect(() => {
    const autoLoadSession = async () => {
      if (!currentSession && sessionsData?.sessions && sessionsData.sessions.length > 0) {
        const firstSession = sessionsData.sessions[0];
        console.log('Auto-selecting first available session:', firstSession.session_id);

        try {
          // Fetch the full session data
          const sessionData = await gameAPI.getSession(firstSession.session_id);
          setCurrentSession(sessionData.session);
          setActivePanel(PANELS.STORY); // Set to story panel when auto-loading a session
        } catch (error) {
          console.error('Failed to auto-load session:', error);
          // Don't set current session if loading fails
        }
      }
    };

    autoLoadSession();
  }, [currentSession, sessionsData, setCurrentSession, setActivePanel]);

  const handleSessionSelect = (session: GameSession) => {
    setCurrentSession(session);
    setActivePanel(PANELS.STORY); // Switch to story panel when selecting a session
  };

  // If no session is active, show session manager
  if (!currentSession) {
    return (
      <GameLayout>
        <SessionManager onSessionSelect={handleSessionSelect} />
      </GameLayout>
    );
  }

  // If session is active, render GameLayout with null children so MainContent handles panel navigation
  return (
    <GameLayout>
      {null}
    </GameLayout>
  );
}
