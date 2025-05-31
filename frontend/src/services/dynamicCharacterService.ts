// Dynamic Character Service - AI-driven character initialization
// Replaces hardcoded character defaults with AI-generated values

import { Character, CharacterStats } from '@/types';
// import { gameAPI } from '@/services/api/client'; // TODO: Implement AI character generation API
import { DEFAULT_VALUES } from '@/utils/constants';

export interface CharacterGenerationContext {
  characterName: string;
  className: string;
  background?: string;
  scenarioId?: string;
  lorebookId?: string;
  playerPreferences?: {
    playstyle?: 'combat' | 'exploration' | 'social' | 'balanced';
    difficulty?: 'easy' | 'medium' | 'hard';
    focusAreas?: string[];
  };
}

export interface AICharacterSuggestion {
  stats: CharacterStats;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  carryWeight: number;
  suggestedBackground?: string;
  personalityTraits?: string[];
  startingEquipment?: string[];
  reasoning?: string;
}

class DynamicCharacterService {
  /**
   * Generate AI-driven character stats and attributes
   */
  async generateCharacterAttributes(context: CharacterGenerationContext): Promise<AICharacterSuggestion> {
    try {
      // TODO: Implement AI character generation API call
      // For now, use intelligent fallback based on class and context
      console.log('AI character generation not yet implemented, using intelligent fallback');
      return this.generateIntelligentFallback(context);
    } catch (error) {
      console.warn('Character generation failed, using intelligent fallback:', error);
      return this.generateIntelligentFallback(context);
    }
  }

  /**
   * Parse AI response into character suggestion
   */
  private parseAICharacterResponse(aiResponse: any): AICharacterSuggestion {
    return {
      stats: {
        strength: aiResponse.stats?.strength || 10,
        dexterity: aiResponse.stats?.dexterity || 10,
        intelligence: aiResponse.stats?.intelligence || 10,
        constitution: aiResponse.stats?.constitution || 10,
        wisdom: aiResponse.stats?.wisdom || 10,
        charisma: aiResponse.stats?.charisma || 10,
      },
      health: aiResponse.health || 100,
      maxHealth: aiResponse.max_health || 100,
      mana: aiResponse.mana || 50,
      maxMana: aiResponse.max_mana || 50,
      carryWeight: aiResponse.carry_weight || 100,
      suggestedBackground: aiResponse.suggested_background,
      personalityTraits: aiResponse.personality_traits || [],
      startingEquipment: aiResponse.starting_equipment || [],
      reasoning: aiResponse.reasoning,
    };
  }

  /**
   * Generate intelligent fallback based on class and context
   */
  private generateIntelligentFallback(context: CharacterGenerationContext): AICharacterSuggestion {
    const classBasedStats = this.getClassBasedStats(context.className);
    const backgroundModifiers = this.getBackgroundModifiers(context.background);

    return {
      stats: this.combineStatModifiers(classBasedStats, backgroundModifiers),
      health: this.calculateHealthFromClass(context.className),
      maxHealth: this.calculateHealthFromClass(context.className),
      mana: this.calculateManaFromClass(context.className),
      maxMana: this.calculateManaFromClass(context.className),
      carryWeight: this.calculateCarryWeightFromClass(context.className),
      suggestedBackground: context.background || this.suggestBackgroundForClass(context.className),
      personalityTraits: this.getClassPersonalityTraits(context.className),
      startingEquipment: this.getClassStartingEquipment(context.className),
      reasoning: `Generated based on ${context.className} class archetype and ${context.background || 'default'} background.`,
    };
  }

  /**
   * Get base stats for character class
   */
  private getClassBasedStats(className: string): CharacterStats {
    const classStats: Record<string, CharacterStats> = {
      warrior: { strength: 15, dexterity: 12, intelligence: 8, constitution: 14, wisdom: 10, charisma: 9 },
      mage: { strength: 8, dexterity: 10, intelligence: 15, constitution: 10, wisdom: 14, charisma: 11 },
      rogue: { strength: 10, dexterity: 15, intelligence: 12, constitution: 11, wisdom: 13, charisma: 10 },
      cleric: { strength: 12, dexterity: 9, intelligence: 11, constitution: 13, wisdom: 15, charisma: 12 },
      ranger: { strength: 13, dexterity: 14, intelligence: 10, constitution: 12, wisdom: 14, charisma: 9 },
      bard: { strength: 9, dexterity: 12, intelligence: 12, constitution: 10, wisdom: 11, charisma: 15 },
      paladin: { strength: 14, dexterity: 10, intelligence: 9, constitution: 13, wisdom: 12, charisma: 14 },
      barbarian: { strength: 16, dexterity: 12, intelligence: 7, constitution: 15, wisdom: 11, charisma: 8 },
    };

    return classStats[className.toLowerCase()] || {
      strength: 10, dexterity: 10, intelligence: 10, constitution: 10, wisdom: 10, charisma: 10
    };
  }

  /**
   * Get stat modifiers based on background
   */
  private getBackgroundModifiers(background?: string): Partial<CharacterStats> {
    if (!background) return {};

    const backgroundModifiers: Record<string, Partial<CharacterStats>> = {
      noble: { charisma: 2, intelligence: 1 },
      criminal: { dexterity: 2, charisma: 1 },
      folk_hero: { strength: 1, constitution: 1, charisma: 1 },
      scholar: { intelligence: 2, wisdom: 1 },
      soldier: { strength: 1, constitution: 2 },
      merchant: { charisma: 1, intelligence: 1, wisdom: 1 },
      hermit: { wisdom: 2, constitution: 1 },
      entertainer: { charisma: 2, dexterity: 1 },
    };

    return backgroundModifiers[background.toLowerCase()] || {};
  }

  /**
   * Combine base stats with modifiers
   */
  private combineStatModifiers(baseStats: CharacterStats, modifiers: Partial<CharacterStats>): CharacterStats {
    return {
      strength: Math.min(20, baseStats.strength + (modifiers.strength || 0)),
      dexterity: Math.min(20, baseStats.dexterity + (modifiers.dexterity || 0)),
      intelligence: Math.min(20, baseStats.intelligence + (modifiers.intelligence || 0)),
      constitution: Math.min(20, baseStats.constitution + (modifiers.constitution || 0)),
      wisdom: Math.min(20, baseStats.wisdom + (modifiers.wisdom || 0)),
      charisma: Math.min(20, baseStats.charisma + (modifiers.charisma || 0)),
    };
  }

  /**
   * Calculate health based on class
   */
  private calculateHealthFromClass(className: string): number {
    const classHealthMultipliers: Record<string, number> = {
      warrior: 1.4,
      barbarian: 1.5,
      paladin: 1.3,
      cleric: 1.1,
      ranger: 1.2,
      rogue: 1.0,
      bard: 1.0,
      mage: 0.8,
    };

    const multiplier = classHealthMultipliers[className.toLowerCase()] || 1.0;
    return Math.round(DEFAULT_VALUES.FALLBACK_CHARACTER_HEALTH * multiplier);
  }

  /**
   * Calculate mana based on class
   */
  private calculateManaFromClass(className: string): number {
    const classManaMultipliers: Record<string, number> = {
      mage: 2.0,
      cleric: 1.5,
      bard: 1.3,
      paladin: 1.0,
      ranger: 0.8,
      warrior: 0.3,
      rogue: 0.5,
      barbarian: 0.2,
    };

    const multiplier = classManaMultipliers[className.toLowerCase()] || 1.0;
    return Math.round(DEFAULT_VALUES.FALLBACK_CHARACTER_MANA * multiplier);
  }

  /**
   * Calculate carry weight based on class
   */
  private calculateCarryWeightFromClass(className: string): number {
    const classCarryMultipliers: Record<string, number> = {
      warrior: 1.3,
      barbarian: 1.4,
      paladin: 1.2,
      ranger: 1.1,
      cleric: 1.0,
      rogue: 0.9,
      bard: 0.8,
      mage: 0.7,
    };

    const multiplier = classCarryMultipliers[className.toLowerCase()] || 1.0;
    return Math.round(DEFAULT_VALUES.FALLBACK_CARRY_WEIGHT * multiplier);
  }

  /**
   * Suggest background for class
   */
  private suggestBackgroundForClass(className: string): string {
    const classSuggestedBackgrounds: Record<string, string> = {
      warrior: 'soldier',
      mage: 'scholar',
      rogue: 'criminal',
      cleric: 'hermit',
      ranger: 'folk_hero',
      bard: 'entertainer',
      paladin: 'noble',
      barbarian: 'folk_hero',
    };

    return classSuggestedBackgrounds[className.toLowerCase()] || 'folk_hero';
  }

  /**
   * Get personality traits for class
   */
  private getClassPersonalityTraits(className: string): string[] {
    const classTraits: Record<string, string[]> = {
      warrior: ['brave', 'disciplined', 'protective'],
      mage: ['curious', 'analytical', 'patient'],
      rogue: ['cunning', 'independent', 'adaptable'],
      cleric: ['compassionate', 'faithful', 'wise'],
      ranger: ['observant', 'self-reliant', 'nature-loving'],
      bard: ['charismatic', 'creative', 'sociable'],
      paladin: ['righteous', 'determined', 'honorable'],
      barbarian: ['fierce', 'instinctive', 'passionate'],
    };

    return classTraits[className.toLowerCase()] || ['determined', 'curious', 'adaptable'];
  }

  /**
   * Get starting equipment for class
   */
  private getClassStartingEquipment(className: string): string[] {
    const classEquipment: Record<string, string[]> = {
      warrior: ['iron sword', 'leather armor', 'wooden shield'],
      mage: ['wooden staff', 'spell component pouch', 'robes'],
      rogue: ['dagger', 'leather armor', 'thieves tools'],
      cleric: ['mace', 'chain mail', 'holy symbol'],
      ranger: ['longbow', 'leather armor', 'survival kit'],
      bard: ['rapier', 'leather armor', 'musical instrument'],
      paladin: ['longsword', 'chain mail', 'holy symbol'],
      barbarian: ['greataxe', 'hide armor', 'tribal totem'],
    };

    return classEquipment[className.toLowerCase()] || ['basic weapon', 'simple armor', 'adventuring gear'];
  }

  /**
   * Get dynamic placeholder text based on character context
   */
  getDynamicPlaceholder(character?: Character, worldState?: any): string {
    if (!character) {
      return "What do you do? (Press Enter to submit)";
    }

    const contextualPlaceholders = [
      `What does ${character.name} do next?`,
      `How does ${character.name} respond?`,
      `What action does ${character.name} take?`,
      `Describe ${character.name}'s next move...`,
    ];

    // Add context-specific placeholders based on world state
    if (worldState?.current_location) {
      contextualPlaceholders.push(
        `What does ${character.name} do in ${worldState.current_location}?`,
        `How does ${character.name} explore ${worldState.current_location}?`
      );
    }

    if (worldState?.available_actions?.length > 0) {
      contextualPlaceholders.push(
        `Choose an action for ${character.name}...`,
        `What's ${character.name}'s next decision?`
      );
    }

    return contextualPlaceholders[Math.floor(Math.random() * contextualPlaceholders.length)];
  }
}

export const dynamicCharacterService = new DynamicCharacterService();
