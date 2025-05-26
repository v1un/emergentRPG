import React, { useState } from 'react';
import './App.css';
import { 
  LandingPage, 
  GameInterface, 
  Navigation,
  ScenarioGeneratorPage,
  ConfigurationPage,
  LorebooksPage,
  ScenarioSelectionPage,
} from './components.js';
import { useGameState } from './hooks/useGameState.js';
import { ThemeProvider } from './contexts/ThemeProvider.js';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  
  // Use the new gameState hook instead of hardcoded state
  const {
    gameState,
    isLoading,
    error,
    initializeGame,
    handleAction,
    updateGameState,
  } = useGameState();

  const startGame = async (scenario) => {
    try {
      // Use the new initializeGame function from the hook
      const success = await initializeGame(scenario);
      
      if (success) {
        setCurrentView('game');
      } else {
        console.error('Failed to initialize game');
        // Still switch to game view with fallback data
        setCurrentView('game');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      setCurrentView('game');
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-dungeon-dark">
        <Navigation currentView={currentView} setCurrentView={setCurrentView} />
        
        {currentView === 'landing' && (
          <LandingPage onNavigateToScenarios={() => setCurrentView('scenarios')} />
        )}
        
        {currentView === 'scenarios' && (
          <ScenarioSelectionPage onStartGame={startGame} />
        )}
        
        {currentView === 'generator' && (
          <ScenarioGeneratorPage />
        )}
        
        {currentView === 'lorebooks' && (
          <LorebooksPage />
        )}
        
        {currentView === 'config' && (
          <ConfigurationPage />
        )}
        
        {currentView === 'game' && (
          <div className="h-[calc(100vh-72px)] overflow-hidden">
            <GameInterface 
              gameState={gameState}
              isLoading={isLoading}
              error={error}
              onAction={handleAction}
              onUpdateGameState={updateGameState}
            />
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
