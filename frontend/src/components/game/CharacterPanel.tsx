// Character Panel Component - Enhanced character management interface

'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentCharacter, useGameStore } from '@/stores/gameStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/helpers';
import { CharacterStats, EquipmentSlot } from '@/types';
import {
  UserIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  StarIcon,
  ArrowUpIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolidIcon,
  SparklesIcon as SparklesSolidIcon,
  TrophyIcon as TrophySolidIcon,
} from '@heroicons/react/24/solid';

// Level-up notification component
interface LevelUpNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  newLevel: number;
  statIncreases: Partial<CharacterStats>;
}

function LevelUpNotification({ isVisible, onClose, newLevel, statIncreases }: LevelUpNotificationProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 mx-4">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrophySolidIcon className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-yellow-600">Level Up!</CardTitle>
          <p className="text-muted-foreground">
            Congratulations! You&apos;ve reached level {newLevel}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <h4 className="font-semibold mb-2">Stat Increases:</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statIncreases).map(([stat, increase]) => (
                <div key={stat} className="flex items-center justify-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                  <ArrowUpIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm capitalize">{stat}</span>
                  <span className="text-sm font-bold text-green-600">+{increase}</span>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={onClose} className="w-full">
            Continue Adventure
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Equipment slot component
interface EquipmentSlotProps {
  slot: EquipmentSlot;
  item?: string;
  onEquip: (slot: EquipmentSlot) => void;
  onUnequip: (slot: EquipmentSlot) => void;
}

function EquipmentSlotComponent({ slot, item, onEquip, onUnequip }: EquipmentSlotProps) {
  const slotIcons = {
    weapon: <WrenchScrewdriverIcon className="h-6 w-6" />,
    helmet: <UserIcon className="h-6 w-6" />,
    chest: <ShieldCheckIcon className="h-6 w-6" />,
    legs: <CogIcon className="h-6 w-6" />,
    boots: <CogIcon className="h-6 w-6" />,
    gloves: <CogIcon className="h-6 w-6" />,
    ring: <StarIcon className="h-6 w-6" />,
    necklace: <StarIcon className="h-6 w-6" />,
    shield: <ShieldCheckIcon className="h-6 w-6" />,
  };

  return (
    <div className="relative group">
      <div
        className={cn(
          'w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg',
          'flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors',
          'group-hover:bg-gray-50 dark:group-hover:bg-gray-800',
          item && 'border-solid border-blue-500 bg-blue-50 dark:bg-blue-950'
        )}
        onClick={() => item ? onUnequip(slot) : onEquip(slot)}
      >
        {slotIcons[slot]}
      </div>
      <div className="text-xs text-center mt-1 capitalize">{slot}</div>
      {item && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {item || `Empty ${slot} slot`}
      </div>
    </div>
  );
}

export function CharacterPanel() {
  const character = useCurrentCharacter();
  const { updateSession } = useGameStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'equipment'>('overview');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number; statIncreases: Partial<CharacterStats> }>({
    newLevel: 1,
    statIncreases: {}
  });

  // Check for level up
  useEffect(() => {
    if (character) {
      const expectedLevel = Math.floor(character.experience / 1000) + 1;
      if (expectedLevel > character.level) {
        // Calculate stat increases based on character class
        const statIncreases: Partial<CharacterStats> = {};
        
        // Determine stat increases based on character class
        switch(character.class_name?.toLowerCase()) {
          case 'warrior':
            statIncreases.strength = 2;
            statIncreases.constitution = 1;
            break;
          case 'mage':
            statIncreases.intelligence = 2;
            statIncreases.wisdom = 1;
            break;
          case 'rogue':
            statIncreases.dexterity = 2;
            statIncreases.charisma = 1;
            break;
          default:
            // Default stat increases if class not recognized
            statIncreases.strength = 1;
            statIncreases.constitution = 1;
        }
        
        setLevelUpData({
          newLevel: expectedLevel,
          statIncreases
        });
        setShowLevelUp(true);

        // Update character level
        updateSession({
          character: {
            ...character,
            level: expectedLevel,
            max_health: character.max_health + 5, // Level up bonus
            max_mana: character.max_mana + 3,
            stats: {
              ...character.stats,
              ...Object.entries(statIncreases).reduce((acc, [stat, increase]) => {
                const statKey = stat as keyof CharacterStats;
                acc[statKey] = (character.stats[statKey] || 0) + (increase || 0);
                return acc;
              }, {} as Partial<CharacterStats>)
            }
          }
        });
      }
    }
  }, [character?.experience, character?.level, character, updateSession]);

  const handleEquipItem = (slot: EquipmentSlot) => {
    // TODO: Open inventory modal to select item
    console.log('Equip item to slot:', slot);
  };

  const handleUnequipItem = (slot: EquipmentSlot) => {
    if (!character) return;

    const updatedEquipment = { ...character.equipped_items };
    delete updatedEquipment[slot];

    updateSession({
      character: {
        ...character,
        equipped_items: updatedEquipment,
      },
    });
  };

  if (!character) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Character Loaded
          </h3>
          <p className="text-muted-foreground">
            Start a game session to view character information.
          </p>
        </div>
      </div>
    );
  }

  const experienceToNext = character.level * 1000; // Simple calculation

  const getStatColor = (value: number) => {
    if (value >= 16) return 'text-purple-600 dark:text-purple-400';
    if (value >= 14) return 'text-blue-600 dark:text-blue-400';
    if (value >= 12) return 'text-green-600 dark:text-green-400';
    if (value >= 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatModifier = (value: number) => {
    const modifier = Math.floor((value - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const renderProgressBar = (current: number, max: number, color: string) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className={cn('h-2 rounded-full transition-all duration-300', color)}
        style={{ width: `${Math.min(100, (current / max) * 100)}%` }}
      />
    </div>
  );

  const renderStatBlock = (stats: CharacterStats) => (
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(stats).map(([statName, value]) => (
        <div key={statName} className="text-center p-3 bg-gradient-primary/20 rounded-lg border border-primary/20 hover:glow-primary transition-all duration-300">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {statName.slice(0, 3)}
          </div>
          <div className={cn('text-2xl font-bold', getStatColor(value))}>
            {value}
          </div>
          <div className="text-xs text-muted-foreground">
            {getStatModifier(value)}
          </div>
        </div>
      ))}
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <UserIcon className="h-4 w-4" /> },
    { id: 'stats', label: 'Stats', icon: <StarIcon className="h-4 w-4" /> },
    { id: 'equipment', label: 'Equipment', icon: <ShieldCheckIcon className="h-4 w-4" /> },
  ];

  return (
    <>
      {/* Level Up Notification */}
      <LevelUpNotification
        isVisible={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        newLevel={levelUpData.newLevel}
        statIncreases={levelUpData.statIncreases}
      />

      <div className="h-full flex flex-col bg-gradient-story relative overflow-hidden">
        {/* Magical Background Effects */}
        <div className="absolute inset-0 bg-magical-dots opacity-20"></div>
        <div className="floating-orb absolute top-10 right-10 w-4 h-4 bg-accent/30 rounded-full animate-float"></div>
        <div className="floating-orb absolute bottom-20 left-8 w-3 h-3 bg-primary/20 rounded-full animate-float-delayed"></div>
        
        {/* Character Header */}
        <div className="p-6 border-b border-primary/20 bg-gradient-primary relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center glow-primary relative">
              <UserIcon className="h-8 w-8 text-primary-foreground" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse glow-accent"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-foreground to-accent bg-clip-text text-transparent">
                {character.name}
              </h2>
              <div className="text-primary-foreground/80 flex items-center space-x-2">
                <span>Level {character.level} {character.class_name}</span>
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              </div>
              {character.background && (
                <p className="text-sm text-primary-foreground/60">{character.background}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-primary/20 bg-gradient-accent/50 relative z-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'stats' | 'equipment')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative',
                'hover:bg-gradient-primary/20 border-b-2',
                activeTab === tab.id 
                  ? 'text-primary border-accent glow-accent bg-gradient-primary/30' 
                  : 'text-muted-foreground border-transparent hover:text-primary'
              )}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-current">{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-accent rounded-full glow-accent"></div>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Vital Stats */}
              <Card className="bg-gradient-primary/30 border-primary/20 backdrop-blur-sm glow-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center space-x-2">
                    <HeartSolidIcon className="h-5 w-5 text-accent" />
                    <span>Vital Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HeartSolidIcon className="h-4 w-4 text-red-500 glow-red" />
                        <span className="text-sm font-medium">Health</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {character.health}/{character.max_health}
                      </span>
                    </div>
                    {renderProgressBar(character.health, character.max_health, 'bg-red-500 glow-red')}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <SparklesSolidIcon className="h-4 w-4 text-blue-500 glow-blue" />
                        <span className="text-sm font-medium">Mana</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {character.mana}/{character.max_mana}
                      </span>
                    </div>
                    {renderProgressBar(character.mana, character.max_mana, 'bg-blue-500 glow-blue')}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrophySolidIcon className="h-4 w-4 text-accent animate-pulse" />
                        <span className="text-sm font-medium">Experience</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Level {character.level + 1}
                      </span>
                    </div>
                    {renderProgressBar(character.experience % experienceToNext, experienceToNext, 'bg-gradient-to-r from-accent to-primary')}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-gradient-accent/30 border-accent/20 backdrop-blur-sm glow-accent/30">
                <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent flex items-center space-x-2">
                    <StarIcon className="h-5 w-5 text-primary" />
                    <span>Quick Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gradient-primary/20 rounded-lg border border-primary/20 hover:glow-primary transition-all duration-300">
                      <div className="text-2xl font-bold text-green-400 glow-green">
                        {Math.floor((character.health / character.max_health) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Health</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-accent/20 rounded-lg border border-accent/20 hover:glow-accent transition-all duration-300">
                      <div className="text-2xl font-bold text-blue-400 glow-blue">
                        {Math.floor((character.mana / character.max_mana) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Mana</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-primary/20 rounded-lg border border-primary/20 hover:glow-primary transition-all duration-300">
                      <div className="text-2xl font-bold text-purple-400 glow-purple">
                        {character.max_carry_weight}
                      </div>
                      <div className="text-sm text-muted-foreground">Carry Weight</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-accent/20 rounded-lg border border-accent/20 hover:glow-accent transition-all duration-300">
                      <div className="text-2xl font-bold text-orange-400 glow-orange">
                        {character.level}
                      </div>
                      <div className="text-sm text-muted-foreground">Level</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <Card className="bg-gradient-primary/30 border-primary/20 backdrop-blur-sm glow-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center space-x-2">
                    <StarIcon className="h-5 w-5 text-accent" />
                    <span>Ability Scores</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderStatBlock(character.stats)}
                </CardContent>
              </Card>

              {/* Derived Stats */}
              <Card className="bg-gradient-accent/30 border-accent/20 backdrop-blur-sm glow-accent/30">
                <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent flex items-center space-x-2">
                    <ShieldCheckIcon className="h-5 w-5 text-primary" />
                    <span>Derived Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gradient-primary/20 rounded-lg border border-primary/20 hover:glow-primary transition-all duration-300">
                      <div className="text-lg font-semibold text-red-400 glow-red">{character.max_health}</div>
                      <div className="text-sm text-muted-foreground">Max Health</div>
                    </div>
                    <div className="p-3 bg-gradient-accent/20 rounded-lg border border-accent/20 hover:glow-accent transition-all duration-300">
                      <div className="text-lg font-semibold text-blue-400 glow-blue">{character.max_mana}</div>
                      <div className="text-sm text-muted-foreground">Max Mana</div>
                    </div>
                    <div className="p-3 bg-gradient-primary/20 rounded-lg border border-primary/20 hover:glow-primary transition-all duration-300">
                      <div className="text-lg font-semibold text-green-400 glow-green">
                        {10 + Math.floor((character.stats.dexterity - 10) / 2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Armor Class</div>
                    </div>
                    <div className="p-3 bg-gradient-accent/20 rounded-lg border border-accent/20 hover:glow-accent transition-all duration-300">
                      <div className="text-lg font-semibold text-purple-400 glow-purple">
                        +{Math.floor(character.level / 4) + 2}
                      </div>
                      <div className="text-sm text-muted-foreground">Proficiency</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="space-y-6">
              <Card className="bg-gradient-primary/30 border-primary/20 backdrop-blur-sm glow-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center space-x-2">
                    <ShieldCheckIcon className="h-5 w-5 text-accent" />
                    <span>Equipment Slots</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4 justify-items-center">
                    {Object.entries(character.equipped_items).map(([slot, item]) => (
                      <EquipmentSlotComponent
                        key={slot}
                        slot={slot as EquipmentSlot}
                        item={item}
                        onEquip={handleEquipItem}
                        onUnequip={handleUnequipItem}
                      />
                    ))}
                    {/* Add empty slots for unequipped items */}
                    {(['weapon', 'helmet', 'chest', 'legs', 'boots', 'gloves', 'ring', 'necklace', 'shield'] as EquipmentSlot[])
                      .filter(slot => !character.equipped_items[slot])
                      .map(slot => (
                        <EquipmentSlotComponent
                          key={slot}
                          slot={slot}
                          onEquip={handleEquipItem}
                          onUnequip={handleUnequipItem}
                        />
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Equipment Effects */}
              <Card className="bg-gradient-accent/30 border-accent/20 backdrop-blur-sm glow-accent/30">
                <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent flex items-center space-x-2">
                    <StarIcon className="h-5 w-5 text-primary" />
                    <span>Equipment Effects</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(character.equipped_items).length > 0 ? (
                      Object.entries(character.equipped_items).map(([slot, item]) => (
                        <div key={slot} className="flex justify-between items-center p-2 bg-gradient-primary/20 rounded border border-primary/20 hover:glow-primary transition-all duration-300">
                          <span className="capitalize text-primary font-medium">{slot}</span>
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <WrenchScrewdriverIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">
                          No equipment equipped
                        </p>
                        <p className="text-sm text-muted-foreground/60">
                          Visit your inventory to equip items
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default CharacterPanel;
