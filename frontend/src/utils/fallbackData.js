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

// Fallback AI responses for different action types
export const fallbackAIResponses = {
  combat: [
    'You strike with precision, dealing damage to your opponent.',
    'Your attack connects, but your enemy retaliates quickly.',
    'You dodge the incoming attack and counter with your own.',
    'The battle intensifies as both fighters exchange blows.',
    'You find an opening in your opponent\'s defense.',
  ],
  exploration: [
    'You carefully examine your surroundings, taking note of every detail.',
    'Your exploration reveals something interesting ahead.',
    'You move cautiously through the area, alert for any danger.',
    'The path forward becomes clearer as you investigate.',
    'Your careful observation pays off as you spot something useful.',
  ],
  social: [
    'You engage in conversation, choosing your words carefully.',
    'The interaction reveals important information about your situation.',
    'Your diplomatic approach opens new possibilities.',
    'You build rapport with the character, gaining their trust.',
    'The conversation takes an unexpected but interesting turn.',
  ],
  magic: [
    'You channel magical energy, feeling it flow through you.',
    'Your spell takes effect, altering the situation around you.',
    'The magical forces respond to your will and concentration.',
    'You sense the arcane energies shifting in response to your actions.',
    'Your magical intervention creates new opportunities.',
  ],
  stealth: [
    'You move silently, avoiding detection.',
    'Your stealthy approach allows you to gather valuable information.',
    'You remain hidden while observing the situation.',
    'Your careful movements keep you out of sight.',
    'You slip past unnoticed, maintaining the element of surprise.',
  ],
  default: [
    'You take action, and the world responds to your choice.',
    'Your decision leads to an interesting development.',
    'The situation evolves based on your actions.',
    'You move forward with determination.',
    'Your choice sets new events in motion.',
  ],
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

// Utility function to get random response
export const getRandomResponse = (category = 'default') => {
  const responses = fallbackAIResponses[category] || fallbackAIResponses.default;
  return responses[Math.floor(Math.random() * responses.length)];
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

// Utility function to get all fallback data
export const getFallbackData = () => ({
  defaultCharacterTemplates,
  defaultScenarios,
  fallbackAIResponses,
  defaultGameConfig,
  defaultItems,
  defaultQuests,
  getRandomResponse,
  getRandomScenario,
  createDefaultGameState,
  // Additional utility data
  defaultCharacter: defaultCharacterTemplates[0],
  defaultInventory: defaultItems.slice(0, 2), // Health and mana potions
  defaultWorldState: {
    current_location: 'Forest Clearing',
    time_of_day: 'morning',
    weather: 'clear',
    environment_description: 'A peaceful clearing surrounded by ancient trees.',
  },
});

const fallbackDataExport = {
  defaultCharacterTemplates,
  defaultScenarios,
  fallbackAIResponses,
  defaultGameConfig,
  defaultItems,
  defaultQuests,
  getRandomResponse,
  getRandomScenario,
  createDefaultGameState,
  getFallbackData,
};

export default fallbackDataExport;
