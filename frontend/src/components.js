import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Sword, 
  Shield, 
  Wand2, 
  Heart, 
  Star, 
  Backpack, 
  ScrollText, 
  Play, 
  Send,
  Menu,
  User,
  Home,
  Settings,
  Zap,
  Download,
  Check,
  X,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
} from 'lucide-react';

// Navigation Component
export const Navigation = ({ currentView, setCurrentView }) => {
  return (
    <nav className="bg-dungeon-darker border-b border-slate-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-fantasy font-bold text-dungeon-orange">
            AI DUNGEON
          </h1>
          <div className="hidden md:flex space-x-6">
            <button 
              onClick={() => setCurrentView('landing')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'landing' 
                  ? 'bg-dungeon-orange text-dungeon-dark' 
                  : 'text-dungeon-text-secondary hover:text-dungeon-text'
              }`}
            >
              <Home size={18} />
              <span>Home</span>
            </button>
            <button 
              onClick={() => setCurrentView('generator')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'generator' 
                  ? 'bg-dungeon-orange text-dungeon-dark' 
                  : 'text-dungeon-text-secondary hover:text-dungeon-text'
              }`}
            >
              <Wand2 size={18} />
              <span>Generate</span>
            </button>
            <button 
              onClick={() => setCurrentView('lorebooks')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'lorebooks' 
                  ? 'bg-dungeon-orange text-dungeon-dark' 
                  : 'text-dungeon-text-secondary hover:text-dungeon-text'
              }`}
            >
              <ScrollText size={18} />
              <span>Lorebooks</span>
            </button>
            <button 
              onClick={() => setCurrentView('config')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'config' 
                  ? 'bg-dungeon-orange text-dungeon-dark' 
                  : 'text-dungeon-text-secondary hover:text-dungeon-text'
              }`}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="hidden md:flex items-center space-x-2 px-4 py-2 bg-dungeon-orange text-dungeon-dark rounded-lg font-medium hover:bg-dungeon-orange-dark transition-colors">
            <User size={18} />
            <span>Sign In</span>
          </button>
          <button className="md:hidden">
            <Menu size={24} className="text-dungeon-text" />
          </button>
        </div>
      </div>
    </nav>
  );
};

// Landing Page Component
// Character Selection Component for Scenario Templates
export const CharacterSelectionModal = ({ isOpen, onClose, templateId, onSelectCharacter }) => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [error, setError] = useState(null);

  const fetchCharacters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/scenarios/templates/${templateId}/characters`);
      if (response.ok) {
        const result = await response.json();
        setCharacters(result.characters);
      } else {
        setError('Failed to load characters');
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
      setError('Error loading characters');
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    if (isOpen && templateId) {
      fetchCharacters();
    }
  }, [isOpen, templateId, fetchCharacters]);

  const handleSelectCharacter = () => {
    if (selectedCharacter) {
      onSelectCharacter(selectedCharacter);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-dungeon-darker rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Choose Your Character</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={32} className="animate-spin text-dungeon-orange" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              <AlertCircle size={32} className="mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : characters.length === 0 ? (
            <div className="text-center py-8 text-dungeon-text-secondary">
              <User size={32} className="mx-auto mb-2 opacity-50" />
              <p>No characters available for this scenario.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {characters.map((character, index) => (
                <div 
                  key={index}
                  onClick={() => setSelectedCharacter(character)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedCharacter === character 
                    ? 'bg-dungeon-orange bg-opacity-20 border border-dungeon-orange' 
                    : 'bg-slate-700 hover:bg-slate-600 border border-transparent'}`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-dungeon-orange flex items-center justify-center">
                      <User size={20} className="text-dungeon-dark" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{character.name}</h3>
                      <p className="text-sm text-dungeon-text-secondary">Level {character.level} {character.class_name}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-dungeon-text-secondary">
                    <p className="line-clamp-2">{character.background}</p>
                  </div>

                  {character.stats && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="text-xs text-dungeon-text-secondary">STR</div>
                        <div className="text-white font-medium">{character.stats.strength}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-dungeon-text-secondary">INT</div>
                        <div className="text-white font-medium">{character.stats.intelligence}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-dungeon-text-secondary">DEX</div>
                        <div className="text-white font-medium">{character.stats.dexterity}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-dungeon-text-secondary hover:text-white transition-colors mr-3"
          >
            Cancel
          </button>
          <button 
            onClick={handleSelectCharacter}
            disabled={!selectedCharacter}
            className="px-6 py-2 bg-dungeon-orange text-dungeon-dark rounded-lg font-medium hover:bg-dungeon-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Character
          </button>
        </div>
      </div>
    </div>
  );
};

export const LandingPage = ({ onStartGame }) => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCharacterModal, setShowCharacterModal] = useState(false);

  useEffect(() => {
    fetchScenarioTemplates();
  }, []);

  const fetchScenarioTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/scenarios/templates`);
      if (response.ok) {
        const result = await response.json();
        setScenarios(result.templates.map(template => ({
          id: template.id,
          title: template.title,
          description: template.description,
          image: 'https://images.unsplash.com/photo-1598205542984-6720bbcf74f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwbGFuZHNjYXBlfGVufDB8fHx0ZWFsfDE3NDgwMTQ3NjZ8MA&ixlib=rb-4.1.0&q=85',
          lorebook_id: template.lorebook_id,
          has_characters: template.has_playable_characters,
          character_count: template.playable_character_count,
        })));
      }
    } catch (error) {
      console.error('Error fetching scenario templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioSelect = (scenario) => {
    setSelectedTemplate(scenario);
    if (scenario.has_characters) {
      setShowCharacterModal(true);
    } else {
      // Start game with default character if no characters available
      onStartGame(scenario);
    }
  };

  const handleCharacterSelect = (character) => {
    // Start game with selected character and scenario
    onStartGame({
      ...selectedTemplate,
      character: character,
    });
  };

  // Fallback scenarios if API fails
  const fallbackScenarios = [
    {
      id: 1,
      title: 'Fantasy Adventure',
      description: 'Embark on a magical quest in a world of dragons and wizards',
      image: 'https://images.unsplash.com/photo-1598205542984-6720bbcf74f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwbGFuZHNjYXBlfGVufDB8fHx0ZWFsfDE3NDgwMTQ3NjZ8MA&ixlib=rb-4.1.0&q=85',
      intro: 'You awaken in a mystical forest, ancient magic flowing through your veins. Your destiny as a hero begins now...',
    },
    {
      id: 2,
      title: 'Sci-Fi Odyssey',
      description: 'Explore the cosmos and encounter alien civilizations',
      image: 'https://images.pexels.com/photos/9002742/pexels-photo-9002742.jpeg',
      intro: 'The year is 2387. You\'re aboard a starship entering uncharted space when alarms begin blaring throughout the vessel...',
    },
    {
      id: 3,
      title: 'Medieval Kingdom',
      description: 'Rule a kingdom in an age of knights and castles',
      image: 'https://images.pexels.com/photos/32166318/pexels-photo-32166318.jpeg',
      intro: 'The crown weighs heavy on your head as you survey your kingdom from the castle walls. Dark times approach...',
    },
  ];

  // Use fallback scenarios if API call failed and no scenarios loaded
  const displayScenarios = scenarios.length > 0 ? scenarios : fallbackScenarios;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative h-screen flex items-center justify-center"
        style={{
          backgroundImage: 'url(\'https://images.unsplash.com/photo-1598205542984-6720bbcf74f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwbGFuZHNjYXBlfGVufDB8fHx0ZWFsfDE3NDgwMTQ3NjZ8MA&ixlib=rb-4.1.0&q=85\')',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 hero-gradient"></div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <motion.h1 
            className="text-6xl md:text-8xl font-fantasy font-bold mb-6 text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            AI DUNGEON
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl mb-8 text-dungeon-text-secondary max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            A text-based adventure-story game you direct (and star in) while the AI brings it to life.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <button 
              onClick={() => handleScenarioSelect(displayScenarios[0])}
              className="flex items-center space-x-3 px-8 py-4 bg-dungeon-orange text-dungeon-dark rounded-lg font-bold text-lg hover:bg-dungeon-orange-dark transition-colors glow-orange"
            >
              <Play size={24} />
              <span>PLAY ONLINE FREE</span>
            </button>
            <button className="flex items-center space-x-3 px-8 py-4 border-2 border-dungeon-orange text-dungeon-orange rounded-lg font-bold text-lg hover:bg-dungeon-orange hover:text-dungeon-dark transition-colors">
              <span>GET THE APP</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Scenarios Section */}
      <div className="py-20 px-6 bg-dungeon-darker">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-fantasy font-bold mb-6 text-white">
              Choose Your Adventure
            </h2>
            <p className="text-xl text-dungeon-text-secondary max-w-3xl mx-auto">
              Select from our collection of immersive scenarios, or create your own unique world
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw size={48} className="animate-spin text-dungeon-orange" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayScenarios.map((scenario, index) => (
                <motion.div
                  key={scenario.id}
                  className="scenario-card rounded-xl overflow-hidden cursor-pointer"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleScenarioSelect(scenario)}
                >
                  <div 
                    className="h-48 bg-cover bg-center relative"
                    style={{ backgroundImage: `url('${scenario.image}')` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-dungeon-dark via-transparent to-transparent"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3 text-white">{scenario.title}</h3>
                    <p className="text-dungeon-text-secondary mb-4">{scenario.description}</p>
                    
                    {scenario.has_characters && (
                      <div className="flex items-center mb-4 text-sm text-dungeon-orange">
                        <User size={16} className="mr-2" />
                        <span>{scenario.character_count} playable {scenario.character_count === 1 ? 'character' : 'characters'}</span>
                      </div>
                    )}
                    
                    <button className="flex items-center space-x-2 text-dungeon-orange hover:text-dungeon-orange-dark transition-colors">
                      <Play size={16} />
                      <span>Start Adventure</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Character Selection Modal */}
      <CharacterSelectionModal 
        isOpen={showCharacterModal}
        onClose={() => setShowCharacterModal(false)}
        templateId={selectedTemplate?.id}
        onSelectCharacter={handleCharacterSelect}
      />
      
      {/* Features Section */}
      <div className="py-20 px-6 bg-dungeon-dark">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-fantasy font-bold mb-6 text-white">
              Features
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Wand2 size={48} />,
                title: 'AI Game Master',
                description: 'Experience dynamic storytelling powered by advanced AI that adapts to your choices',
              },
              {
                icon: <User size={48} />,
                title: 'Character Progression',
                description: 'Level up your character, gain skills, and customize your abilities as you adventure',
              },
              {
                icon: <ScrollText size={48} />,
                title: 'Unlimited Stories',
                description: 'Every playthrough is unique with procedurally generated content and branching narratives',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="text-center p-8 scenario-card rounded-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="text-dungeon-orange mb-6 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-dungeon-text-secondary">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Game Interface Component
export const GameInterface = ({ gameState, setGameState: _setGameState, onAction }) => {
  const [inputValue, setInputValue] = useState('');
  const [activePanel, setActivePanel] = useState('character');
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [gameState.story]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAction(inputValue);
      setInputValue('');
    }
  };

  const quickActions = [
    { text: 'Look around', icon: <Star size={16} /> },
    { text: 'Attack', icon: <Sword size={16} /> },
    { text: 'Defend', icon: <Shield size={16} /> },
    { text: 'Cast spell', icon: <Wand2 size={16} /> },
  ];

  return (
    <div className="h-full flex overflow-hidden bg-dungeon-dark">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Story Display */}
        <div 
          ref={chatRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 relative min-h-0"
          style={{
            backgroundImage: 'url(\'https://images.unsplash.com/photo-1598205542984-6720bbcf74f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwbGFuZHNjYXBlfGVufDB8fHx0ZWFsfDE3NDgwMTQ3NjZ8MA&ixlib=rb-4.1.0&q=85\')',
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-dungeon-dark/90 via-dungeon-dark/80 to-dungeon-dark/90"></div>
          <div className="relative z-10 max-w-4xl mx-auto space-y-4">
            {gameState.story.map((entry, index) => (
              <motion.div
                key={index}
                className={`p-4 rounded-lg chat-message shadow-xl ${
                  entry.type === 'narration' 
                    ? 'bg-slate-900 border-l-4 border-dungeon-orange border border-slate-700' 
                    : 'bg-blue-900 border-l-4 border-blue-400 border border-blue-700 ml-8'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    entry.type === 'narration' ? 'bg-dungeon-orange' : 'bg-blue-400'
                  }`}></div>
                  <p className="text-white leading-relaxed font-medium">{entry.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-dungeon-darker border-t border-slate-600 p-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onAction(action.text)}
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-700/90 hover:bg-slate-600 rounded-lg text-sm transition-all hover:scale-105 border border-slate-600"
                >
                  {action.icon}
                  <span>{action.text}</span>
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What do you do next?"
                className="flex-1 px-4 py-3 bg-slate-700/90 border border-slate-600 rounded-lg text-dungeon-text placeholder-slate-400 focus:outline-none focus:border-dungeon-orange focus:ring-1 focus:ring-dungeon-orange"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-dungeon-orange text-dungeon-dark rounded-lg font-medium hover:bg-dungeon-orange-dark transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Send size={18} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-dungeon-darker border-l border-slate-600 flex flex-col flex-shrink-0">
        {/* Panel Tabs */}
        <div className="flex border-b border-slate-600">
          {[
            { id: 'character', label: 'Character', icon: <User size={16} /> },
            { id: 'inventory', label: 'Inventory', icon: <Backpack size={16} /> },
            { id: 'quests', label: 'Quests', icon: <ScrollText size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 transition-colors ${
                activePanel === tab.id
                  ? 'bg-dungeon-orange text-dungeon-dark font-medium'
                  : 'text-dungeon-text-secondary hover:text-dungeon-text hover:bg-slate-700/50'
              }`}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activePanel === 'character' && <CharacterPanel character={gameState.character} />}
          {activePanel === 'inventory' && <InventoryPanel inventory={gameState.inventory} />}
          {activePanel === 'quests' && <QuestsPanel quests={gameState.quests} />}
        </div>
      </div>
    </div>
  );
};

// Character Panel Component
const CharacterPanel = ({ character }) => {
  return (
    <div className="space-y-6">
      {/* Character Info */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-dungeon-orange to-dungeon-orange-dark rounded-full mx-auto mb-3 flex items-center justify-center">
          <User size={32} className="text-dungeon-dark" />
        </div>
        <h3 className="text-xl font-bold text-white">{character.name}</h3>
        <p className="text-sm text-dungeon-text-secondary">Level {character.level} Adventurer</p>
      </div>

      {/* Health and Mana */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-dungeon-text-secondary">Health</span>
            <span className="text-white">{character.health}/{character.maxHealth}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(character.health / character.maxHealth) * 100}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-dungeon-text-secondary">Mana</span>
            <span className="text-white">{character.mana}/{character.maxMana}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(character.mana / character.maxMana) * 100}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-dungeon-text-secondary">Experience</span>
            <span className="text-white">{character.experience}/100</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-dungeon-orange h-2 rounded-full transition-all duration-300"
              style={{ width: `${(character.experience / 100) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <h4 className="font-bold text-white mb-3">Attributes</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(character.stats).map(([stat, value]) => (
            <div key={stat} className="bg-slate-700 rounded-lg p-3 text-center">
              <div className="text-xs text-dungeon-text-secondary capitalize mb-1">{stat}</div>
              <div className="text-lg font-bold text-white">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Inventory Panel Component
const InventoryPanel = ({ inventory }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'border-gray-400',
      uncommon: 'border-green-400',
      rare: 'border-blue-400',
      epic: 'border-purple-400',
      legendary: 'border-orange-400',
    };
    return colors[rarity] || colors.common;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-white">Inventory</h4>
        <span className="text-sm text-dungeon-text-secondary">{inventory.length}/20</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {inventory.map((item) => (
          <div
            key={item.id}
            className={`inventory-item p-2 rounded-lg cursor-pointer ${getRarityColor(item.rarity)}`}
            onClick={() => setSelectedItem(item)}
          >
            <div className="w-8 h-8 bg-slate-600 rounded mb-1 flex items-center justify-center">
              {item.type === 'weapon' && <Sword size={16} className="text-dungeon-orange" />}
              {item.type === 'armor' && <Shield size={16} className="text-blue-400" />}
              {item.type === 'consumable' && <Heart size={16} className="text-red-400" />}
            </div>
            <div className="text-xs text-white truncate">{item.name}</div>
            {item.quantity && (
              <div className="text-xs text-dungeon-text-secondary">{item.quantity}</div>
            )}
            {item.equipped && (
              <div className="text-xs text-dungeon-orange">E</div>
            )}
          </div>
        ))}
        
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 20 - inventory.length) }).map((_, index) => (
          <div key={`empty-${index}`} className="inventory-slot p-2 rounded-lg h-16">
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="bg-slate-700 p-4 rounded-lg">
          <h5 className="font-bold text-white mb-2">{selectedItem.name}</h5>
          <p className="text-sm text-dungeon-text-secondary mb-2 capitalize">
            {selectedItem.type} • {selectedItem.rarity}
          </p>
          <div className="flex space-x-2">
            {!selectedItem.equipped && (
              <button className="px-3 py-1 bg-dungeon-orange text-dungeon-dark rounded text-sm font-medium">
                Equip
              </button>
            )}
            {selectedItem.type === 'consumable' && (
              <button className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium">
                Use
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Quests Panel Component
const QuestsPanel = ({ quests }) => {
  const [activeTab, setActiveTab] = useState('active');

  const filteredQuests = quests.filter(quest => 
    activeTab === 'all' || quest.status === activeTab,
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-white">Quests</h4>
      </div>

      {/* Quest Tabs */}
      <div className="flex space-x-1">
        {[
          { id: 'active', label: 'Active' },
          { id: 'completed', label: 'Done' },
          { id: 'all', label: 'All' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-dungeon-orange text-dungeon-dark'
                : 'bg-slate-700 text-dungeon-text-secondary hover:text-dungeon-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {filteredQuests.map((quest) => (
          <div key={quest.id} className="bg-slate-700 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h5 className="font-bold text-white text-sm">{quest.title}</h5>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                quest.status === 'active' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-green-600 text-white'
              }`}>
                {quest.status === 'active' ? 'Active' : 'Done'}
              </span>
            </div>
            <p className="text-xs text-dungeon-text-secondary mb-2">{quest.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-dungeon-orange">{quest.progress}</span>
              {quest.status === 'active' && (
                <button className="text-xs text-blue-400 hover:text-blue-300">
                  Track
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Scenario Generator Page Component
export const ScenarioGeneratorPage = () => {
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesType, setSeriesType] = useState('anime');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generationTasks, setGenerationTasks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const seriesTypes = [
    { value: 'anime', label: 'Anime' },
    { value: 'manga', label: 'Manga' },
    { value: 'game', label: 'Video Game' },
    { value: 'novel', label: 'Light Novel' },
    { value: 'movie', label: 'Movie' },
    { value: 'tv_show', label: 'TV Show' },
    { value: 'book', label: 'Book' },
    { value: 'comic', label: 'Comic' },
  ];

  const startGeneration = async () => {
    if (!seriesTitle.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/scenarios/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          series_title: seriesTitle,
          series_type: seriesType,
          additional_context: additionalContext,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newTask = {
          task_id: result.task_id,
          series_title: seriesTitle,
          status: 'started',
          progress: 0,
          current_step: 'Initializing...',
          created_at: new Date().toISOString(),
        };
        setGenerationTasks(prev => [newTask, ...prev]);
        
        // Clear form
        setSeriesTitle('');
        setAdditionalContext('');
        
        // Start polling for updates
        pollTaskStatus(result.task_id);
      }
    } catch (error) {
      console.error('Error starting generation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const pollTaskStatus = async (taskId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/scenarios/generate/${taskId}`);
      if (response.ok) {
        const result = await response.json();
        
        setGenerationTasks(prev => prev.map(task => 
          task.task_id === taskId ? { ...task, ...result } : task,
        ));

        // Continue polling if not completed
        if (result.status !== 'completed' && result.status !== 'failed') {
          setTimeout(() => pollTaskStatus(taskId), 2000);
        }
      }
    } catch (error) {
      console.error('Error polling task status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
    case 'completed': return 'text-green-400';
    case 'failed': return 'text-red-400';
    case 'analyzing': return 'text-blue-400';
    case 'generating': return 'text-yellow-400';
    case 'validating': return 'text-purple-400';
    default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
    case 'completed': return <Check size={16} className="text-green-400" />;
    case 'failed': return <X size={16} className="text-red-400" />;
    case 'analyzing': 
    case 'generating': 
    case 'validating': return <RefreshCw size={16} className="animate-spin text-blue-400" />;
    default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const viewGeneratedScenario = async (lorebookId) => {
    try {
      // Fetch scenario templates for this lorebook
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/scenarios/templates?lorebook_id=${lorebookId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.templates && result.templates.length > 0) {
          // Navigate to the scenario or show details
          console.log('Generated scenario templates:', result.templates);
          alert(`Successfully generated ${result.templates.length} scenario(s) with ${result.templates[0].playable_character_count || 0} playable characters!`);
        }
      }
    } catch (error) {
      console.error('Error viewing generated scenario:', error);
    }
  };

  return (
    <div className="min-h-screen bg-dungeon-dark py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl font-fantasy font-bold mb-6 text-white">
            <Wand2 className="inline-block mr-4 text-dungeon-orange" size={48} />
            AI Scenario Generator
          </h1>
          <p className="text-xl text-dungeon-text-secondary max-w-3xl mx-auto">
              Transform any series into a playable adventure! Our AI analyzes your favorite anime, manga, games, or books to create comprehensive worlds with playable characters that match the power systems and lore.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Form */}
          <motion.div 
            className="scenario-card rounded-xl p-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Create New Scenario</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-dungeon-text mb-2">
                  Series Title *
                </label>
                <input
                  type="text"
                  value={seriesTitle}
                  onChange={(e) => setSeriesTitle(e.target.value)}
                  placeholder="e.g., Naruto, Attack on Titan, Final Fantasy..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-dungeon-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dungeon-text mb-2">
                  Content Type
                </label>
                <select
                  value={seriesType}
                  onChange={(e) => setSeriesType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-dungeon-orange"
                >
                  {seriesTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dungeon-text mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Focus areas, specific characters, time periods, or themes you want emphasized..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-dungeon-orange resize-none"
                />
              </div>

              <button
                onClick={startGeneration}
                disabled={!seriesTitle.trim() || isGenerating}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-dungeon-orange text-dungeon-dark rounded-lg font-bold hover:bg-dungeon-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    <span>Starting Generation...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    <span>Generate AI Scenario</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Generation Tasks */}
          <motion.div 
            className="scenario-card rounded-xl p-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Generation Progress</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {generationTasks.length === 0 ? (
                <div className="text-center py-8 text-dungeon-text-secondary">
                  <Wand2 size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No generations yet. Start creating your first scenario!</p>
                </div>
              ) : (
                generationTasks.map((task) => (
                  <div key={task.task_id} className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white truncate">{task.series_title}</h3>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(task.status)}
                        <span className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    {task.progress !== undefined && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-dungeon-text-secondary mb-1">
                          <span>{task.current_step}</span>
                          <span>{Math.round(task.progress * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div 
                            className="bg-dungeon-orange h-2 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-dungeon-text-secondary">
                      Started: {new Date(task.created_at).toLocaleTimeString()}
                    </div>
                    
                    {task.status === 'completed' && task.lorebook_id && (
                      <div className="mt-2 space-y-2">
                        <button 
                          onClick={() => viewGeneratedScenario(task.lorebook_id)}
                          className="block text-sm text-dungeon-orange hover:text-dungeon-orange-dark transition-colors"
                        >
                          View Generated Scenario →
                        </button>
                        <div className="text-xs text-green-400">
                          ✓ Characters and world generated successfully
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Configuration Page Component
export const ConfigurationPage = () => {
  const [config, setConfig] = useState({
    googleApiKey: '',
    model: 'gemini-2.5-flash-preview-05-20',
    temperature: 0.7,
    maxTokens: 2048,
    mongoUrl: '',
    autoSave: true,
    maxStoryLength: 100,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const availableModels = [
    { value: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash (Preview)', recommended: true },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ];

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      // For now, save to localStorage since we don't have user auth
      localStorage.setItem('ai_dungeon_config', JSON.stringify(config));
      setSaveStatus('Configuration saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('Error saving configuration');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.googleApiKey) {
      setSaveStatus('Please enter your Google API key first');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    try {
      // Test API connection
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/health`);
      if (response.ok) {
        setSaveStatus('Backend connection successful!');
      } else {
        setSaveStatus('Backend connection failed');
      }
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('Error testing connection');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('ai_dungeon_config');
    if (savedConfig) {
      setConfig(prevConfig => ({ ...prevConfig, ...JSON.parse(savedConfig) }));
    }
  }, []);

  return (
    <div className="min-h-screen bg-dungeon-dark py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl font-fantasy font-bold mb-6 text-white">
            <Settings className="inline-block mr-4 text-dungeon-orange" size={48} />
            Configuration
          </h1>
          <p className="text-xl text-dungeon-text-secondary max-w-3xl mx-auto">
            Configure your AI models, API keys, and system preferences for the best gaming experience.
          </p>
        </motion.div>

        <motion.div 
          className="scenario-card rounded-xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-8">
            {/* API Configuration */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Zap className="mr-3 text-dungeon-orange" size={24} />
                AI Model Configuration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-dungeon-text mb-2">
                    Google AI Studio API Key *
                  </label>
                  <input
                    type="password"
                    value={config.googleApiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, googleApiKey: e.target.value }))}
                    placeholder="Enter your Google AI Studio API key"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-dungeon-orange"
                  />
                  <p className="text-xs text-dungeon-text-secondary mt-1">
                    Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-dungeon-orange hover:underline">Google AI Studio</a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dungeon-text mb-2">
                    AI Model
                  </label>
                  <select
                    value={config.model}
                    onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-dungeon-orange"
                  >
                    {availableModels.map(model => (
                      <option key={model.value} value={model.value}>
                        {model.label} {model.recommended ? '(Recommended)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dungeon-text mb-2">
                    Temperature: {config.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-dungeon-text-secondary mt-1">
                    Higher values = more creative, Lower values = more consistent
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dungeon-text mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    min="256"
                    max="4096"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-dungeon-orange"
                  />
                </div>
              </div>
            </div>

            {/* Game Configuration */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Settings className="mr-3 text-dungeon-orange" size={24} />
                Game Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-dungeon-text mb-2">
                    Max Story Length
                  </label>
                  <input
                    type="number"
                    value={config.maxStoryLength}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxStoryLength: parseInt(e.target.value) }))}
                    min="50"
                    max="1000"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-dungeon-orange"
                  />
                  <p className="text-xs text-dungeon-text-secondary mt-1">
                    Maximum number of story entries before cleanup
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={config.autoSave}
                    onChange={(e) => setConfig(prev => ({ ...prev, autoSave: e.target.checked }))}
                    className="w-4 h-4 text-dungeon-orange bg-slate-700 border-slate-600 rounded focus:ring-dungeon-orange"
                  />
                  <label htmlFor="autoSave" className="text-dungeon-text">
                    Enable Auto-Save
                  </label>
                </div>
              </div>
            </div>

            {/* Database Configuration */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Download className="mr-3 text-dungeon-orange" size={24} />
                Database Settings
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-dungeon-text mb-2">
                  MongoDB URL (Optional)
                </label>
                <input
                  type="text"
                  value={config.mongoUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, mongoUrl: e.target.value }))}
                  placeholder="mongodb://localhost:27017 or MongoDB Atlas URL"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-dungeon-orange"
                />
                <p className="text-xs text-dungeon-text-secondary mt-1">
                  Leave empty to use default local MongoDB
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-700">
              <button
                onClick={saveConfiguration}
                disabled={isSaving}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-dungeon-orange text-dungeon-dark rounded-lg font-medium hover:bg-dungeon-orange-dark transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Save Configuration</span>
                  </>
                )}
              </button>

              <button
                onClick={testConnection}
                className="flex items-center justify-center space-x-2 px-6 py-3 border border-dungeon-orange text-dungeon-orange rounded-lg font-medium hover:bg-dungeon-orange hover:text-dungeon-dark transition-colors"
              >
                <Zap size={18} />
                <span>Test Connection</span>
              </button>

              {saveStatus && (
                <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg ${
                  saveStatus.includes('Error') || saveStatus.includes('failed') 
                    ? 'bg-red-900/50 text-red-300' 
                    : 'bg-green-900/50 text-green-300'
                }`}>
                  {saveStatus.includes('Error') || saveStatus.includes('failed') ? (
                    <AlertCircle size={18} />
                  ) : (
                    <Check size={18} />
                  )}
                  <span>{saveStatus}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Lorebooks Browser Page Component
export const LorebooksPage = () => {
  const [lorebooks, setLorebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');

  useEffect(() => {
    fetchLorebooks();
  }, []);

  const fetchLorebooks = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lorebooks`);
      if (response.ok) {
        const result = await response.json();
        setLorebooks(result.lorebooks);
      }
    } catch (error) {
      console.error('Error fetching lorebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLorebooks = lorebooks.filter(lorebook => {
    const matchesSearch = lorebook.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !filterGenre || lorebook.genre.includes(filterGenre);
    return matchesSearch && matchesGenre;
  });

  const genres = [...new Set(lorebooks.flatMap(lb => lb.genre))];

  return (
    <div className="min-h-screen bg-dungeon-dark py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl font-fantasy font-bold mb-6 text-white">
            <ScrollText className="inline-block mr-4 text-dungeon-orange" size={48} />
            Lorebook Library
          </h1>
          <p className="text-xl text-dungeon-text-secondary max-w-3xl mx-auto">
            Browse your collection of AI-generated worlds and scenarios. Each lorebook contains rich lore, characters, and adventures ready to explore.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          className="scenario-card rounded-xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search lorebooks..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-dungeon-orange"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-dungeon-orange"
              >
                <option value="">All Genres</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchLorebooks}
              className="flex items-center space-x-2 px-4 py-3 border border-dungeon-orange text-dungeon-orange rounded-lg hover:bg-dungeon-orange hover:text-dungeon-dark transition-colors"
            >
              <RefreshCw size={18} />
              <span>Refresh</span>
            </button>
          </div>
        </motion.div>

        {/* Lorebooks Grid */}
        {loading ? (
          <div className="text-center py-20">
            <RefreshCw size={48} className="animate-spin text-dungeon-orange mx-auto mb-4" />
            <p className="text-dungeon-text-secondary">Loading lorebooks...</p>
          </div>
        ) : filteredLorebooks.length === 0 ? (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <ScrollText size={64} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">No Lorebooks Found</h3>
            <p className="text-dungeon-text-secondary mb-8">
              {searchTerm || filterGenre 
                ? 'Try adjusting your search or filters' 
                : 'Start by generating your first scenario!'}
            </p>
            <button 
              onClick={() => window.location.href = '#generator'}
              className="px-6 py-3 bg-dungeon-orange text-dungeon-dark rounded-lg font-medium hover:bg-dungeon-orange-dark transition-colors"
            >
              Generate First Scenario
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLorebooks.map((lorebook, index) => (
              <motion.div
                key={lorebook.id}
                className="scenario-card rounded-xl overflow-hidden cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="h-48 bg-gradient-to-br from-dungeon-orange/20 to-blue-600/20 relative flex items-center justify-center">
                  <ScrollText size={48} className="text-dungeon-orange" />
                  <div className="absolute top-4 right-4 flex flex-wrap gap-1">
                    {lorebook.genre.slice(0, 2).map(genre => (
                      <span key={genre} className="px-2 py-1 bg-dungeon-orange/20 text-dungeon-orange text-xs rounded">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{lorebook.title}</h3>
                  <p className="text-dungeon-text-secondary text-sm mb-4">{lorebook.setting}</p>
                  
                  <div className="flex justify-between text-sm text-dungeon-text-secondary">
                    <span>{lorebook.characters_count} Characters</span>
                    <span>{lorebook.locations_count} Locations</span>
                  </div>
                  
                  <div className="mt-4 text-xs text-dungeon-text-secondary">
                    Created: {new Date(lorebook.created_at).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
