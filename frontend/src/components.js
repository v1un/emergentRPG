import React, { useState, useRef, useEffect } from 'react';
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
  Home
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
export const LandingPage = ({ onStartGame }) => {
  const scenarios = [
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
    },
    {
      id: 4,
      title: "Modern Mystery",
      description: "Solve crimes and uncover conspiracies in the modern world",
      image: "https://images.unsplash.com/photo-1591340481334-cf7a7edd2989?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwyfHxmYW50YXN5JTIwbGFuZHNjYXBlfGVufDB8fHx0ZWFsfDE3NDgwMTQ3NjZ8MA&ixlib=rb-4.1.0&q=85",
      intro: "Rain pours down on the city streets as you arrive at the crime scene. Something isn't right about this case..."
    },
    {
      id: 5,
      title: "Horror Mansion",
      description: "Survive a night in a haunted mansion filled with terrors",
      image: "https://images.pexels.com/photos/11785594/pexels-photo-11785594.jpeg",
      intro: "Thunder crashes as you approach the abandoned mansion. The locals warned you not to come here alone..."
    },
    {
      id: 6,
      title: "Cyberpunk City",
      description: "Navigate the neon-lit streets of a dystopian future",
      image: "https://images.pexels.com/photos/1693095/pexels-photo-1693095.jpeg",
      intro: "Neon lights reflect off rain-slicked streets as you jack into the neural network. Time to infiltrate the corporation..."
    }
  ];

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
              onClick={() => onStartGame({
                id: 1,
                title: "Fantasy Adventure",
                description: "Embark on a magical quest in a world of dragons and wizards",
                image: "https://images.unsplash.com/photo-1598205542984-6720bbcf74f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwbGFuZHNjYXBlfGVufDB8fHx0ZWFsfDE3NDgwMTQ3NjZ8MA&ixlib=rb-4.1.0&q=85",
                intro: "You awaken in a mystical forest, ancient magic flowing through your veins. Your destiny as a hero begins now..."
              })}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {scenarios.map((scenario, index) => (
              <motion.div
                key={scenario.id}
                className="scenario-card rounded-xl overflow-hidden cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onStartGame(scenario)}
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
                  <button className="flex items-center space-x-2 text-dungeon-orange hover:text-dungeon-orange-dark transition-colors">
                    <Play size={16} />
                    <span>Start Adventure</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

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
    { text: "Look around", icon: <Star size={16} /> },
    { text: "Attack", icon: <Sword size={16} /> },
    { text: "Defend", icon: <Shield size={16} /> },
    { text: "Cast spell", icon: <Wand2 size={16} /> },
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
            backgroundImage: `url('https://images.unsplash.com/photo-1598205542984-6720bbcf74f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwbGFuZHNjYXBlfGVufDB8fHx0ZWFsfDE3NDgwMTQ3NjZ8MA&ixlib=rb-4.1.0&q=85')`,
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed',
            backgroundPosition: 'center'
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
      legendary: 'border-orange-400'
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
    activeTab === 'all' || quest.status === activeTab
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
          { id: 'all', label: 'All' }
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