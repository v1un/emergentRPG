// UI Configuration Management Component
// Allows users to customize their UI settings

import { Settings, Save, RotateCcw, ChevronUp, ChevronDown, Eye, EyeOff, Palette, ToggleLeft, ToggleRight } from 'lucide-react';
import { useUIConfig } from '../hooks/useUIConfig.js';
import { useFeatureFlags } from '../hooks/useFeatureFlags.js';
import { useTheme } from '../contexts/ThemeProvider.js';

// Reorder controls component
const ReorderControls = ({ index, array, onReorder, type }) => (
  <div className="flex flex-col gap-1">
    <button
      onClick={() => onReorder(type, index, index - 1)}
      disabled={index === 0}
      className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ChevronUp size={16} />
    </button>
    <button
      onClick={() => onReorder(type, index, index + 1)}
      disabled={index === array.length - 1}
      className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ChevronDown size={16} />
    </button>
  </div>
);

// Panel configuration section
const PanelConfigSection = ({ uiConfig, onTogglePanel, onReorderPanels }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white">Game Panels</h3>
    <p className="text-gray-400 text-sm">Configure which panels are visible and their order.</p>
    
    <div className="space-y-2">
      {uiConfig.gamePanels.map((panel, index) => (
        <div key={panel.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
          <button
            onClick={() => onTogglePanel(panel.id)}
            className={`p-2 rounded transition-colors ${
              panel.enabled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
            }`}
          >
            {panel.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          
          <div className="flex-1">
            <div className="font-medium text-white">{panel.label}</div>
            <div className="text-sm text-gray-400">{panel.id}</div>
          </div>
          
          <ReorderControls
            index={index}
            array={uiConfig.gamePanels}
            onReorder={onReorderPanels}
            type="panels"
          />
        </div>
      ))}
    </div>
  </div>
);

// Quick actions configuration section
const QuickActionsConfigSection = ({ uiConfig, onToggleQuickAction, onReorderQuickActions }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
    <p className="text-gray-400 text-sm">Configure available quick actions and their order.</p>
    
    <div className="space-y-2">
      {uiConfig.quickActions.map((action, index) => (
        <div key={action.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
          <button
            onClick={() => onToggleQuickAction(action.id)}
            className={`p-2 rounded transition-colors ${
              action.enabled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
            }`}
          >
            {action.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          
          <div className="flex-1">
            <div className="font-medium text-white">{action.text}</div>
            <div className="text-sm text-gray-400">
              {action.hotkey && `Hotkey: ${action.hotkey}`}
            </div>
          </div>
          
          <ReorderControls
            index={index}
            array={uiConfig.quickActions}
            onReorder={onReorderQuickActions}
            type="actions"
          />
        </div>
      ))}
    </div>
  </div>
);

// Layout configuration section
const LayoutConfigSection = ({ uiConfig, onUpdateSetting }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-white">Layout Settings</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Sidebar Width */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Sidebar Width: {uiConfig.layout.sidebarWidth}px
        </label>
        <input
          type="range"
          min="200"
          max="400"
          value={uiConfig.layout.sidebarWidth}
          onChange={(e) => onUpdateSetting('layout.sidebarWidth', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Compact Mode */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="compactMode"
          checked={uiConfig.layout.compactMode}
          onChange={(e) => onUpdateSetting('layout.compactMode', e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="compactMode" className="text-sm font-medium text-gray-300">
          Compact Mode
        </label>
      </div>

      {/* Show Tooltips */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="showTooltips"
          checked={uiConfig.layout.showTooltips}
          onChange={(e) => onUpdateSetting('layout.showTooltips', e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="showTooltips" className="text-sm font-medium text-gray-300">
          Show Tooltips
        </label>
      </div>

      {/* Animations */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="enableAnimations"
          checked={uiConfig.layout.enableAnimations}
          onChange={(e) => onUpdateSetting('layout.enableAnimations', e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="enableAnimations" className="text-sm font-medium text-gray-300">
          Enable Animations
        </label>
      </div>

      {/* Auto-save */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="autoSave"
          checked={uiConfig.layout.autoSave}
          onChange={(e) => onUpdateSetting('layout.autoSave', e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="autoSave" className="text-sm font-medium text-gray-300">
          Auto-save Changes
        </label>
      </div>
    </div>
  </div>
);

// Theme configuration section
const ThemeConfigSection = ({ currentTheme, availableThemes, onThemeChange }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <Palette size={20} className="text-purple-400" />
      <h3 className="text-lg font-semibold text-white">Theme Settings</h3>
    </div>
    <p className="text-gray-400 text-sm">Choose your preferred visual theme for the interface.</p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {Object.values(availableThemes).map((theme) => (
        <button
          key={theme.id}
          onClick={() => onThemeChange(theme.id)}
          className={`p-4 rounded-lg border-2 transition-all ${
            currentTheme.id === theme.id
              ? 'border-purple-500 bg-purple-900/30'
              : 'border-gray-600 bg-gray-700 hover:border-gray-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-6 h-6 rounded-full border-2 border-gray-400"
              style={{ backgroundColor: theme.colors?.primary }}
            />
            <div className="text-left">
              <div className="font-medium text-white">{theme.name}</div>
              <div className="text-sm text-gray-400">{theme.description || ''}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
);

// Feature flags configuration section
const FeatureFlagsConfigSection = ({ featureFlags, onToggleFlag }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <ToggleLeft size={20} className="text-green-400" />
      <h3 className="text-lg font-semibold text-white">Feature Flags</h3>
    </div>
    <p className="text-gray-400 text-sm">Enable or disable experimental and beta features.</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Object.entries(featureFlags).map(([flagId, flag]) => (
        <div key={flagId} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
          <div className="flex-1">
            <div className="font-medium text-white">{flag.name}</div>
            <div className="text-sm text-gray-400">{flag.description}</div>
            {flag.category && (
              <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                flag.category === 'experimental' 
                  ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                  : flag.category === 'beta'
                    ? 'bg-blue-900/50 text-blue-400 border border-blue-700'
                    : 'bg-gray-600 text-gray-300'
              }`}>
                {flag.category}
              </span>
            )}
          </div>
          
          <button
            onClick={() => onToggleFlag(flagId)}
            className={`p-2 rounded transition-colors ${
              flag.enabled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
            }`}
          >
            {flag.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>
        </div>
      ))}
    </div>
  </div>
);

// Main UI Configuration Panel Component
const UIConfigurationPanel = () => {
  const {
    uiConfig,
    isLoading,
    hasUnsavedChanges,
    updateUIConfig,
    saveUIConfig,
    resetUIConfig,
    togglePanel,
    toggleQuickAction,
    reorderPanels,
    reorderQuickActions
  } = useUIConfig();

  const { currentTheme, availableThemes, changeTheme } = useTheme();
  const { featureFlags, toggleFlag, isLoading: flagsLoading } = useFeatureFlags();

  if (isLoading || flagsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading configuration...</div>
      </div>
    );
  }

  if (!uiConfig) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-400">Failed to load UI configuration</div>
      </div>
    );
  }

  const handleUpdateSetting = (path, value) => {
    updateUIConfig(path, value);
  };

  const handleSave = async () => {
    try {
      await saveUIConfig();
    } catch (error) {
      console.error('Failed to save UI configuration:', error);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all UI settings to defaults?')) {
      try {
        await resetUIConfig();
      } catch (error) {
        console.error('Failed to reset UI configuration:', error);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings size={24} className="text-blue-400" />
          <h2 className="text-xl font-bold text-white">UI Configuration</h2>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Reset to Defaults
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save size={16} />
            Save Changes
            {hasUnsavedChanges && <span className="w-2 h-2 bg-orange-400 rounded-full"></span>}
          </button>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="mb-6 p-3 bg-orange-900/50 border border-orange-700 rounded-lg">
          <div className="text-orange-400 text-sm">
            You have unsaved changes. Don't forget to save your configuration.
          </div>
        </div>
      )}

      {/* Configuration Sections */}
      <div className="space-y-8">
        <ThemeConfigSection
          currentTheme={currentTheme}
          availableThemes={availableThemes}
          onThemeChange={changeTheme}
        />
        
        <FeatureFlagsConfigSection
          featureFlags={featureFlags}
          onToggleFlag={toggleFlag}
        />
        
        <PanelConfigSection
          uiConfig={uiConfig}
          onTogglePanel={togglePanel}
          onReorderPanels={reorderPanels}
        />
        
        <QuickActionsConfigSection
          uiConfig={uiConfig}
          onToggleQuickAction={toggleQuickAction}
          onReorderQuickActions={reorderQuickActions}
        />
        
        <LayoutConfigSection
          uiConfig={uiConfig}
          onUpdateSetting={handleUpdateSetting}
        />
      </div>
    </div>
  );
};

export default UIConfigurationPanel;
