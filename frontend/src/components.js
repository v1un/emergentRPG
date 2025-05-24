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
  RefreshCw
} from 'lucide-react';

// Enhanced Navigation Component with Mobile Support
export const Navigation = ({ currentView, setCurrentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'generator', label: 'Generate', icon: Wand2 },
    { id: 'lorebooks', label: 'Lorebooks', icon: ScrollText },
    { id: 'config', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="glass-panel border-b border-dungeon-stone/30 px-4 md:px-6 py-4 relative z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <motion.h1 
            className="text-2xl md:text-3xl font-fantasy font-bold text-mystical-amber magical-text text-shadow-glow"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            ⚔️ AI DUNGEON
          </motion.h1>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-mystical-amber text-dungeon-dark shadow-glow-sm'
                      : 'text-dungeon-pearl hover:text-dungeon-snow hover:bg-dungeon-stone/20 hover:shadow-glow-sm'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Icon size={18} />
                  <span className="hidden xl:inline">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Sign In Button - Desktop */}
          <motion.button 
            className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-mystical-amber to-mystical-gold text-dungeon-dark rounded-xl font-medium shadow-glow transition-all duration-300 hover:shadow-glow-lg"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <User size={18} />
            <span>Sign In</span>
          </motion.button>
          
          {/* Mobile Menu Button */}
          <motion.button 
            className="lg:hidden p-2 rounded-xl text-dungeon-pearl hover:text-dungeon-snow hover:bg-dungeon-stone/20 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={24} />
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className={`lg:hidden absolute top-full left-0 right-0 glass-panel border-t border-dungeon-stone/30 ${
          isMobileMenuOpen ? 'block' : 'hidden'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: isMobileMenuOpen ? 1 : 0, 
          y: isMobileMenuOpen ? 0 : -20 
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-4 py-6 space-y-4">
          {/* Mobile Navigation Items */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-mystical-amber text-dungeon-dark shadow-glow-sm'
                    : 'text-dungeon-pearl hover:text-dungeon-snow hover:bg-dungeon-stone/20'
                }`}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
          
          {/* Mobile Sign In */}
          <motion.button 
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-mystical-amber to-mystical-gold text-dungeon-dark rounded-xl font-medium shadow-glow mt-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <User size={20} />
            <span>Sign In</span>
          </motion.button>
        </div>
      </motion.div>
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
          image: "https://images.unsplash.com/photo-1598205542984-6720bbcf74f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwbGFuZHNjYXBlfGVufDB8fHx0ZWFsfDE3NDgwMTQ3NjZ8MA&ixlib=rb-4.1.0&q=85",
          lorebook_id: template.lorebook_id,
          has_characters: template.has_playable_characters,
          character_count: template.playable_character_count
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
      character: character
    });
  };

  // Fallback scenarios if API fails
  const fallbackScenarios = [
    {
      id: 1,
      title: "Fantasy Adventure",
      description: "Embark on a magical quest in a world of dragons and wizards",
      image: "https://images.unsplash.com/photo-1598205542984-6720bbcf74f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwbGFuZHNjYXBlfGVufDB8fHx0ZWFsfDE3NDgwMTQ3NjZ8MA&ixlib=rb-4.1.0&q=85",
      intro: "You awaken in a mystical forest, ancient magic flowing through your veins. Your destiny as a hero begins now..."
    },
    {
      id: 2,
      title: "Sci-Fi Odyssey",
      description: "Explore the cosmos and encounter alien civilizations",
      image: "https://images.pexels.com/photos/9002742/pexels-photo-9002742.jpeg",
      intro: "The year is 2387. You're aboard a starship entering uncharted space when alarms begin blaring throughout the vessel..."
    },
    {
      id: 3,
      title: "Medieval Kingdom",
      description: "Rule a kingdom in an age of knights and castles",
      image: "https://images.pexels.com/photos/32166318/pexels-photo-32166318.jpeg",
      intro: "The crown weighs heavy on your head as you survey your kingdom from the castle walls. Dark times approach..."
    }
  ];

  // Use fallback scenarios if API call failed and no scenarios loaded
  const displayScenarios = scenarios.length > 0 ? scenarios : fallbackScenarios;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1598205542984-6720bbcf74f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwbGFuZHNjYXBlfGVufDB8fHx0ZWFsfDE3NDgwMTQ3NjZ8MA&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
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
                title: "AI Game Master",
                description: "Experience dynamic storytelling powered by advanced AI that adapts to your choices"
              },
              {
                icon: <User size={48} />,
                title: "Character Progression",
                description: "Level up your character, gain skills, and customize your abilities as you adventure"
              },
              {
                icon: <ScrollText size={48} />,
                title: "Unlimited Stories",
                description: "Every playthrough is unique with procedurally generated content and branching narratives"
              }
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
export const GameInterface = ({ gameState, setGameState, onAction }) => {
  const [inputValue, setInputValue] = useState('');
  const [activePanel, setActivePanel] = useState('character');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [gameState.story]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setIsTyping(true);
      await onAction(inputValue);
      setInputValue('');
      setIsTyping(false);
    }
  };

  const quickActions = [
    { text: "Look around", icon: <Star size={16} />, color: "mystical-sapphire" },
    { text: "Attack", icon: <Sword size={16} />, color: "mystical-crimson" },
    { text: "Defend", icon: <Shield size={16} />, color: "mystical-emerald" },
    { text: "Cast spell", icon: <Wand2 size={16} />, color: "mystical-amethyst" },
  ];

  const panelTabs = [
    { id: 'character', label: 'Character', icon: User, color: 'mystical-amber' },
    { id: 'inventory', label: 'Inventory', icon: Backpack, color: 'mystical-emerald' },
    { id: 'quests', label: 'Quests', icon: ScrollText, color: 'mystical-sapphire' },
  ];

  return (
    <div className="h-full flex overflow-hidden bg-void-gradient relative">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Story Display */}
        <div 
          ref={chatRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative min-h-0 magical-particles"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1598205542984-6720bbcf74f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwbGFuZHNjYXBlfGVufDB8fHx8ZWFsfDE3NDgwMTQ3NjZ8MA&ixlib=rb-4.1.0&q=85')`,
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-dungeon-dark/95 via-dungeon-dark/85 to-dungeon-dark/95"></div>
          <div className="relative z-10 max-w-4xl mx-auto space-y-4">
            {gameState.story.map((entry, index) => (
              <motion.div
                key={index}
                className={`p-4 md:p-6 rounded-2xl chat-message shadow-depth backdrop-blur-sm ${
                  entry.type === 'narration' 
                    ? 'chat-message narration' 
                    : 'chat-message action ml-4 md:ml-8'
                }`}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 shadow-glow ${
                    entry.type === 'narration' ? 'bg-mystical-amber' : 'bg-mystical-sapphire'
                  }`}></div>
                  <p className="text-dungeon-snow leading-relaxed font-medium text-shadow">
                    {entry.text}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                className="p-4 md:p-6 rounded-2xl chat-message narration backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 rounded-full bg-mystical-amber animate-pulse"></div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-mystical-amber rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-mystical-amber rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-mystical-amber rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="glass-panel border-t border-dungeon-stone/30 p-4 md:p-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  onClick={() => onAction(action.text)}
                  className={`flex items-center space-x-2 px-3 py-2 glass-panel-light rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-glow-sm border border-${action.color}/30 hover:border-${action.color}/60`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {action.icon}
                  <span className="hidden sm:inline">{action.text}</span>
                </motion.button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="What do you do next?"
                  className="w-full px-4 py-3 glass-panel-light rounded-xl text-dungeon-snow placeholder-dungeon-light focus:outline-none focus:border-mystical-amber/60 focus:shadow-glow-sm transition-all duration-300"
                  disabled={isTyping}
                />
                {isTyping && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="loading-spinner w-5 h-5"></div>
                  </div>
                )}
              </div>
              <motion.button
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className="px-4 md:px-6 py-3 bg-gradient-to-r from-mystical-amber to-mystical-gold text-dungeon-dark rounded-xl font-medium shadow-glow transition-all duration-300 hover:shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send size={18} />
                <span className="hidden sm:inline">Send</span>
              </motion.button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      <motion.button
        className="lg:hidden fixed top-20 right-4 z-50 p-3 glass-panel rounded-xl shadow-glow"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Menu size={20} className="text-mystical-amber" />
      </motion.button>

      {/* Right Sidebar */}
      <motion.div 
        className={`w-80 lg:w-96 glass-panel border-l border-dungeon-stone/30 flex flex-col flex-shrink-0 ${
          isSidebarOpen ? 'fixed' : 'hidden'
        } lg:flex right-0 top-0 h-full z-40`}
        initial={{ x: '100%' }}
        animate={{ x: isSidebarOpen || window.innerWidth >= 1024 ? 0 : '100%' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Panel Tabs */}
        <div className="flex border-b border-dungeon-stone/30">
          {panelTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePanel === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-4 transition-all duration-300 ${
                  isActive
                    ? `bg-${tab.color} text-dungeon-dark font-medium shadow-glow-sm`
                    : 'text-dungeon-pearl hover:text-dungeon-snow hover:bg-dungeon-stone/20'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={18} />
                <span className="text-sm font-medium hidden xl:inline">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activePanel === 'character' && <CharacterPanel character={gameState.character} />}
            {activePanel === 'inventory' && <InventoryPanel inventory={gameState.inventory} />}
            {activePanel === 'quests' && <QuestsPanel quests={gameState.quests} />}
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <motion.div
          className="lg:hidden fixed inset-0 bg-dungeon-void/50 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </div>
  );
};

// Enhanced Character Panel Component
const CharacterPanel = ({ character }) => {
  const getHealthColor = (percentage) => {
    if (percentage > 75) return 'health-bar';
    if (percentage > 50) return 'bg-mystical-topaz';
    if (percentage > 25) return 'bg-mystical-amber';
    return 'bg-mystical-crimson';
  };

  const getManaColor = (percentage) => {
    if (percentage > 75) return 'mana-bar';
    if (percentage > 50) return 'bg-mystical-sapphire';
    if (percentage > 25) return 'bg-mystical-amethyst';
    return 'bg-elemental-air';
  };

  const healthPercentage = (character.health / character.maxHealth) * 100;
  const manaPercentage = (character.mana / character.maxMana) * 100;
  const expPercentage = (character.experience / 100) * 100;

  return (
    <div className="space-y-6">
      {/* Character Avatar & Info */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="w-24 h-24 bg-gradient-to-br from-mystical-amber via-mystical-gold to-mystical-amber-dark rounded-full mx-auto mb-4 flex items-center justify-center shadow-magical floating-element"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <User size={36} className="text-dungeon-dark" />
        </motion.div>
        <h3 className="text-xl font-fantasy font-bold text-dungeon-snow text-shadow-glow">
          {character.name}
        </h3>
        <p className="text-sm text-mystical-amber font-medium">
          Level {character.level} • {character.class_name || 'Adventurer'}
        </p>
      </motion.div>

      {/* Vital Stats */}
      <div className="space-y-4">
        {/* Health Bar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex justify-between text-sm mb-2">
            <span className="text-dungeon-pearl font-medium flex items-center">
              <Heart size={14} className="mr-1 text-mystical-crimson" />
              Health
            </span>
            <span className="text-dungeon-snow font-bold">
              {character.health}/{character.maxHealth}
            </span>
          </div>
          <div className="w-full bg-dungeon-stone/50 rounded-full h-3 overflow-hidden">
            <motion.div 
              className={`${getHealthColor(healthPercentage)} h-3 rounded-full transition-all duration-500 relative overflow-hidden`}
              style={{ width: `${healthPercentage}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${healthPercentage}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* Mana Bar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex justify-between text-sm mb-2">
            <span className="text-dungeon-pearl font-medium flex items-center">
              <Zap size={14} className="mr-1 text-mystical-sapphire" />
              Mana
            </span>
            <span className="text-dungeon-snow font-bold">
              {character.mana}/{character.maxMana}
            </span>
          </div>
          <div className="w-full bg-dungeon-stone/50 rounded-full h-3 overflow-hidden">
            <motion.div 
              className={`${getManaColor(manaPercentage)} h-3 rounded-full transition-all duration-500 relative overflow-hidden`}
              style={{ width: `${manaPercentage}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${manaPercentage}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* Experience Bar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex justify-between text-sm mb-2">
            <span className="text-dungeon-pearl font-medium flex items-center">
              <Star size={14} className="mr-1 text-mystical-amber" />
              Experience
            </span>
            <span className="text-dungeon-snow font-bold">
              {character.experience}/100
            </span>
          </div>
          <div className="w-full bg-dungeon-stone/50 rounded-full h-3 overflow-hidden">
            <motion.div 
              className="experience-bar h-3 rounded-full transition-all duration-500 relative overflow-hidden"
              style={{ width: `${expPercentage}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${expPercentage}%` }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Attributes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h4 className="font-fantasy font-bold text-dungeon-snow mb-4 text-shadow">
          Attributes
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(character.stats).map(([stat, value], index) => (
            <motion.div 
              key={stat} 
              className="glass-panel-light rounded-xl p-3 text-center hover:shadow-glow-sm transition-all duration-300"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <div className="text-xs text-mystical-amber capitalize mb-1 font-medium">
                {stat}
              </div>
              <div className="text-lg font-bold text-dungeon-snow">
                {value}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Character Background */}
      {character.background && (
        <motion.div
          className="glass-panel-light rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h5 className="font-fantasy font-bold text-dungeon-snow mb-2 text-shadow">
            Background
          </h5>
          <p className="text-sm text-dungeon-pearl leading-relaxed">
            {character.background}
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Enhanced Inventory Panel Component
const InventoryPanel = ({ inventory }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const getRarityConfig = (rarity) => {
    const configs = {
      common: { 
        border: 'border-dungeon-silver/50', 
        glow: 'hover:shadow-glow-sm',
        bg: 'bg-dungeon-stone/20'
      },
      uncommon: { 
        border: 'border-mystical-emerald/50', 
        glow: 'hover:shadow-glow-green',
        bg: 'bg-mystical-emerald/10'
      },
      rare: { 
        border: 'border-mystical-sapphire/50', 
        glow: 'hover:shadow-glow-blue',
        bg: 'bg-mystical-sapphire/10'
      },
      epic: { 
        border: 'border-mystical-amethyst/50', 
        glow: 'hover:shadow-glow-purple',
        bg: 'bg-mystical-amethyst/10'
      },
      legendary: { 
        border: 'border-mystical-amber/50', 
        glow: 'hover:shadow-glow animate-magical-pulse',
        bg: 'bg-mystical-amber/10'
      }
    };
    return configs[rarity] || configs.common;
  };

  const getItemIcon = (type) => {
    const icons = {
      weapon: { icon: Sword, color: 'text-mystical-crimson' },
      armor: { icon: Shield, color: 'text-mystical-sapphire' },
      consumable: { icon: Heart, color: 'text-mystical-emerald' },
      accessory: { icon: Star, color: 'text-mystical-amethyst' },
      material: { icon: Wand2, color: 'text-mystical-amber' }
    };
    return icons[type] || icons.weapon;
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragEnd = () => {
    // Handle drag end logic here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h4 className="font-fantasy font-bold text-dungeon-snow text-shadow">
          Inventory
        </h4>
        <span className="text-sm text-mystical-amber font-medium px-3 py-1 glass-panel-light rounded-lg">
          {inventory.length}/20
        </span>
      </motion.div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-4 gap-3">
        {inventory.map((item, index) => {
          const rarityConfig = getRarityConfig(item.rarity);
          const itemIcon = getItemIcon(item.type);
          const IconComponent = itemIcon.icon;
          
          return (
            <motion.div
              key={item.id}
              className={`inventory-item ${item.rarity} ${rarityConfig.border} ${rarityConfig.glow} p-3 rounded-xl cursor-pointer relative overflow-hidden`}
              onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragEnd={handleDragEnd}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Rarity Background */}
              <div className={`absolute inset-0 ${rarityConfig.bg} opacity-50`}></div>
              
              {/* Item Icon */}
              <div className="relative z-10 w-10 h-10 glass-panel-light rounded-lg mb-2 flex items-center justify-center">
                <IconComponent size={20} className={itemIcon.color} />
              </div>
              
              {/* Item Name */}
              <div className="relative z-10 text-xs text-dungeon-snow font-medium truncate mb-1">
                {item.name}
              </div>
              
              {/* Item Details */}
              <div className="relative z-10 flex justify-between items-center">
                {item.quantity && (
                  <span className="text-xs text-mystical-amber font-bold bg-dungeon-dark/50 px-1 rounded">
                    {item.quantity}
                  </span>
                )}
                {item.equipped && (
                  <span className="text-xs text-mystical-amber font-bold bg-mystical-amber/20 px-1 rounded">
                    E
                  </span>
                )}
              </div>
              
              {/* Selection Indicator */}
              {selectedItem?.id === item.id && (
                <motion.div
                  className="absolute inset-0 border-2 border-mystical-amber rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </motion.div>
          );
        })}
        
        {/* Empty Slots */}
        {Array.from({ length: Math.max(0, 20 - inventory.length) }).map((_, index) => (
          <motion.div 
            key={`empty-${index}`} 
            className="inventory-slot h-20 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: (inventory.length + index) * 0.05 }}
          />
        ))}
      </div>

      {/* Selected Item Details */}
      {selectedItem && (
        <motion.div
          className="glass-panel rounded-xl p-4 border border-mystical-amber/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h5 className="font-fantasy font-bold text-dungeon-snow mb-1 text-shadow">
                {selectedItem.name}
              </h5>
              <p className="text-sm text-mystical-amber capitalize font-medium">
                {selectedItem.type} • {selectedItem.rarity}
              </p>
            </div>
            <motion.button
              onClick={() => setSelectedItem(null)}
              className="p-1 hover:bg-dungeon-stone/20 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={16} className="text-dungeon-light" />
            </motion.button>
          </div>
          
          {selectedItem.description && (
            <p className="text-sm text-dungeon-pearl mb-4 leading-relaxed">
              {selectedItem.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2">
            {!selectedItem.equipped && selectedItem.type !== 'consumable' && (
              <motion.button 
                className="px-4 py-2 bg-gradient-to-r from-mystical-amber to-mystical-gold text-dungeon-dark rounded-lg text-sm font-medium shadow-glow-sm hover:shadow-glow transition-all duration-300"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                Equip
              </motion.button>
            )}
            {selectedItem.equipped && (
              <motion.button 
                className="px-4 py-2 bg-gradient-to-r from-dungeon-stone to-dungeon-mist text-dungeon-snow rounded-lg text-sm font-medium hover:bg-dungeon-light/20 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                Unequip
              </motion.button>
            )}
            {selectedItem.type === 'consumable' && (
              <motion.button 
                className="px-4 py-2 bg-gradient-to-r from-mystical-emerald to-mystical-emerald-dark text-dungeon-dark rounded-lg text-sm font-medium shadow-glow-green hover:shadow-glow-green transition-all duration-300"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                Use
              </motion.button>
            )}
            <motion.button 
              className="px-4 py-2 bg-gradient-to-r from-mystical-crimson to-mystical-crimson-dark text-dungeon-snow rounded-lg text-sm font-medium hover:shadow-glow-red transition-all duration-300"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              Drop
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Enhanced Quests Panel Component
const QuestsPanel = ({ quests }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedQuest, setSelectedQuest] = useState(null);

  const filteredQuests = quests.filter(quest => 
    activeTab === 'all' || quest.status === activeTab
  );

  const getQuestStatusConfig = (status) => {
    const configs = {
      active: {
        bg: 'bg-mystical-sapphire/20',
        border: 'border-mystical-sapphire/50',
        badge: 'bg-mystical-sapphire text-dungeon-dark',
        icon: Clock,
        iconColor: 'text-mystical-sapphire'
      },
      completed: {
        bg: 'bg-mystical-emerald/20',
        border: 'border-mystical-emerald/50',
        badge: 'bg-mystical-emerald text-dungeon-dark',
        icon: Check,
        iconColor: 'text-mystical-emerald'
      },
      failed: {
        bg: 'bg-mystical-crimson/20',
        border: 'border-mystical-crimson/50',
        badge: 'bg-mystical-crimson text-dungeon-snow',
        icon: X,
        iconColor: 'text-mystical-crimson'
      }
    };
    return configs[status] || configs.active;
  };

  const questTabs = [
    { id: 'active', label: 'Active', count: quests.filter(q => q.status === 'active').length },
    { id: 'completed', label: 'Done', count: quests.filter(q => q.status === 'completed').length },
    { id: 'all', label: 'All', count: quests.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h4 className="font-fantasy font-bold text-dungeon-snow text-shadow">
          Quests
        </h4>
        <span className="text-sm text-mystical-amber font-medium px-3 py-1 glass-panel-light rounded-lg">
          {filteredQuests.length}
        </span>
      </motion.div>

      {/* Quest Tabs */}
      <div className="flex space-x-2">
        {questTabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-mystical-sapphire text-dungeon-dark shadow-glow-blue'
                : 'glass-panel-light text-dungeon-pearl hover:text-dungeon-snow hover:bg-dungeon-stone/20'
            }`}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-dungeon-dark/20' : 'bg-mystical-amber/20 text-mystical-amber'
              }`}>
                {tab.count}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Quest List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredQuests.length === 0 ? (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ScrollText size={48} className="mx-auto text-dungeon-mist mb-4" />
            <p className="text-dungeon-pearl">No quests found</p>
          </motion.div>
        ) : (
          filteredQuests.map((quest, index) => {
            const statusConfig = getQuestStatusConfig(quest.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <motion.div
                key={quest.id}
                className={`glass-panel-light rounded-xl p-4 cursor-pointer transition-all duration-300 ${statusConfig.border} hover:shadow-glow-sm ${
                  selectedQuest?.id === quest.id ? 'ring-2 ring-mystical-amber/50' : ''
                }`}
                onClick={() => setSelectedQuest(selectedQuest?.id === quest.id ? null : quest)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Quest Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                      <StatusIcon size={16} className={statusConfig.iconColor} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-fantasy font-bold text-dungeon-snow text-sm mb-1 text-shadow">
                        {quest.title}
                      </h5>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusConfig.badge}`}>
                        {quest.status === 'active' ? 'Active' : quest.status === 'completed' ? 'Completed' : 'Failed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quest Description */}
                <p className="text-sm text-dungeon-pearl mb-3 leading-relaxed">
                  {quest.description}
                </p>

                {/* Quest Progress */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-mystical-amber font-medium">Progress:</span>
                    <span className="text-xs text-dungeon-snow font-bold">{quest.progress}</span>
                  </div>
                  
                  {quest.status === 'active' && (
                    <motion.button 
                      className="text-xs text-mystical-sapphire hover:text-mystical-sapphire-dark font-medium px-2 py-1 rounded-lg hover:bg-mystical-sapphire/10 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle quest tracking
                      }}
                    >
                      Track
                    </motion.button>
                  )}
                </div>

                {/* Expanded Quest Details */}
                {selectedQuest?.id === quest.id && (
                  <motion.div
                    className="mt-4 pt-4 border-t border-dungeon-stone/30"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    {quest.objectives && (
                      <div className="mb-3">
                        <h6 className="text-xs font-bold text-mystical-amber mb-2">Objectives:</h6>
                        <ul className="space-y-1">
                          {quest.objectives.map((objective, idx) => (
                            <li key={idx} className="text-xs text-dungeon-pearl flex items-center space-x-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${objective.completed ? 'bg-mystical-emerald' : 'bg-dungeon-mist'}`}></div>
                              <span className={objective.completed ? 'line-through opacity-75' : ''}>{objective.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {quest.rewards && (
                      <div>
                        <h6 className="text-xs font-bold text-mystical-amber mb-2">Rewards:</h6>
                        <div className="flex flex-wrap gap-1">
                          {quest.rewards.map((reward, idx) => (
                            <span key={idx} className="text-xs bg-mystical-amber/20 text-mystical-amber px-2 py-1 rounded-lg">
                              {reward}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
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
    { value: 'comic', label: 'Comic' }
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
          additional_context: additionalContext
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
          created_at: new Date().toISOString()
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
          task.task_id === taskId ? { ...task, ...result } : task
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
    maxStoryLength: 100
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
                ? "Try adjusting your search or filters" 
                : "Start by generating your first scenario!"}
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
