// UI Configuration Hook
// Manages dynamic UI configurations with backend sync and local storage fallback

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_UI_CONFIG, UI_STORAGE_KEYS } from '../config/uiConfig.js';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const useUIConfig = () => {
  const [uiConfig, setUIConfig] = useState(DEFAULT_UI_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load UI configuration from backend or localStorage
  const loadUIConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load from backend first
      try {
        const response = await fetch(`${BACKEND_URL}/api/config/ui`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.config) {
            const mergedConfig = mergeWithDefaults(result.config);
            setUIConfig(mergedConfig);
            
            // Save to localStorage as backup
            localStorage.setItem(UI_STORAGE_KEYS.UI_CONFIG, JSON.stringify(mergedConfig));
            return;
          }
        }
      } catch (backendError) {
        console.log('Backend UI config not available, using local storage');
      }

      // Fallback to localStorage
      const savedConfig = localStorage.getItem(UI_STORAGE_KEYS.UI_CONFIG);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        const mergedConfig = mergeWithDefaults(parsedConfig);
        setUIConfig(mergedConfig);
      } else {
        // Use default configuration
        setUIConfig(DEFAULT_UI_CONFIG);
        localStorage.setItem(UI_STORAGE_KEYS.UI_CONFIG, JSON.stringify(DEFAULT_UI_CONFIG));
      }
    } catch (error) {
      console.error('Error loading UI config:', error);
      setError('Failed to load UI configuration');
      setUIConfig(DEFAULT_UI_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save UI configuration to backend and localStorage
  const saveUIConfig = useCallback(async (newConfig) => {
    try {
      const configToSave = newConfig || uiConfig;
      
      // Save to localStorage immediately
      localStorage.setItem(UI_STORAGE_KEYS.UI_CONFIG, JSON.stringify(configToSave));
      
      // Try to save to backend
      try {
        const userId = 'default'; // TODO: Replace with actual user ID when auth is implemented
        await fetch(`${BACKEND_URL}/api/config/user/${userId}/preferences`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(configToSave),
        });
      } catch (backendError) {
        console.log('Backend save failed, saved locally only');
      }

      if (newConfig) {
        setUIConfig(configToSave);
      }
    } catch (error) {
      console.error('Error saving UI config:', error);
      setError('Failed to save UI configuration');
    }
  }, [uiConfig]);

  // Update specific UI configuration section
  const updateUIConfig = useCallback((section, updates) => {
    const newConfig = {
      ...uiConfig,
      [section]: {
        ...uiConfig[section],
        ...updates
      }
    };
    saveUIConfig(newConfig);
  }, [uiConfig, saveUIConfig]);

  // Update quick actions
  const updateQuickActions = useCallback((newActions) => {
    const newConfig = {
      ...uiConfig,
      quickActions: newActions
    };
    saveUIConfig(newConfig);
  }, [uiConfig, saveUIConfig]);

  // Update game panels
  const updateGamePanels = useCallback((newPanels) => {
    const newConfig = {
      ...uiConfig,
      gamePanels: newPanels
    };
    saveUIConfig(newConfig);
  }, [uiConfig, saveUIConfig]);

  // Toggle panel enabled state
  const togglePanel = useCallback((panelId) => {
    const newPanels = uiConfig.gamePanels.map(panel => 
      panel.id === panelId 
        ? { ...panel, enabled: !panel.enabled }
        : panel
    );
    updateGamePanels(newPanels);
  }, [uiConfig.gamePanels, updateGamePanels]);

  // Toggle quick action enabled state
  const toggleQuickAction = useCallback((actionId) => {
    const newActions = uiConfig.quickActions.map(action => 
      action.id === actionId 
        ? { ...action, enabled: !action.enabled }
        : action
    );
    updateQuickActions(newActions);
  }, [uiConfig.quickActions, updateQuickActions]);

  // Reorder panels
  const reorderPanels = useCallback((fromIndex, toIndex) => {
    const newPanels = [...uiConfig.gamePanels];
    const [movedPanel] = newPanels.splice(fromIndex, 1);
    newPanels.splice(toIndex, 0, movedPanel);
    
    // Update positions
    const reorderedPanels = newPanels.map((panel, index) => ({
      ...panel,
      position: index
    }));
    
    updateGamePanels(reorderedPanels);
  }, [uiConfig.gamePanels, updateGamePanels]);

  // Reorder quick actions
  const reorderQuickActions = useCallback((fromIndex, toIndex) => {
    const newActions = [...uiConfig.quickActions];
    const [movedAction] = newActions.splice(fromIndex, 1);
    newActions.splice(toIndex, 0, movedAction);
    
    // Update positions
    const reorderedActions = newActions.map((action, index) => ({
      ...action,
      position: index
    }));
    
    updateQuickActions(reorderedActions);
  }, [uiConfig.quickActions, updateQuickActions]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    saveUIConfig(DEFAULT_UI_CONFIG);
  }, [saveUIConfig]);

  // Get enabled panels sorted by position
  const getEnabledPanels = useCallback(() => {
    return uiConfig.gamePanels
      .filter(panel => panel.enabled)
      .sort((a, b) => a.position - b.position);
  }, [uiConfig.gamePanels]);

  // Get enabled quick actions sorted by position
  const getEnabledQuickActions = useCallback(() => {
    return uiConfig.quickActions
      .filter(action => action.enabled)
      .sort((a, b) => a.position - b.position);
  }, [uiConfig.quickActions]);

  // Get quick actions by category
  const getQuickActionsByCategory = useCallback((category) => {
    return uiConfig.quickActions
      .filter(action => action.enabled && action.category === category)
      .sort((a, b) => a.position - b.position);
  }, [uiConfig.quickActions]);

  // Load config on mount
  useEffect(() => {
    loadUIConfig();
  }, [loadUIConfig]);

  return {
    // State
    uiConfig,
    isLoading,
    error,
    
    // Config getters
    getEnabledPanels,
    getEnabledQuickActions,
    getQuickActionsByCategory,
    
    // Config updaters
    updateUIConfig,
    updateQuickActions,
    updateGamePanels,
    togglePanel,
    toggleQuickAction,
    reorderPanels,
    reorderQuickActions,
    
    // Utilities
    saveUIConfig,
    resetToDefaults,
    loadUIConfig,
  };
};

// Utility function to merge user config with defaults
function mergeWithDefaults(userConfig) {
  return {
    ...DEFAULT_UI_CONFIG,
    ...userConfig,
    gamePanels: mergeArrayConfigs(DEFAULT_UI_CONFIG.gamePanels, userConfig.gamePanels || []),
    quickActions: mergeArrayConfigs(DEFAULT_UI_CONFIG.quickActions, userConfig.quickActions || []),
    navigation: mergeArrayConfigs(DEFAULT_UI_CONFIG.navigation, userConfig.navigation || []),
    rarityColors: { ...DEFAULT_UI_CONFIG.rarityColors, ...(userConfig.rarityColors || {}) },
    themes: { ...DEFAULT_UI_CONFIG.themes, ...(userConfig.themes || {}) },
    layout: { ...DEFAULT_UI_CONFIG.layout, ...(userConfig.layout || {}) },
  };
}

// Utility to merge array-based configs (panels, actions, etc.)
function mergeArrayConfigs(defaultArray, userArray) {
  const userMap = new Map(userArray.map(item => [item.id, item]));
  
  return defaultArray.map(defaultItem => {
    const userItem = userMap.get(defaultItem.id);
    return userItem ? { ...defaultItem, ...userItem } : defaultItem;
  }).concat(
    // Add any new items from user config that don't exist in defaults
    userArray.filter(userItem => !defaultArray.some(defaultItem => defaultItem.id === userItem.id))
  );
}

export default useUIConfig;
