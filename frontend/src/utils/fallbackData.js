/**
 * Fallback Data Utility
 * 
 * Provides offline fallback data for when backend services are unavailable.
 * This replaces the hardcoded data that was previously scattered throughout the application.
 */

// Default character templates for offline mode
export const defaultCharacterTemplates = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'A brave fighter with strength and courage',
    stats: {
      health: 100,
      attack: 15,
      defense: 12,
      magic: 5,
      speed: 8,
    },
    startingEquipment: ['Iron Sword', 'Leather Armor', 'Health Potion'],
    backstory: 'A seasoned warrior who has faced many battles and emerged victorious.',
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'A wielder of arcane magic and ancient knowledge',
    stats: {
      health: 70,
      attack: 8,
      defense: 6,
      magic: 18,
      speed: 10,
    },
    startingEquipment: ['Magic Staff', 'Robes', 'Mana Potion'],
    backstory: 'A scholar of the mystical arts who seeks to unlock the secrets of magic.',
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'A stealthy character who relies on cunning and agility',
    stats: {
      health: 80,
      attack: 12,
      defense: 8,
      magic: 7,
      speed: 16,
    },
    startingEquipment: ['Daggers', 'Cloak', 'Lockpicks'],
    backstory: 'A nimble and clever individual who thrives in the shadows.',
  },
];

// Default scenario templates for offline gameplay
export const defaultScenarios = [
  {
    id: 'forest_clearing',
    title: 'Forest Clearing',
    description: 'You find yourself in a peaceful forest clearing. Sunlight filters through the canopy above.',
    setting: 'forest',
    difficulty: 'easy',
    possibleActions: [
      'Explore the surrounding area',
      'Rest and recover',
      'Search for useful items',
      'Listen for sounds in the forest',
    ],
    outcomes: {
      explore: 'You discover a hidden path leading deeper into the forest.',
      rest: 'You feel refreshed and your health is restored.',
      search: 'You find some berries and herbs that could be useful.',
      listen: 'You hear the distant sound of running water to the east.',
    },
  },
  {
    id: 'ancient_ruins',
    title: 'Ancient Ruins',
    description: 'Before you stand the crumbling remains of an ancient temple. Strange symbols are carved into the weathered stone.',
    setting: 'ruins',
    difficulty: 'medium',
    possibleActions: [
      'Examine the symbols',
      'Enter the ruins carefully',
      'Search the perimeter',
      'Try to decipher the ancient text',
    ],
    outcomes: {
      examine: 'The symbols seem to pulse with a faint magical energy.',
      enter: 'You step inside, your footsteps echoing in the empty halls.',
      search: 'You find old coins scattered around the entrance.',
      decipher: 'You manage to translate a few words: "Beware the guardian within."',
    },
  },
  {
    id: 'mountain_cave',
    title: 'Mountain Cave',
    description: 'A dark cave entrance yawns before you. You can feel cool air flowing from within.',
    setting: 'cave',
    difficulty: 'hard',
    possibleActions: [
      'Light a torch and enter',
      'Call out into the darkness',
      'Throw a stone inside',
      'Camp outside and wait',
    ],
    outcomes: {
      light: 'Your torch illuminates strange crystalline formations on the cave walls.',
      call: 'Your voice echoes back, but you hear something else stirring in the depths.',
      throw: 'The stone clatters into the darkness. After a moment, you hear a low growl.',
      camp: 'As night falls, you see glowing eyes watching you from the cave entrance.',
    },
  },
];

// Emergency fallback responses - only used when AI systems are completely unavailable
export const emergencyFallbackResponses = {
  system_unavailable: [
    'The AI storytelling system is temporarily unavailable. Your action has been noted and will be processed when the system returns.',
    'Connection to the AI narrative engine is lost. Your choice is being saved for when full storytelling capabilities are restored.',
    'The dynamic story system is offline. Your action will be integrated into the narrative once AI services are available.',
  ],
  ai_generation_failed: [
    'The AI encountered an issue generating a response. Your action is being processed through backup systems.',
    'Story generation temporarily failed. Your choice is being handled by emergency narrative protocols.',
    'The AI storytelling engine needs a moment to process your complex action. Please try again shortly.',
  ],
  context_loading: [
    'Loading your story context and character history...',
    'Gathering narrative threads and world state information...',
    'Preparing personalized story response based on your journey...',
  ]
};

// Note: These responses should only be used in emergency situations
// The primary system should always attempt AI-driven narrative generation
export const getEmergencyResponse = (category = 'system_unavailable') => {
  const responses = emergencyFallbackResponses[category] || emergencyFallbackResponses.system_unavailable;
  return responses[Math.floor(Math.random() * responses.length)];
};

// Default game configuration
export const defaultGameConfig = {
  aiModels: [
    {
      id: 'fallback',
      name: 'Offline Mode',
      description: 'Basic offline gameplay with predefined responses',
      capabilities: ['basic_responses', 'scenario_progression'],
      isDefault: true,
    },
  ],
  gameSettings: {
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    maxSaveSlots: 5,
    difficulty: 'medium',
    enableSound: true,
    enableAnimations: true,
  },
  ui: {
    theme: 'dark',
    fontSize: 'medium',
    showTutorial: true,
    compactMode: false,
  },
};

// Default inventory items
export const defaultItems = [
  {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 50 health points',
    type: 'consumable',
    effect: { health: 50 },
    rarity: 'common',
  },
  {
    id: 'mana_potion',
    name: 'Mana Potion',
    description: 'Restores 30 mana points',
    type: 'consumable',
    effect: { mana: 30 },
    rarity: 'common',
  },
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A sturdy weapon forged from iron',
    type: 'weapon',
    stats: { attack: 10 },
    rarity: 'common',
  },
  {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Basic protection made from treated leather',
    type: 'armor',
    stats: { defense: 5 },
    rarity: 'common',
  },
];

// Default quests
export const defaultQuests = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Begin your adventure by exploring the world around you.',
    objectives: [
      'Explore your starting location',
      'Interact with your environment',
      'Make your first decision',
    ],
    rewards: {
      experience: 100,
      items: ['health_potion'],
    },
    status: 'active',
  },
];

// Legacy function - now redirects to emergency responses
export const getRandomResponse = (category = 'system_unavailable') => {
  console.warn('getRandomResponse is deprecated. Use AI-driven narrative generation instead.');
  return getEmergencyResponse(category);
};

// Utility function to get random scenario
export const getRandomScenario = () => {
  return defaultScenarios[Math.floor(Math.random() * defaultScenarios.length)];
};

// Utility function to create a new game state
export const createDefaultGameState = (characterTemplate = null) => {
  const character = characterTemplate || defaultCharacterTemplates[0];
  
  return {
    character: {
      ...character,
      level: 1,
      experience: 0,
      inventory: [...character.startingEquipment],
    },
    currentScenario: defaultScenarios[0],
    quests: [...defaultQuests],
    gameHistory: [],
    settings: { ...defaultGameConfig.gameSettings },
    metadata: {
      createdAt: new Date().toISOString(),
      lastPlayed: new Date().toISOString(),
      playTime: 0,
      version: '1.0.0',
    },
  };
};

// Emergency data access - only for system failures
export const getEmergencyData = () => ({
  defaultCharacterTemplates,
  defaultScenarios,
  emergencyFallbackResponses,
  defaultGameConfig,
  defaultItems,
  defaultQuests,
  getEmergencyResponse,
  getRandomScenario,
  createDefaultGameState,
  // Minimal emergency data
  emergencyCharacter: defaultCharacterTemplates[0],
  emergencyInventory: defaultItems.slice(0, 2), // Basic health and mana potions
  emergencyWorldState: {
    current_location: 'Starting Area',
    time_of_day: 'unknown',
    weather: 'unclear',
    environment_description: 'AI systems are loading. Please wait for full narrative generation.',
  },
});

// Legacy export for backward compatibility
const fallbackDataExport = {
  defaultCharacterTemplates,
  defaultScenarios,
  emergencyFallbackResponses,
  defaultGameConfig,
  defaultItems,
  defaultQuests,
  getRandomResponse, // Deprecated
  getEmergencyResponse,
  getRandomScenario,
  createDefaultGameState,
  getEmergencyData,
};

export default fallbackDataExport;
