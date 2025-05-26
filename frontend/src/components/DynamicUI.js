// Dynamic UI Components
// Reusable components for rendering dynamic UI elements

import React from 'react';
import { ICON_MAP } from '../config/uiConfig.js';

// Dynamic Icon Component
export const DynamicIcon = ({ iconName, size = 16, className = '' }) => {
  const IconComponent = ICON_MAP[iconName];
  
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found in ICON_MAP`);
    return <span className={className}>?</span>;
  }
  
  return <IconComponent size={size} className={className} />;
};

// Dynamic Tab Button Component
export const DynamicTabButton = ({ 
  tab, 
  isActive, 
  onClick, 
  className = '',
  showIcon = true,
  showLabel = true 
}) => {
  return (
    <button
      key={tab.id}
      onClick={() => onClick(tab.id)}
      className={`flex items-center justify-center space-x-2 px-4 py-3 transition-colors ${
        isActive
          ? 'bg-dungeon-orange text-dungeon-dark font-medium'
          : 'text-dungeon-text-secondary hover:text-dungeon-text hover:bg-slate-700/50'
      } ${className}`}
    >
      {showIcon && <DynamicIcon iconName={tab.icon} size={16} />}
      {showLabel && <span className="text-sm font-medium">{tab.label}</span>}
    </button>
  );
};

// Dynamic Quick Action Button Component
export const DynamicQuickActionButton = ({ 
  action, 
  onClick, 
  className = '',
  showHotkey = false 
}) => {
  return (
    <button
      key={action.id}
      onClick={() => onClick(action.text)}
      className={`flex items-center space-x-2 px-3 py-2 bg-slate-700/90 hover:bg-slate-600 rounded-lg text-sm transition-all hover:scale-105 border border-slate-600 ${className}`}
      title={showHotkey && action.hotkey ? `Hotkey: ${action.hotkey.toUpperCase()}` : action.text}
    >
      <DynamicIcon iconName={action.icon} size={16} />
      <span>{action.text}</span>
      {showHotkey && action.hotkey && (
        <span className="text-xs opacity-60 ml-1">({action.hotkey.toUpperCase()})</span>
      )}
    </button>
  );
};

// Dynamic Navigation Button Component
export const DynamicNavigationButton = ({ 
  navItem, 
  isActive, 
  onClick, 
  className = '' 
}) => {
  return (
    <button 
      onClick={() => onClick(navItem.id)}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
        isActive 
          ? 'bg-dungeon-orange text-dungeon-dark' 
          : 'text-dungeon-text-secondary hover:text-dungeon-text'
      } ${className}`}
    >
      <DynamicIcon iconName={navItem.icon} size={18} />
      <span>{navItem.label}</span>
    </button>
  );
};

// Panel Container Component
export const DynamicPanelContainer = ({ 
  panels, 
  activePanel, 
  onPanelChange, 
  children,
  className = '' 
}) => {
  return (
    <div className={`bg-dungeon-darker border-l border-slate-600 flex flex-col flex-shrink-0 ${className}`}>
      {/* Panel Tabs */}
      <div className="flex border-b border-slate-600">
        {panels.map((panel) => (
          <DynamicTabButton
            key={panel.id}
            tab={panel}
            isActive={activePanel === panel.id}
            onClick={onPanelChange}
            className="flex-1"
          />
        ))}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
};

// Quick Actions Container Component
export const DynamicQuickActionsContainer = ({ 
  actions, 
  onActionClick, 
  showHotkeys = false,
  className = '' 
}) => {
  return (
    <div className={`flex flex-wrap gap-2 mb-4 ${className}`}>
      {actions.map((action) => (
        <DynamicQuickActionButton
          key={action.id}
          action={action}
          onClick={onActionClick}
          showHotkey={showHotkeys}
        />
      ))}
    </div>
  );
};

// Navigation Container Component
export const DynamicNavigationContainer = ({ 
  navItems, 
  currentView, 
  onViewChange,
  className = '' 
}) => {
  return (
    <div className={`hidden md:flex space-x-6 ${className}`}>
      {navItems.map((navItem) => (
        <DynamicNavigationButton
          key={navItem.id}
          navItem={navItem}
          isActive={currentView === navItem.id}
          onClick={onViewChange}
        />
      ))}
    </div>
  );
};

// Theme-aware CSS class generator
export const getThemeClasses = (theme, element) => {
  const baseClasses = {
    primary: `text-${theme.colors.primary}`,
    secondary: `text-${theme.colors.secondary}`,
    background: `bg-${theme.colors.background}`,
    surface: `bg-${theme.colors.surface}`,
  };
  
  return baseClasses[element] || '';
};

// Rarity color utility
export const getRarityColor = (rarity, rarityColors) => {
  return rarityColors[rarity] || rarityColors.common || 'border-gray-400';
};

const DynamicUIComponents = {
  DynamicIcon,
  DynamicTabButton,
  DynamicQuickActionButton,
  DynamicNavigationButton,
  DynamicPanelContainer,
  DynamicQuickActionsContainer,
  DynamicNavigationContainer,
  getThemeClasses,
  getRarityColor,
};

export default DynamicUIComponents;
