// Enhanced Theme Provider - Dark mode, accessibility, and customization

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useReducedMotion, useHighContrastMode } from './Accessibility';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'red';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
  prefersReducedMotion: boolean;
  isHighContrast: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColorScheme?: ColorScheme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultColorScheme = 'blue',
  storageKey = 'emergent-rpg-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(defaultColorScheme);
  const [fontSize, setFontSizeState] = useState<'sm' | 'md' | 'lg'>('md');
  const [isDark, setIsDark] = useState(false);
  
  const prefersReducedMotion = useReducedMotion();
  const isHighContrast = useHighContrastMode();

  // Initialize theme from storage and system preferences
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const { theme: storedTheme, colorScheme: storedScheme, fontSize: storedFontSize } = JSON.parse(stored);
        if (storedTheme) setThemeState(storedTheme);
        if (storedScheme) setColorSchemeState(storedScheme);
        if (storedFontSize) setFontSizeState(storedFontSize);
      } catch (error) {
        console.warn('Failed to parse stored theme:', error);
      }
    }
  }, [storageKey]);

  // Handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        setIsDark(mediaQuery.matches);
      }
    };

    // Set initial value
    if (theme === 'system') {
      setIsDark(mediaQuery.matches);
    } else {
      setIsDark(theme === 'dark');
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme
    root.classList.add(isDark ? 'dark' : 'light');
    
    // Apply color scheme
    root.setAttribute('data-color-scheme', colorScheme);
    
    // Apply font size
    root.setAttribute('data-font-size', fontSize);
    
    // Apply accessibility preferences
    if (prefersReducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [isDark, colorScheme, fontSize, prefersReducedMotion, isHighContrast]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Update storage
    const stored = localStorage.getItem(storageKey);
    const current = stored ? JSON.parse(stored) : {};
    localStorage.setItem(storageKey, JSON.stringify({
      ...current,
      theme: newTheme,
    }));
  };

  const setColorScheme = (newScheme: ColorScheme) => {
    setColorSchemeState(newScheme);
    
    // Update storage
    const stored = localStorage.getItem(storageKey);
    const current = stored ? JSON.parse(stored) : {};
    localStorage.setItem(storageKey, JSON.stringify({
      ...current,
      colorScheme: newScheme,
    }));
  };

  const setFontSize = (newSize: 'sm' | 'md' | 'lg') => {
    setFontSizeState(newSize);
    
    // Update storage
    const stored = localStorage.getItem(storageKey);
    const current = stored ? JSON.parse(stored) : {};
    localStorage.setItem(storageKey, JSON.stringify({
      ...current,
      fontSize: newSize,
    }));
  };

  const value: ThemeContextType = {
    theme,
    colorScheme,
    setTheme,
    setColorScheme,
    isDark,
    prefersReducedMotion,
    isHighContrast,
    fontSize,
    setFontSize,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme toggle component
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, isDark } = useTheme();

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}

// Color scheme selector
export function ColorSchemeSelector({ className }: { className?: string }) {
  const { colorScheme, setColorScheme } = useTheme();

  const schemes: { name: ColorScheme; label: string; color: string }[] = [
    { name: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { name: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { name: 'green', label: 'Green', color: 'bg-green-500' },
    { name: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { name: 'red', label: 'Red', color: 'bg-red-500' },
  ];

  return (
    <div className={`flex space-x-2 ${className}`}>
      {schemes.map((scheme) => (
        <button
          key={scheme.name}
          onClick={() => setColorScheme(scheme.name)}
          className={`w-6 h-6 rounded-full ${scheme.color} transition-all duration-200 ${
            colorScheme === scheme.name 
              ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' 
              : 'hover:scale-110'
          }`}
          aria-label={`Switch to ${scheme.label} color scheme`}
          title={scheme.label}
        />
      ))}
    </div>
  );
}

export default ThemeProvider;
