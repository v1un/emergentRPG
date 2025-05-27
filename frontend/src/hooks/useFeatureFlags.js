// Feature Flags Hook
// Manages dynamic feature flags with backend sync and local storage fallback

import { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const FEATURE_FLAGS_STORAGE_KEY = 'emergentRPG_feature_flags';

// Default feature flags for fallback
const DEFAULT_FEATURE_FLAGS = {
  dynamic_themes: {
    name: "Dynamic Themes",
    description: "Enable dynamic theme switching based on game context",
    enabled: true,
    category: "stable"
  },
  ai_response_caching: {
    name: "AI Response Caching",
    description: "Cache AI responses to improve performance",
    enabled: true,
    category: "stable"
  },
  realtime_updates: {
    name: "Realtime Updates",
    description: "Enable realtime game state updates",
    enabled: false,
    category: "beta"
  },
  advanced_inventory: {
    name: "Advanced Inventory",
    description: "Enhanced inventory management with categories and search",
    enabled: false,
    category: "beta"
  },
  quest_recommendations: {
    name: "Quest Recommendations",
    description: "AI-powered quest recommendations based on play style",
    enabled: false,
    category: "experimental"
  },
  custom_character_creation: {
    name: "Custom Character Creation",
    description: "Advanced character customization options",
    enabled: false,
    category: "beta"
  },
  multiplayer_sessions: {
    name: "Multiplayer Sessions",
    description: "Enable multiplayer game sessions",
    enabled: false,
    category: "experimental"
  },
  voice_commands: {
    name: "Voice Commands",
    description: "Control the game using voice commands",
    enabled: false,
    category: "experimental"
  },
  mobile_optimizations: {
    name: "Mobile Optimizations",
    description: "Optimize UI for mobile devices",
    enabled: true,
    category: "stable"
  },
  accessibility_enhancements: {
    name: "Accessibility Enhancements",
    description: "Additional accessibility features",
    enabled: true,
    category: "stable"
  },
  debug_mode: {
    name: "Debug Mode",
    description: "Show debug information for developers",
    enabled: false,
    category: "developer"
  },
  beta_features: {
    name: "Beta Features",
    description: "Enable all beta features",
    enabled: false,
    category: "beta"
  },
  analytics_tracking: {
    name: "Analytics Tracking",
    description: "Anonymous usage data collection to improve the game",
    enabled: true,
    category: "stable"
  },
  offline_mode: {
    name: "Offline Mode",
    description: "Allow playing without internet connection",
    enabled: true,
    category: "stable"
  },
  auto_save: {
    name: "Auto Save",
    description: "Automatically save game progress",
    enabled: true,
    category: "stable"
  }
};

export const useFeatureFlags = () => {
  const [featureFlags, setFeatureFlags] = useState(DEFAULT_FEATURE_FLAGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load feature flags from backend or localStorage
  const loadFeatureFlags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load from backend first
      try {
        const userId = 'default'; // TODO: Replace with actual user ID when auth is implemented
        const response = await fetch(`${BACKEND_URL}/api/features?user_id=${userId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.features) {
            // Merge backend features with defaults, preserving structure
            const mergedFlags = { ...DEFAULT_FEATURE_FLAGS };
            
            // Update enabled status from backend for existing flags
            Object.entries(result.features).forEach(([key, value]) => {
              if (mergedFlags[key]) {
                if (typeof value === 'boolean') {
                  // Handle simple boolean values from backend
                  mergedFlags[key] = {
                    ...mergedFlags[key],
                    enabled: value
                  };
                } else if (typeof value === 'object') {
                  // Handle complex objects from backend
                  mergedFlags[key] = {
                    ...mergedFlags[key],
                    ...value
                  };
                }
              }
            });
            
            setFeatureFlags(mergedFlags);
            
            // Save to localStorage as backup
            localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(mergedFlags));
            return;
          }
        }
      } catch (backendError) {
        console.log('Backend feature flags not available, using local storage');
      }

      // Fallback to localStorage
      const savedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
      if (savedFlags) {
        try {
          const parsedFlags = JSON.parse(savedFlags);
          
          // Merge saved flags with defaults, preserving structure
          const mergedFlags = { ...DEFAULT_FEATURE_FLAGS };
          
          Object.entries(parsedFlags).forEach(([key, value]) => {
            if (mergedFlags[key]) {
              if (typeof value === 'boolean') {
                // Handle simple boolean values from localStorage
                mergedFlags[key] = {
                  ...mergedFlags[key],
                  enabled: value
                };
              } else if (typeof value === 'object') {
                // Handle complex objects from localStorage
                mergedFlags[key] = {
                  ...mergedFlags[key],
                  ...value
                };
              }
            }
          });
          
          setFeatureFlags(mergedFlags);
        } catch (error) {
          console.error('Error parsing saved feature flags:', error);
          setFeatureFlags(DEFAULT_FEATURE_FLAGS);
          localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(DEFAULT_FEATURE_FLAGS));
        }
      } else {
        // Use default feature flags
        setFeatureFlags(DEFAULT_FEATURE_FLAGS);
        localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(DEFAULT_FEATURE_FLAGS));
      }

    } catch (error) {
      console.error('Error loading feature flags:', error);
      setError('Failed to load feature flags');
      setFeatureFlags(DEFAULT_FEATURE_FLAGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if a specific feature is enabled
  const isFeatureEnabled = useCallback((featureName) => {
    return featureFlags[featureName]?.enabled || false;
  }, [featureFlags]);

  // Get all enabled features
  const getEnabledFeatures = useCallback(() => {
    return Object.keys(featureFlags).filter(key => featureFlags[key]?.enabled);
  }, [featureFlags]);

  // Toggle a feature flag
  const toggleFlag = useCallback((flagId) => {
    setFeatureFlags(prevFlags => {
      if (!prevFlags[flagId]) {
        console.warn(`Feature flag ${flagId} not found`);
        return prevFlags;
      }
      
      const newFlags = {
        ...prevFlags,
        [flagId]: {
          ...prevFlags[flagId],
          enabled: !prevFlags[flagId].enabled
        }
      };
      
      // Save to localStorage
      localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(newFlags));
      
      // Optionally sync with backend
      try {
        fetch(`${BACKEND_URL}/api/features/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: 'default', // TODO: Replace with actual user ID when auth is implemented
            features: newFlags
          }),
        }).catch(err => console.log('Failed to sync feature flags with backend:', err));
      } catch (error) {
        console.log('Error syncing feature flags with backend:', error);
      }
      
      return newFlags;
    });
  }, []);

  // Initialize feature flags on mount
  useEffect(() => {
    loadFeatureFlags();
  }, [loadFeatureFlags]);

  return {
    featureFlags,
    isLoading,
    error,
    isFeatureEnabled,
    getEnabledFeatures,
    toggleFlag,
    reloadFeatureFlags: loadFeatureFlags,
  };
};

export default useFeatureFlags;
