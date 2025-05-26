// Feature Flags Hook
// Manages dynamic feature flags with backend sync and local storage fallback

import { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const FEATURE_FLAGS_STORAGE_KEY = 'emergentRPG_feature_flags';

// Default feature flags for fallback
const DEFAULT_FEATURE_FLAGS = {
  dynamic_themes: true,
  ai_response_caching: true,
  realtime_updates: false,
  advanced_inventory: false,
  quest_recommendations: false,
  custom_character_creation: false,
  multiplayer_sessions: false,
  voice_commands: false,
  mobile_optimizations: true,
  accessibility_enhancements: true,
  debug_mode: false,
  beta_features: false,
  analytics_tracking: true,
  offline_mode: true,
  auto_save: true
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
            setFeatureFlags({ ...DEFAULT_FEATURE_FLAGS, ...result.features });
            
            // Save to localStorage as backup
            localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(result.features));
            return;
          }
        }
      } catch (backendError) {
        console.log('Backend feature flags not available, using local storage');
      }

      // Fallback to localStorage
      const savedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
      if (savedFlags) {
        const parsedFlags = JSON.parse(savedFlags);
        setFeatureFlags({ ...DEFAULT_FEATURE_FLAGS, ...parsedFlags });
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
    return featureFlags[featureName] || false;
  }, [featureFlags]);

  // Get all enabled features
  const getEnabledFeatures = useCallback(() => {
    return Object.keys(featureFlags).filter(key => featureFlags[key]);
  }, [featureFlags]);

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
    reloadFeatureFlags: loadFeatureFlags,
  };
};

export default useFeatureFlags;
