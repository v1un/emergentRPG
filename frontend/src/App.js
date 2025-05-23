import React, { useState } from 'react';
import './App.css';
import { 
  LandingPage, 
  GameInterface, 
  Navigation 
} from './components';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [gameState, setGameState] = useState({
    character: {
      name: 'Adventurer',
      level: 1,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      experience: 0,
      stats: {
        strength: 12,
        dexterity: 10,
        intelligence: 14,
        constitution: 13,
        wisdom: 11,
        charisma: 9
      }
    },
    inventory: [
      { id: 1, name: 'Iron Sword', type: 'weapon', rarity: 'common', equipped: true },
      { id: 2, name: 'Health Potion', type: 'consumable', rarity: 'common', quantity: 3 },
      { id: 3, name: 'Leather Armor', type: 'armor', rarity: 'common', equipped: true },
    ],
    quests: [
      { id: 1, title: 'The Mysterious Cave', description: 'Investigate the strange sounds coming from the cave entrance.', status: 'active', progress: '1/3' },
      { id: 2, title: 'Gather Herbs', description: 'Collect 5 medicinal herbs for the village healer.', status: 'active', progress: '2/5' },
      { id: 3, title: 'Defeat the Goblin Chief', description: 'Eliminate the goblin threat to the village.', status: 'completed', progress: '1/1' },
    ],
    story: [
      { type: 'narration', text: 'You stand at the edge of a dark forest, the wind whispering ancient secrets through the trees. Your adventure begins here...' },
      { type: 'action', text: 'I examine the forest entrance carefully.' },
      { type: 'narration', text: 'As you peer into the shadows between the towering oaks, you notice strange markings carved into the bark. They seem to glow faintly with an otherworldly light...' },
    ]
  });

  const startGame = (scenario) => {
    setCurrentView('game');
    // Initialize game based on selected scenario
    setGameState(prev => ({
      ...prev,
      scenario: scenario,
      story: [
        { type: 'narration', text: scenario.intro }
      ]
    }));
  };

  const handleAction = (action) => {
    // Mock AI response for demo
    const responses = [
      "The shadows seem to respond to your presence, shifting and moving as if alive.",
      "A mysterious figure emerges from behind the trees, offering you a cryptic warning.",
      "You discover a hidden pathway leading deeper into the unknown.",
      "The ground beneath your feet begins to glow with ancient runes.",
      "A gentle breeze carries the scent of magic and distant adventures."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    setGameState(prev => ({
      ...prev,
      story: [
        ...prev.story,
        { type: 'action', text: action },
        { type: 'narration', text: randomResponse }
      ]
    }));
  };

  return (
    <div className="min-h-screen bg-dungeon-dark">
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      
      {currentView === 'landing' && (
        <LandingPage onStartGame={startGame} />
      )}
      
      {currentView === 'game' && (
        <GameInterface 
          gameState={gameState} 
          setGameState={setGameState}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

export default App;