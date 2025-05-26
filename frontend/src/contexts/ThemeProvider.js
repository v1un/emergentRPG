// Theme Provider Context
// Manages dynamic theme switching and customization

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const THEME_STORAGE_KEY = 'emergentRPG_current_theme';

// Default themes
const DEFAULT_THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark Fantasy',
    colors: {
      primary: '#F59E0B',
      secondary: '#CBD5E1',
      background: '#0F172A',
      surface: '#020617',
      text: '#F1F5F9',
      textSecondary: '#CBD5E1',
    },
    cssClasses: {
      primary: 'dungeon-orange',
      secondary: 'dungeon-text-secondary',
      background: 'dungeon-dark',
      surface: 'dungeon-darker',
      text: 'dungeon-text',
    }
  },
  light: {
    id: 'light',
    name: 'Light Mode',
    colors: {
      primary: '#2563EB',
      secondary: '#64748B',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1E293B',
      textSecondary: '#64748B',
    },
    cssClasses: {
      primary: 'blue-600',
      secondary: 'gray-600',
      background: 'white',
      surface: 'gray-50',
      text: 'gray-900',
    }
  },
  forest: {
    id: 'forest',
    name: 'Forest Theme',
    colors: {
      primary: '#059669',
      secondary: '#10B981',
      background: '#064E3B',
      surface: '#065F46',
      text: '#ECFDF5',
      textSecondary: '#A7F3D0',
    },
    cssClasses: {
      primary: 'green-600',
      secondary: 'green-400',
      background: 'green-900',
      surface: 'green-800',
      text: 'green-50',
    }
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEMES.dark);
  const [availableThemes, setAvailableThemes] = useState(DEFAULT_THEMES);
  const [isLoading, setIsLoading] = useState(true);

  // Load themes from backend
  const loadThemes = useCallback(async () => {
    try {
      setIsLoading(true);
      let loadedThemes = DEFAULT_THEMES;
      
      // Try to load from backend
      try {
        const response = await fetch(`${BACKEND_URL}/api/config/themes`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.themes && result.themes.length > 0) {
            const themesObj = {};
            result.themes.forEach(theme => {
              themesObj[theme.id] = theme;
            });
            loadedThemes = { ...DEFAULT_THEMES, ...themesObj };
            setAvailableThemes(loadedThemes);
          }
        }
      } catch (error) {
        console.log('Backend themes not available, using defaults');
      }

      // Load current theme from localStorage
      const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
      const theme = loadedThemes[savedThemeId] || DEFAULT_THEMES.dark;
      setCurrentTheme(theme);
      
    } catch (error) {
      console.error('Error loading themes:', error);
      setCurrentTheme(DEFAULT_THEMES.dark);
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove availableThemes from dependency array

  // Change theme
  const changeTheme = useCallback((themeId) => {
    setAvailableThemes(currentThemes => {
      const theme = currentThemes[themeId];
      if (theme) {
        setCurrentTheme(theme);
        localStorage.setItem(THEME_STORAGE_KEY, themeId);
        
        // Apply theme CSS variables to document root
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
          root.style.setProperty(`--theme-${key}`, value);
        });
      }
      return currentThemes; // Return unchanged themes
    });
  }, []);

  // Get theme class
  const getThemeClass = (property) => {
    return currentTheme.cssClasses[property] || '';
  };

  // Get theme color
  const getThemeColor = (property) => {
    return currentTheme.colors[property] || '';
  };

  // Initialize themes on mount
  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  // Apply theme to DOM when theme changes
  useEffect(() => {
    if (currentTheme) {
      const root = document.documentElement;
      Object.entries(currentTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value);
      });
    }
  }, [currentTheme]);

  const value = {
    currentTheme,
    availableThemes,
    isLoading,
    changeTheme,
    getThemeClass,
    getThemeColor,
    reloadThemes: loadThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
