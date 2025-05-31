// World Panel Component - World state visualization

'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentWorldState, useGameStore, useCurrentSession } from '@/stores/gameStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { textFormatters } from '@/utils/formatting';
import { cn } from '@/utils/helpers';
import { dynamicUIService, DynamicUIContent } from '@/services/dynamicUIService';
import {
  GlobeAltIcon,
  MapPinIcon,
  ClockIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  SparklesIcon,
  MapIcon,
  EyeIcon,
  BellIcon,
  CalendarIcon,
  SunIcon,
  MoonIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  MapPinIcon as MapPinSolidIcon,
  BellIcon as BellSolidIcon,
} from '@heroicons/react/24/solid';

// World event interface
interface WorldEvent {
  id: string;
  type: 'location_change' | 'weather_change' | 'time_change' | 'npc_encounter' | 'special_event';
  message: string;
  timestamp: string;
  location?: string;
}

export function WorldPanel() {
  const worldState = useCurrentWorldState();
  const currentSession = useCurrentSession();
  const { updateSession } = useGameStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'events'>('overview');
  const [worldEvents, setWorldEvents] = useState<WorldEvent[]>([]);
  const [showEventNotifications, setShowEventNotifications] = useState(true);
  const [dynamicContent, setDynamicContent] = useState<DynamicUIContent | null>(null);

  // Load dynamic UI content
  useEffect(() => {
    const loadDynamicContent = async () => {
      try {
        const content = await dynamicUIService.getDynamicUIContent({
          character: currentSession?.character,
          session: currentSession || undefined,
          currentLocation: worldState?.current_location,
          gameState: worldState ? 'playing' : 'starting',
          panelType: 'world',
        });
        setDynamicContent(content);
      } catch (error) {
        console.warn('Failed to load dynamic UI content for world:', error);
      }
    };

    if (currentSession) {
      loadDynamicContent();
    }
  }, [currentSession, worldState?.current_location]);

  // Track world state changes and create events
  useEffect(() => {
    if (worldState) {
      // This would normally track changes, for demo we'll add some sample events
      const sampleEvents: WorldEvent[] = [
        {
          id: '1',
          type: 'location_change',
          message: `Arrived at ${worldState.current_location}`,
          timestamp: new Date().toISOString(),
          location: worldState.current_location,
        },
        {
          id: '2',
          type: 'weather_change',
          message: `Weather changed to ${worldState.weather}`,
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: '3',
          type: 'time_change',
          message: `Time of day is now ${worldState.time_of_day}`,
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
      ];

      setWorldEvents(sampleEvents);
    }
  }, [worldState]);

  if (!worldState) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <GlobeAltIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {dynamicContent?.emptyStateTitle || 'No World Data'}
          </h3>
          <p className="text-muted-foreground">
            {dynamicContent?.emptyStateMessage || 'Start a game session to explore the world.'}
          </p>
        </div>
      </div>
    );
  }

  const getWeatherIcon = (weather: string) => {
    // Enhanced weather icons with more variety
    const weatherIcons: Record<string, string> = {
      sunny: '☀️',
      'partly cloudy': '⛅',
      cloudy: '☁️',
      overcast: '☁️',
      rainy: '🌧️',
      'light rain': '🌦️',
      'heavy rain': '🌧️',
      stormy: '⛈️',
      thunderstorm: '⛈️',
      snowy: '❄️',
      'light snow': '🌨️',
      'heavy snow': '❄️',
      foggy: '🌫️',
      misty: '🌫️',
      windy: '💨',
      clear: '🌤️',
      hot: '🔥',
      cold: '🧊',
      humid: '💧',
      dry: '🏜️',
    };
    return weatherIcons[weather.toLowerCase()] || '🌤️';
  };

  const renderInfoCard = (
    title: string,
    value: string,
    icon: React.ReactNode,
    description?: string
  ) => (
    <Card className="bg-gradient-primary/30 border-primary/20 backdrop-blur-sm glow-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {icon}
          <span className="ml-2">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-primary-foreground mb-1">
          {textFormatters.titleCase(value)}
        </p>
        {description && (
          <p className="text-sm text-primary-foreground/80">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const renderListCard = (
    title: string,
    items: string[],
    icon: React.ReactNode,
    emptyMessage: string
  ) => (
    <Card className="bg-gradient-accent/30 border-accent/20 backdrop-blur-sm glow-accent/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          {icon}
          <span className="ml-2">{title}</span>
          <span className="ml-auto text-sm font-normal text-primary-foreground/70">
            {items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-primary-foreground/70 text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item}
                className="p-2 bg-gradient-primary/10 rounded-lg text-sm border border-primary/10 hover:glow-primary transition-all duration-300"
              >
                {textFormatters.titleCase(item)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <GlobeAltIcon className="h-4 w-4" /> },
    { id: 'map', label: 'Map', icon: <MapIcon className="h-4 w-4" /> },
    { id: 'events', label: 'Events', icon: <BellIcon className="h-4 w-4" /> },
  ];

  const getEventIcon = (type: WorldEvent['type']) => {
    switch (type) {
      case 'location_change':
        return <MapPinIcon className="h-4 w-4 text-blue-500" />;
      case 'weather_change':
        return <CloudIcon className="h-4 w-4 text-gray-500" />;
      case 'time_change':
        return <ClockIcon className="h-4 w-4 text-orange-500" />;
      case 'npc_encounter':
        return <UserGroupIcon className="h-4 w-4 text-green-500" />;
      case 'special_event':
        return <SparklesIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
    }
  };

  const renderSimpleMap = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-primary/30 border-primary/20 backdrop-blur-sm glow-primary/30">
        <CardHeader>
          <CardTitle className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">World Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-lg p-8 min-h-64">
            {/* Simple map visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Current location marker */}
                <div className="w-4 h-4 bg-accent rounded-full animate-pulse glow-accent"></div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-center whitespace-nowrap text-primary-foreground">
                  {textFormatters.titleCase(worldState.current_location)}
                </div>
              </div>
            </div>
            {/* Compass */}
            <div className="absolute top-4 right-4 w-16 h-16 border-2 border-primary/30 rounded-full flex items-center justify-center bg-white/80 dark:bg-gray-800/80">
              <div className="text-xs font-bold text-primary">N</div>
              <div className="absolute top-1 text-xs text-primary">↑</div>
            </div>
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-gray-800/80 p-3 rounded-lg shadow-md">
              <div className="text-xs font-semibold mb-2 text-primary-foreground/80">Legend</div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-primary-foreground/80">Current Location</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-accent/30 border-accent/20 backdrop-blur-sm glow-accent/30">
        <CardHeader>
          <CardTitle className="text-lg bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Location Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-primary-foreground mb-2">
                {textFormatters.titleCase(worldState.current_location)}
              </h4>
              <p className="text-sm text-primary-foreground/80">
                You are currently exploring this area. The environment around you is {worldState.weather.toLowerCase()} and it&apos;s {worldState.time_of_day.toLowerCase()}.
              </p>
            </div>
            {worldState.npcs_present && worldState.npcs_present.length > 0 && (
              <div>
                <h5 className="font-medium text-primary-foreground mb-1">NPCs Present:</h5>
                <div className="flex flex-wrap gap-2">
                  {worldState.npcs_present.map((npc) => (
                    <span key={npc} className="px-2 py-1 bg-gradient-primary/20 text-primary-foreground text-xs rounded">
                      {textFormatters.titleCase(npc)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-primary/30 border-primary/20 backdrop-blur-sm glow-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">World Events</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEventNotifications(!showEventNotifications)}
            >
              {showEventNotifications ? (
                <BellSolidIcon className="h-4 w-4 text-accent" />
              ) : (
                <BellIcon className="h-4 w-4 text-primary" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {worldEvents.length === 0 ? (
              <p className="text-primary-foreground/70 text-center py-4">
                No world events recorded yet.
              </p>
            ) : (
              worldEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 bg-gradient-accent/10 rounded-lg">
                  {getEventIcon(event.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary-foreground">
                      {event.message}
                    </p>
                    <p className="text-xs text-primary-foreground/70">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-accent/30 border-accent/20 backdrop-blur-sm glow-accent/30">
        <CardHeader>
          <CardTitle className="text-lg bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Event Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gradient-primary/20 rounded-lg border border-primary/20 hover:glow-primary transition-all duration-300">
              <div className="text-2xl font-bold text-blue-400 glow-blue">
                {worldEvents.filter(e => e.type === 'location_change').length}
              </div>
              <div className="text-sm text-primary-foreground/70">Locations Visited</div>
            </div>
            <div className="text-center p-3 bg-gradient-accent/20 rounded-lg border border-accent/20 hover:glow-accent transition-all duration-300">
              <div className="text-2xl font-bold text-green-400 glow-green">
                {worldEvents.filter(e => e.type === 'npc_encounter').length}
              </div>
              <div className="text-sm text-primary-foreground/70">NPC Encounters</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-story relative overflow-hidden">
      {/* Magical Background Effects */}
      <div className="absolute inset-0 bg-magical-dots opacity-20 pointer-events-none"></div>
      <div className="floating-orb absolute top-10 right-10 w-4 h-4 bg-accent/30 rounded-full animate-float"></div>
      <div className="floating-orb absolute bottom-20 left-8 w-3 h-3 bg-primary/20 rounded-full animate-float-delayed"></div>
      {/* Tab Navigation */}
      <div className="flex border-b border-primary/20 bg-gradient-accent/50 relative z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Location */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <MapPinIcon className="h-6 w-6 mr-3 text-blue-600" />
                  Current Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {textFormatters.titleCase(worldState.current_location)}
                </h2>
                <p className="text-muted-foreground">
                  {worldState.environment_description || 'You are currently exploring this area. Look around to discover new opportunities and adventures.'}
                </p>
              </CardContent>
            </Card>

            {/* Time and Weather */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInfoCard(
                'Time of Day',
                worldState.time_of_day,
                <ClockIcon className="h-5 w-5 text-orange-500" />,
                `It is currently ${worldState.time_of_day.toLowerCase()} in the world.`
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <CloudIcon className="h-5 w-5 text-blue-500" />
                    <span className="ml-2">Weather</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">
                      {getWeatherIcon(worldState.weather)}
                    </span>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {textFormatters.titleCase(worldState.weather)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Current weather conditions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Special Conditions */}
            {worldState.special_conditions && worldState.special_conditions.length > 0 && (
              <Card className="border-yellow-200 dark:border-yellow-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-yellow-700 dark:text-yellow-300">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    Special Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {worldState.special_conditions.map((condition, index) => (
                      <div
                        key={index}
                        className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                      >
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          {textFormatters.titleCase(condition)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* NPCs Present */}
            {renderListCard(
              'NPCs Present',
              worldState.npcs_present || [],
              <UserGroupIcon className="h-5 w-5 text-green-500" />,
              'No NPCs are currently in this area.'
            )}

            {/* Available Actions */}
            {renderListCard(
              'Available Actions',
              worldState.available_actions || [],
              <SparklesIcon className="h-5 w-5 text-purple-500" />,
              'No special actions are available at this location.'
            )}

            {/* World Metadata */}
            {worldState.metadata && Object.keys(worldState.metadata).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(worldState.metadata).map(([key, value]) => (
                      <div key={key} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          {textFormatters.camelToReadable(key)}
                        </p>
                        <p className="text-sm text-foreground">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* World Exploration Tips */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-green-700 dark:text-green-300">
                  <GlobeAltIcon className="h-5 w-5 mr-2" />
                  Exploration Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <p>• Use the Story panel to interact with your environment</p>
                  <p>• Pay attention to NPCs and special conditions</p>
                  <p>• Available actions show what you can do in this location</p>
                  <p>• Weather and time may affect your adventures</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'map' && renderSimpleMap()}
        {activeTab === 'events' && renderEvents()}
      </div>
    </div>
  );
}

export default WorldPanel;
