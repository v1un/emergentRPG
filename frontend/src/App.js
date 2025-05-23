import React, { useState } from 'react';
import './App.css';
import { 
  LandingPage, 
  GameInterface, 
  Navigation,
  ScenarioGeneratorPage,
  ConfigurationPage,
  LorebooksPage
} from './components';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [gameState, setGameState] = useState({
    session_id: null,
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

  const startGame = async (scenario) => {
    try {
      // Create game session with backend
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/game/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario_template_id: scenario.id,
          lorebook_id: scenario.lorebook_id,
          character_name: scenario.character ? scenario.character.name : 'Adventurer',
          scenario_type: 'fantasy'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Switch to game view
        setCurrentView('game');
        
        // Initialize game state with backend response
        setGameState(prev => ({
          ...prev,
          session_id: result.session_id,
          character: result.character,
          world_state: result.world_state,
          scenario: scenario,
          story: result.story.length > 0 ? result.story : [
            { type: 'narration', text: scenario.intro || `Welcome to the world of ${scenario.title}. Your adventure begins now...` }
          ]
        }));
      } else {
        throw new Error('Failed to create game session');
      }
    } catch (error) {
      console.error('Error creating game session:', error);
      
      // Fallback to local game state
      setCurrentView('game');
      
      // Use character from scenario if available
      const defaultCharacter = {
        name: 'Adventurer',
        level: 1,
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        experience: 0,
        stats: {
          strength: 10,
          dexterity: 10,
          intelligence: 10,
          constitution: 10,
          wisdom: 10,
          charisma: 10
        },
        class_name: 'Adventurer',
        background: 'A mysterious adventurer'
      };
      
      const character = scenario.character ? {
        name: scenario.character.name,
        level: scenario.character.level || 1,
        health: scenario.character.health || 100,
        maxHealth: scenario.character.max_health || 100,
        mana: scenario.character.mana || 50,
        maxMana: scenario.character.max_mana || 50,
        experience: scenario.character.experience || 0,
        stats: scenario.character.stats || defaultCharacter.stats,
        class_name: scenario.character.class_name || 'Adventurer',
        background: scenario.character.background || 'A mysterious adventurer'
      } : defaultCharacter;
      
      setGameState(prev => ({
        ...prev,
        session_id: `local_${Date.now()}`,
        scenario: scenario,
        character: character,
        story: [
          { type: 'narration', text: scenario.intro || `Welcome to the world of ${scenario.title}. Your adventure begins now...` }
        ]
      }));
    }
  };

  const handleAction = async (action) => {
    // Call backend API for AI response
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/game/sessions/${gameState.session_id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setGameState(result.updated_session);
        } else {
          // Handle error with fallback
          setGameState(prev => ({
            ...prev,
            story: [
              ...prev.story,
              { type: 'action', text: action },
              { type: 'narration', text: result.fallback_response || "Something unexpected happened. Please try again." }
            ]
          }));
        }
      } else {
        throw new Error('Failed to get response from server');
      }
    } catch (error) {
      console.error('Error calling backend:', error);
      
      // Fallback to enhanced local AI responses
      const responses = {
        attack: [
          "Your weapon strikes true, but the enemy counters with unexpected skill.",
          "The clash of steel echoes through the area as you engage in combat.",
          "Your attack lands, but your opponent seems unfazed by the blow.",
          "You strike with precision, gaining the upper hand in this battle.",
          "The enemy dodges your attack and retaliates with a swift counter-strike."
        ],
        defend: [
          "You raise your guard just in time, deflecting the incoming attack.",
          "Your defensive stance proves effective against the enemy's assault.",
          "You successfully block the attack, creating an opening for a counter.",
          "Your careful defense allows you to study your opponent's patterns.",
          "You weather the storm of attacks, waiting for the perfect moment to strike back."
        ],
        look: [
          "You notice ancient runes carved into the nearby surfaces, glowing faintly with magic.",
          "The area reveals hidden details that weren't visible before.",
          "Your careful observation reveals a secret passage behind the stone wall.",
          "Strange shadows dance at the edge of your vision, hinting at hidden dangers.",
          "You spot something glinting in the distance that might be valuable."
        ],
        spell: [
          "Your spell crackles with energy, illuminating the dark surroundings.",
          "Magical energy surges through you as the spell takes effect.",
          "The incantation echoes through the air, causing reality to shimmer.",
          "Your magic weaves through the air, creating unexpected effects.",
          "The spell succeeds, but you sense something responding to your magical energy."
        ],
        general: [
          "The wind whispers secrets of ancient times as you continue your journey.",
          "A mysterious figure watches you from the shadows before disappearing.",
          "You discover clues that hint at a larger mystery unfolding around you.",
          "The ground beneath your feet tells a story of countless adventures before yours.",
          "Something in the distance catches your attention, beckoning you forward.",
          "The air shimmers with possibility as new paths reveal themselves.",
          "You sense that your actions have set greater events into motion.",
          "The world around you seems to respond to your presence in subtle ways."
        ]
      };
      
      // Determine response category based on action
      let category = 'general';
      const actionLower = action.toLowerCase();
      
      if (actionLower.includes('attack') || actionLower.includes('strike') || actionLower.includes('fight')) {
        category = 'attack';
      } else if (actionLower.includes('defend') || actionLower.includes('block') || actionLower.includes('guard')) {
        category = 'defend';
      } else if (actionLower.includes('look') || actionLower.includes('examine') || actionLower.includes('search')) {
        category = 'look';
      } else if (actionLower.includes('cast') || actionLower.includes('spell') || actionLower.includes('magic')) {
        category = 'spell';
      }
      
      // Get a random response from the appropriate category
      const categoryResponses = responses[category];
      const randomResponse = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
      
      setGameState(prev => ({
        ...prev,
        story: [
          ...prev.story,
          { type: 'action', text: action },
          { type: 'narration', text: randomResponse }
        ]
      }));
    }
  };

  return (
    <div className="min-h-screen bg-dungeon-dark">
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      
      {currentView === 'landing' && (
        <LandingPage onStartGame={startGame} />
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
            setGameState={setGameState}
            onAction={handleAction}
          />
        </div>
      )}
    </div>
  );
}

export default App;
