# emergentRPG Frontend Development Plan

**Comprehensive Frontend Architecture & Implementation Strategy**

This document provides a detailed technical plan for developing the emergentRPG frontend, designed to seamlessly integrate with the existing backend architecture while showcasing the AI-driven storytelling capabilities of the platform.

## ✅ Implementation Status

**Current Phase**: Phase 2 - Core Gameplay (Week 4)
**Started**: December 2024
**Backend Integration**: ✅ Completed - Full API client with fallback
**WebSocket Endpoint**: ✅ Completed - Real-time communication implemented
**Project Setup**: ✅ Completed - Next.js 15.3.2 with TypeScript
**State Management**: ✅ Completed - Zustand + React Query
**Core Layout**: ✅ Completed - Responsive GameLayout with sidebar
**Story Interface**: ✅ Completed - Real-time narrative display with AI generation
**API Integration**: ✅ Completed - Comprehensive client with retry logic
**Basic Game Components**: ✅ Completed - Story, Character, Inventory, Quest panels
**Type System**: ✅ Completed - Full TypeScript integration matching backend

## 🎯 Current Implementation Summary

### ✅ **Fully Implemented & Working**
- **Project Infrastructure**: Next.js 15.3.2, TypeScript, Tailwind CSS 4, ESLint, Prettier
- **State Management**: Zustand store with comprehensive game state, React Query for server state
- **API Integration**: Complete GameAPIClient with retry logic, error handling, and mock fallback
- **WebSocket Communication**: Real-time game updates with connection management and recovery
- **Core Layout**: Responsive GameLayout with Header, Sidebar, Footer, and MainContent
- **Story Interface**: Full StoryPanel with real-time narrative display, action input, and AI generation indicators
- **Session Management**: SessionManager component with session selection and history
- **UI Components**: Button, Card, Input, Loading components with consistent design system
- **Custom Hooks**: useGameWebSocket, useGameAction, useLocalStorage for reusable functionality
- **Type System**: Complete TypeScript interfaces matching backend Pydantic models

### 🔄 **Partially Implemented (Needs Enhancement)**
- **Character System**: CharacterPanel exists but needs full stat display and progression tracking
- **Inventory System**: InventoryPanel structure exists but needs item management functionality
- **Quest System**: QuestsPanel structure exists but needs quest tracking and notifications
- **World Interface**: WorldPanel structure exists but needs location and environment visualization

### ⏳ **Pending Implementation**
- **Advanced UI Features**: Animations, accessibility improvements, keyboard navigation
- **Testing**: Unit tests, integration tests, E2E tests (frameworks configured)
- **Performance Optimization**: Code splitting, lazy loading, bundle optimization
- **Advanced Game Features**: Story bookmarking, export functionality, world map
- **Documentation**: Component documentation, user guides, developer documentation

## 🚀 Immediate Next Steps & Priorities

### **Priority 1: Complete Core Game Features (1-2 weeks)**
1. **Enhance Character System**
   - Implement full character stat display with visual indicators
   - Add character progression tracking and level-up notifications
   - Create equipment slot management with drag-and-drop
   - Build character customization interface

2. **Complete Inventory Management**
   - Implement item cards with tooltips and detailed information
   - Add drag-and-drop functionality for item management
   - Create inventory filtering and sorting capabilities
   - Build equipment comparison and recommendation system

3. **Finish Quest System**
   - Implement quest tracking with progress indicators
   - Add quest notifications and completion celebrations
   - Create quest history and achievement tracking
   - Build quest objective visualization

### **Priority 2: Enhanced User Experience (1 week)**
1. **Add Missing Story Features**
   - Implement story bookmarking system
   - Create story export functionality (PDF, markdown)
   - Add story search and filtering capabilities
   - Build story chapter organization

2. **Improve World Interface**
   - Create location visualization with descriptions
   - Implement environment panel with weather/time display
   - Add world event tracking and notifications
   - Build basic world map interface

### **Priority 3: Polish & Production Readiness (1 week)**
1. **Advanced Features**
   - Add smooth animations and transitions
   - Implement advanced caching strategies
   - Create comprehensive error tracking
   - Build deployment pipeline

2. **Documentation & Maintenance**
   - Create component documentation with Storybook
   - Write user guides and tutorials
   - Build developer documentation
   - Set up monitoring and analytics

## �📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Framework Selection & Justification](#framework-selection--justification)
3. [Architecture Overview](#architecture-overview)
4. [Component Structure](#component-structure)
5. [State Management Strategy](#state-management-strategy)
6. [Backend Integration Plan](#backend-integration-plan)
7. [Development Roadmap](#development-roadmap)
8. [Technology Stack](#technology-stack)
9. [Key Features Implementation](#key-features-implementation)
10. [Performance & Optimization](#performance--optimization)
11. [Testing Strategy](#testing-strategy)
12. [Deployment & DevOps](#deployment--devops)

## 🎯 Executive Summary

The emergentRPG frontend will be built as a modern, responsive web application that prioritizes AI-driven storytelling experiences. The architecture emphasizes real-time narrative generation, seamless backend integration, and an intuitive user experience that showcases the platform's innovative AI-first approach to RPG mechanics.

### Key Design Principles

- **AI-First User Experience**: Interface designed around AI narrative generation
- **Real-time Responsiveness**: Immediate feedback and live story updates
- **Seamless Integration**: Perfect compatibility with existing backend APIs
- **Accessibility**: Inclusive design for all users
- **Performance**: Optimized for rich, dynamic content delivery
- **Scalability**: Architecture ready for future feature expansion

### Target User Experience

- **Immersive Storytelling**: Rich, dynamic narrative display with real-time AI generation
- **Intuitive Gameplay**: Simple, clear interfaces that don't distract from the story
- **Character Connection**: Deep character development visualization and tracking
- **World Exploration**: Interactive world state and location management
- **Social Features**: Ready for future multiplayer and sharing capabilities

## 🚀 Framework Selection & Justification

### Recommended Framework: **React with Next.js 14+ (App Router)**

#### Primary Justification

**1. Server-Side Rendering (SSR) Benefits**
- Critical for SEO optimization of story content
- Improved initial load performance for rich narrative content
- Better social media sharing with dynamic meta tags
- Enhanced accessibility with server-rendered content

**2. Real-time Capabilities**
- Excellent WebSocket support for live AI narrative generation
- Built-in optimization for frequent DOM updates
- Efficient handling of streaming content
- Superior performance for real-time game state updates

**3. TypeScript Integration**
- Strong type safety to match backend Pydantic models
- Enhanced developer experience with IntelliSense
- Reduced runtime errors through compile-time checking
- Better maintainability for complex game logic

**4. Performance Optimization**
- Built-in code splitting and lazy loading
- Automatic optimization for dynamic content
- Efficient bundle management for large applications
- Superior caching strategies for AI-generated content

**5. Ecosystem & Community**
- Extensive library support for complex UI components
- Strong AI/ML library ecosystem
- Mature testing frameworks and tools
- Large community for troubleshooting and best practices

**6. Backend Compatibility**
- Already configured in backend CORS settings (`http://localhost:3000`)
- Excellent API integration capabilities
- Strong WebSocket support for real-time features
- Compatible with FastAPI's async patterns

#### Alternative Frameworks Considered

**Svelte/SvelteKit**
- **Pros**: Excellent performance, smaller bundle sizes, simpler syntax
- **Cons**: Smaller ecosystem, fewer AI/ML libraries, less mature tooling
- **Verdict**: Great for simple apps, but React's ecosystem better suits our complex requirements

**Vue.js with Nuxt**
- **Pros**: Good performance, intuitive API, strong SSR support
- **Cons**: Smaller ecosystem for AI/gaming libraries, less TypeScript maturity
- **Verdict**: Solid choice, but React has better support for our specific use cases

**Angular**
- **Pros**: Enterprise-grade architecture, excellent TypeScript support
- **Cons**: Steep learning curve, heavyweight for our needs, less flexibility
- **Verdict**: Overkill for our requirements, React provides better balance

## 🏗️ Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                        │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer │  State Management  │  Service Layer   │
│  ├─ Game Interface  │  ├─ Zustand Store  │  ├─ API Client   │
│  ├─ Story Display   │  ├─ React Query    │  ├─ WebSocket    │
│  ├─ Character UI    │  ├─ Local Storage  │  ├─ Auth Service │
│  ├─ World Interface │  ├─ Session State  │  ├─ Cache Layer  │
│  └─ Admin Panel     │  └─ UI State       │  └─ Error Handler│
├─────────────────────────────────────────────────────────────┤
│                    FastAPI Backend                         │
│                 (Existing Architecture)                    │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture Layers

#### **1. Presentation Layer**
- **Responsibility**: User interface components and layouts
- **Technologies**: React components, Tailwind CSS, Framer Motion
- **Key Features**: Responsive design, accessibility, theming

#### **2. State Management Layer**
- **Responsibility**: Application state coordination
- **Technologies**: Zustand (global state), React Query (server state)
- **Key Features**: Real-time updates, offline support, caching

#### **3. Service Layer**
- **Responsibility**: External communication and business logic
- **Technologies**: Axios (HTTP), WebSocket API, custom services
- **Key Features**: API integration, error handling, retry logic

#### **4. Data Flow Architecture**

```
User Interaction
        ↓
React Component
        ↓
Custom Hook (useGameAction)
        ↓
Service Layer (GameAPIClient)
        ↓
Backend API / WebSocket
        ↓
Response Processing
        ↓
State Update (Zustand/React Query)
        ↓
Component Re-render
        ↓
UI Update
```

### Integration with Existing Backend

The frontend architecture is specifically designed to leverage the existing backend's strengths:

- **API Compatibility**: Direct integration with all documented endpoints
- **WebSocket Support**: Real-time connection to `/ws/game/{session_id}`
- **Data Model Alignment**: TypeScript interfaces matching Pydantic models
- **Error Handling**: Compatible with backend error response format
- **Performance**: Optimized for backend's async response patterns

## 🧩 Component Structure

### Core Layout Components

```typescript
// Layout Components
layouts/
├── GameLayout.tsx              // Main game interface layout
│   ├── Header: Navigation and user info
│   ├── Sidebar: Quick actions and character summary
│   ├── Main: Primary game content area
│   └── Footer: Status indicators and controls
├── AuthLayout.tsx              // Authentication pages layout
│   ├── Centered design for login/register
│   └── Minimal branding and navigation
├── AdminLayout.tsx             // Admin/scenario management layout
│   ├── Advanced navigation for content management
│   ├── Multi-panel interface for complex operations
│   └── Data visualization components
└── PublicLayout.tsx            // Public pages (landing, about)
    ├── Marketing-focused design
    ├── Feature showcases
    └── Call-to-action elements

// Navigation Components
navigation/
├── GameNavigation.tsx          // In-game navigation and menus
│   ├── Tab-based navigation (Story, Character, Inventory, Quests)
│   ├── Breadcrumb navigation for complex interfaces
│   └── Context-sensitive menu items
├── QuickActions.tsx            // Quick action buttons
│   ├── Frequently used game actions
│   ├── Customizable action bar
│   └── Keyboard shortcut support
├── SettingsMenu.tsx            // Game settings and preferences
│   ├── Theme selection (light/dark/auto)
│   ├── Accessibility options
│   ├── Performance settings
│   └── Audio/visual preferences
└── BreadcrumbNav.tsx           // Hierarchical navigation
    ├── Dynamic breadcrumb generation
    ├── Click-to-navigate functionality
    └── Current location highlighting
```

### Game Session Components

```typescript
// Game Session Management
game/
├── GameSession.tsx             // Main game session container
│   ├── Session state management
│   ├── Real-time connection handling
│   ├── Error boundary implementation
│   └── Performance monitoring
├── SessionCreator.tsx          // New game session creation
│   ├── Lorebook selection interface
│   ├── Character creation wizard
│   ├── Scenario template selection
│   └── Advanced configuration options
├── SessionLoader.tsx           // Load existing sessions
│   ├── Session history display
│   ├── Search and filter functionality
│   ├── Session preview cards
│   └── Import/export capabilities
├── SessionManager.tsx          // Session state management
│   ├── Auto-save functionality
│   ├── Session backup and restore
│   ├── Multiple session support
│   └── Session sharing features
└── SessionDashboard.tsx        // Session overview and statistics
    ├── Play time tracking
    ├── Story progress visualization
    ├── Character development summary
    └── Achievement tracking

// Real-time Gameplay
gameplay/
├── ActionInput.tsx             // Player action input interface
│   ├── Rich text input with suggestions
│   ├── Action history and templates
│   ├── Voice input support (future)
│   └── Accessibility features
├── ActionHistory.tsx           // History of player actions
│   ├── Chronological action display
│   ├── Search and filter functionality
│   ├── Action replay capability
│   └── Export functionality
├── GameControls.tsx            // Game control buttons
│   ├── Pause/resume functionality
│   ├── Save/load controls
│   ├── Settings access
│   └── Help and tutorial access
├── QuickActionBar.tsx          // Frequently used actions
│   ├── Customizable action shortcuts
│   ├── Context-sensitive suggestions
│   ├── Drag-and-drop organization
│   └── Keyboard shortcut display
└── AIGenerationStatus.tsx     // AI processing status
    ├── Real-time generation progress
    ├── Queue status display
    ├── Error state handling
    └── Retry functionality
```

### Narrative Display Components

```typescript
// Story and Narrative
story/
├── StoryDisplay.tsx            // Main narrative text display
│   ├── Rich text rendering with markdown support
│   ├── Syntax highlighting for special content
│   ├── Image and media embedding
│   └── Interactive story elements
├── StoryEntry.tsx              // Individual story entry
│   ├── Timestamp and metadata display
│   ├── Entry type styling (narration, action, dialogue)
│   ├── Expandable/collapsible content
│   └── Social sharing functionality
├── NarrativeStream.tsx         // Real-time narrative updates
│   ├── Streaming text animation
│   ├── Typing indicator during AI generation
│   ├── Smooth scroll to new content
│   └── Audio narration support (future)
├── StoryHistory.tsx            // Full story history viewer
│   ├── Infinite scroll implementation
│   ├── Search and filter capabilities
│   ├── Chapter/section organization
│   └── Export to various formats
├── StoryExport.tsx             // Export story functionality
│   ├── PDF generation
│   ├── Markdown export
│   ├── Social media sharing
│   └── Print-friendly formatting
└── StoryBookmarks.tsx          // Bookmark important moments
    ├── User-created bookmarks
    ├── Auto-generated chapter markers
    ├── Quick navigation to bookmarks
    └── Bookmark sharing and notes

// AI Content Display
ai-content/
├── AIResponse.tsx              // AI-generated responses
│   ├── Response confidence indicators
│   ├── Alternative response options
│   ├── Regeneration functionality
│   └── Response rating system
├── LoadingIndicator.tsx        // AI generation loading states
│   ├── Animated loading indicators
│   ├── Progress estimation
│   ├── Cancel generation option
│   └── Queue position display
├── ContentRenderer.tsx         // Rich content rendering
│   ├── Markdown to HTML conversion
│   ├── Custom component rendering
│   ├── Media content handling
│   └── Interactive element support
├── FallbackContent.tsx         // Fallback for AI failures
│   ├── Error state display
│   ├── Retry mechanisms
│   ├── Manual input options
│   └── Graceful degradation
└── AIInsights.tsx              // AI analysis and insights
    ├── Character development insights
    ├── Story progression analysis
    ├── World state explanations
    └── Suggestion system
```

### Character Management Components

```typescript
// Character System
character/
├── CharacterSheet.tsx          // Full character information
│   ├── Comprehensive stat display
│   ├── Equipment visualization
│   ├── Skill and ability tracking
│   └── Character portrait and customization
├── CharacterCreator.tsx        // Character creation interface
│   ├── Step-by-step creation wizard
│   ├── AI-assisted character generation
│   ├── Background and personality selection
│   └── Visual customization tools
├── CharacterStats.tsx          // Character statistics display
│   ├── Real-time stat updates
│   ├── Stat comparison and history
│   ├── Visual stat representations
│   └── Stat explanation tooltips
├── CharacterProgress.tsx       // Level and progression tracking
│   ├── Experience point visualization
│   ├── Level-up animations
│   ├── Progression milestone tracking
│   └── Achievement system
├── CharacterCustomizer.tsx     // Character appearance/background
│   ├── Visual appearance editor
│   ├── Background story generator
│   ├── Personality trait selection
│   └── AI-generated character art (future)
└── CharacterComparison.tsx     // Compare character versions
    ├── Before/after stat comparison
    ├── Development timeline
    ├── Milestone achievement tracking
    └── Character arc visualization

// Character Development
development/
├── LevelUpNotification.tsx     // Level-up notifications
│   ├── Animated level-up display
│   ├── New ability notifications
│   ├── Stat increase visualization
│   └── Achievement unlocks
├── SkillTree.tsx              // Skill development visualization
│   ├── Interactive skill tree interface
│   ├── Prerequisite visualization
│   ├── Skill point allocation
│   └── AI-recommended development paths
├── ProgressTracker.tsx        // Character arc progression
│   ├── Story milestone tracking
│   ├── Character goal visualization
│   ├── Relationship development
│   └── Personal growth metrics
├── DevelopmentHistory.tsx     // Character development timeline
│   ├── Chronological development display
│   ├── Major event highlighting
│   ├── Decision impact visualization
│   └── Alternative path exploration
└── PersonalityTracker.tsx     // Personality evolution
    ├── Personality trait tracking
    ├── Behavioral pattern analysis
    ├── AI-generated personality insights
    └── Character consistency monitoring
```

### World and Scenario Components

```typescript
// World Management
world/
├── WorldState.tsx              // Current world state display
│   ├── Environmental condition display
│   ├── Active world events
│   ├── NPC status tracking
│   └── World timeline visualization
├── LocationDisplay.tsx         // Current location information
│   ├── Location description and imagery
│   ├── Available actions and interactions
│   ├── Connected location navigation
│   └── Location history tracking
├── EnvironmentPanel.tsx        // Environmental conditions
│   ├── Weather and time display
│   ├── Special condition indicators
│   ├── Environmental effect explanations
│   └── Atmospheric audio/visual effects
├── WorldMap.tsx               // Interactive world map
│   ├── Zoomable and pannable map interface
│   ├── Location markers and information
│   ├── Travel route planning
│   └── Exploration progress tracking
└── WorldEvents.tsx            // Active world events
    ├── Event timeline display
    ├── Event impact visualization
    ├── Player involvement tracking
    └── Event outcome possibilities

// Scenario Management
scenarios/
├── ScenarioSelector.tsx        // Scenario selection interface
│   ├── Scenario browsing and filtering
│   ├── Difficulty and duration indicators
│   ├── Preview and description display
│   └── Recommendation system
├── ScenarioCreator.tsx         // Create new scenarios
│   ├── AI-assisted scenario generation
│   ├── Template customization tools
│   ├── Playtesting and validation
│   └── Community sharing features
├── LorebookViewer.tsx          // Browse lorebook content
│   ├── Character profile browser
│   ├── Location and world system explorer
│   ├── Timeline and event viewer
│   └── Relationship visualization
├── TemplateManager.tsx         // Manage scenario templates
│   ├── Template creation and editing
│   ├── Version control and history
│   ├── Template sharing and collaboration
│   └── Performance analytics
└── GenerationMonitor.tsx       // Monitor AI generation tasks
    ├── Generation progress tracking
    ├── Queue management interface
    ├── Error handling and retry
    └── Generation quality metrics
```

### Inventory and Quest Components

```typescript
// Inventory System
inventory/
├── InventoryPanel.tsx          // Main inventory interface
│   ├── Grid-based item display
│   ├── Drag-and-drop functionality
│   ├── Item sorting and filtering
│   └── Inventory capacity management
├── ItemCard.tsx               // Individual item display
│   ├── Item icon and rarity indication
│   ├── Stat and effect display
│   ├── Item description and lore
│   └── Action buttons (equip, use, drop)
├── EquipmentSlots.tsx         // Equipment management
│   ├── Visual equipment slot interface
│   ├── Stat effect visualization
│   ├── Equipment comparison tools
│   └── Set bonus tracking
├── ItemTooltip.tsx            // Item information tooltips
│   ├── Detailed item statistics
│   ├── Comparison with equipped items
│   ├── Market value and rarity info
│   └── Usage recommendations
├── InventoryFilters.tsx       // Inventory filtering/sorting
│   ├── Multi-criteria filtering
│   ├── Custom sort options
│   ├── Search functionality
│   └── Saved filter presets
└── ItemCrafting.tsx           // Item creation and modification
    ├── AI-generated item creation
    ├── Item enhancement interface
    ├── Recipe and material tracking
    └── Crafting success visualization

// Quest System
quests/
├── QuestLog.tsx               // Active quests display
│   ├── Quest priority and status
│   ├── Objective tracking
│   ├── Quest timeline and deadlines
│   └── Reward preview
├── QuestCard.tsx              // Individual quest information
│   ├── Quest description and objectives
│   ├── Progress visualization
│   ├── Reward and penalty display
│   └── Quest giver information
├── QuestTracker.tsx           // Quest progress tracking
│   ├── Real-time objective updates
│   ├── Mini-map integration
│   ├── Hint and guidance system
│   └── Completion celebration
├── QuestNotifications.tsx     // Quest update notifications
│   ├── New quest notifications
│   ├── Objective completion alerts
│   ├── Quest failure warnings
│   └── Reward claim notifications
└── QuestHistory.tsx           // Completed quest archive
    ├── Quest completion timeline
    ├── Reward and experience tracking
    ├── Quest outcome analysis
    └── Replay and review functionality
```

## 🔄 State Management Strategy

### Primary State Management: **Zustand + React Query**

The frontend uses a hybrid approach combining Zustand for client-side state and React Query for server state management, providing optimal performance and developer experience.

#### **Global Game State (Zustand)**

```typescript
interface GameState {
  // Session Management
  currentSession: GameSession | null;
  sessionHistory: GameSession[];

  // Real-time State
  isConnected: boolean;
  isAIGenerating: boolean;
  lastUpdate: Date;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';

  // UI State
  activePanel: 'story' | 'character' | 'inventory' | 'quests' | 'world';
  theme: 'light' | 'dark' | 'auto';
  uiConfig: UIConfig;
  sidebarCollapsed: boolean;

  // Game State
  pendingActions: PlayerAction[];
  actionHistory: PlayerAction[];

  // Actions
  setCurrentSession: (session: GameSession) => void;
  updateWorldState: (worldState: WorldState) => void;
  addStoryEntry: (entry: StoryEntry) => void;
  setAIGenerating: (generating: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  addPendingAction: (action: PlayerAction) => void;
  clearPendingActions: () => void;
}

// Store Implementation
const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  currentSession: null,
  sessionHistory: [],
  isConnected: false,
  isAIGenerating: false,
  lastUpdate: new Date(),
  connectionStatus: 'disconnected',
  activePanel: 'story',
  theme: 'auto',
  uiConfig: defaultUIConfig,
  sidebarCollapsed: false,
  pendingActions: [],
  actionHistory: [],

  // Actions
  setCurrentSession: (session) => set({ currentSession: session }),
  updateWorldState: (worldState) => set((state) => ({
    currentSession: state.currentSession ? {
      ...state.currentSession,
      world_state: worldState
    } : null
  })),
  addStoryEntry: (entry) => set((state) => ({
    currentSession: state.currentSession ? {
      ...state.currentSession,
      story: [...state.currentSession.story, entry]
    } : null
  })),
  setAIGenerating: (generating) => set({ isAIGenerating: generating }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  addPendingAction: (action) => set((state) => ({
    pendingActions: [...state.pendingActions, action]
  })),
  clearPendingActions: () => set({ pendingActions: [] }),
}));
```

#### **Server State Management (React Query)**

```typescript
// Game Session Queries
const useGameSession = (sessionId: string) => {
  return useQuery({
    queryKey: ['gameSession', sessionId],
    queryFn: () => gameAPI.getSession(sessionId),
    refetchInterval: 30000, // Periodic updates
    staleTime: 10000, // Consider data stale after 10 seconds
    enabled: !!sessionId,
  });
};

const useGameSessions = () => {
  return useQuery({
    queryKey: ['gameSessions'],
    queryFn: gameAPI.getSessions,
    staleTime: 60000, // Sessions list doesn't change frequently
  });
};

// Game Action Mutations
const usePerformAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, action }: { sessionId: string; action: string }) =>
      gameAPI.performAction(sessionId, action),
    onMutate: async ({ sessionId, action }) => {
      // Optimistic update
      await queryClient.cancelQueries(['gameSession', sessionId]);

      const previousSession = queryClient.getQueryData(['gameSession', sessionId]);

      // Optimistically update the session
      queryClient.setQueryData(['gameSession', sessionId], (old: GameSession) => ({
        ...old,
        story: [...old.story, {
          id: `temp-${Date.now()}`,
          type: 'player',
          text: action,
          timestamp: new Date().toISOString()
        }]
      }));

      return { previousSession };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSession) {
        queryClient.setQueryData(['gameSession', variables.sessionId], context.previousSession);
      }
    },
    onSuccess: (data, variables) => {
      // Update with server response
      queryClient.setQueryData(['gameSession', variables.sessionId], data.updated_session);
    },
  });
};

// Scenario and Lorebook Queries
const useScenarios = (filters?: ScenarioFilters) => {
  return useQuery({
    queryKey: ['scenarios', filters],
    queryFn: () => gameAPI.getScenarios(filters),
    staleTime: 300000, // Scenarios don't change frequently
  });
};

const useLorebooks = (filters?: LorebookFilters) => {
  return useQuery({
    queryKey: ['lorebooks', filters],
    queryFn: () => gameAPI.getLorebooks(filters),
    staleTime: 300000,
  });
};
```

#### **Local Storage Strategy**

```typescript
// Persistent Local State
interface LocalGameState {
  // Offline Support
  cachedSessions: GameSession[];
  pendingActions: PlayerAction[];
  lastSyncTime: Date;

  // User Preferences
  userSettings: UserSettings;
  uiPreferences: UIPreferences;

  // Performance
  offlineMode: boolean;
  cacheSize: number;
}

// Local Storage Hook
const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
};

// Offline State Management
const useOfflineState = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useLocalStorage<PlayerAction[]>('pendingActions', []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addPendingAction = (action: PlayerAction) => {
    if (!isOnline) {
      setPendingActions(prev => [...prev, action]);
    }
  };

  const syncPendingActions = async () => {
    if (isOnline && pendingActions.length > 0) {
      try {
        for (const action of pendingActions) {
          await gameAPI.performAction(action.sessionId, action.action);
        }
        setPendingActions([]);
      } catch (error) {
        console.error('Failed to sync pending actions:', error);
      }
    }
  };

  return { isOnline, pendingActions, addPendingAction, syncPendingActions };
};
```

## 🔗 Backend Integration Plan

### API Client Architecture

The frontend integrates seamlessly with the existing FastAPI backend through a comprehensive API client service that handles all communication patterns.

#### **Core API Client Service**

```typescript
// API Client Configuration
interface APIConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

class GameAPIClient {
  private baseURL: string;
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: APIConfig) {
    this.baseURL = config.baseURL;
    this.setupAxiosInterceptors();
  }

  // REST API Methods
  async createSession(data: CreateSessionRequest): Promise<GameSession> {
    const response = await this.post('/api/game/sessions', data);
    return response.data;
  }

  async getSession(sessionId: string): Promise<GameSession> {
    const response = await this.get(`/api/game/sessions/${sessionId}`);
    return response.data.session;
  }

  async performAction(sessionId: string, action: string): Promise<ActionResult> {
    const response = await this.post(`/api/game/sessions/${sessionId}/action`, { action });
    return response.data;
  }

  async getScenarios(filters?: ScenarioFilters): Promise<ScenarioTemplate[]> {
    const response = await this.get('/api/scenarios/templates', { params: filters });
    return response.data.templates;
  }

  async getLorebooks(filters?: LorebookFilters): Promise<Lorebook[]> {
    const response = await this.get('/api/lorebooks', { params: filters });
    return response.data.lorebooks;
  }

  async getLorebookDetails(lorebookId: string): Promise<Lorebook> {
    const response = await this.get(`/api/lorebooks/${lorebookId}`);
    return response.data.lorebook;
  }

  async startScenarioGeneration(request: GenerationRequest): Promise<string> {
    const response = await this.post('/api/scenarios/generate', request);
    return response.data.task_id;
  }

  async getGenerationStatus(taskId: string): Promise<GenerationTask> {
    const response = await this.get(`/api/scenarios/status/${taskId}`);
    return response.data;
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const response = await this.get('/api/health');
    return response.data;
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const response = await this.get('/api/performance');
    return response.data;
  }

  // WebSocket Methods
  connectToSession(sessionId: string, callbacks: WebSocketCallbacks): void {
    const wsURL = `ws://localhost:8001/ws/game/${sessionId}`;
    this.wsConnection = new WebSocket(wsURL);
    this.setupWebSocketHandlers(callbacks);
  }

  sendAction(action: string): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'action',
        data: { action }
      }));
    } else {
      throw new Error('WebSocket connection not available');
    }
  }

  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // Private helper methods
  private setupAxiosInterceptors(): void {
    // Request interceptor for auth headers
    axios.interceptors.request.use((config) => {
      // Add auth headers when available
      const authHeaders = this.getAuthHeaders();
      config.headers = { ...config.headers, ...authHeaders };
      return config;
    });

    // Response interceptor for error handling
    axios.interceptors.response.use(
      (response) => response,
      (error) => this.handleAPIError(error)
    );
  }

  private setupWebSocketHandlers(callbacks: WebSocketCallbacks): void {
    if (!this.wsConnection) return;

    this.wsConnection.onopen = () => {
      this.reconnectAttempts = 0;
      callbacks.onConnect?.();
    };

    this.wsConnection.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message, callbacks);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.wsConnection.onclose = () => {
      callbacks.onDisconnect?.();
      this.attemptReconnect(callbacks);
    };

    this.wsConnection.onerror = (error) => {
      callbacks.onError?.(error);
    };
  }

  private handleWebSocketMessage(message: any, callbacks: WebSocketCallbacks): void {
    switch (message.type) {
      case 'narrative_response':
        callbacks.onNarrativeUpdate?.(message.data);
        break;
      case 'world_change':
        callbacks.onWorldUpdate?.(message.data);
        break;
      case 'character_update':
        callbacks.onCharacterUpdate?.(message.data);
        break;
      case 'quest_update':
        callbacks.onQuestUpdate?.(message.data);
        break;
      case 'error':
        callbacks.onError?.(new Error(message.data.message));
        break;
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private attemptReconnect(callbacks: WebSocketCallbacks): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

      setTimeout(() => {
        if (callbacks.sessionId) {
          this.connectToSession(callbacks.sessionId, callbacks);
        }
      }, delay);
    }
  }

  private getAuthHeaders(): Record<string, string> {
    // Future implementation for authentication
    return {};
  }

  private handleAPIError(error: any): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const apiError = new APIError(
        error.response.data.message || 'API Error',
        error.response.status,
        error.response.data.details
      );
      return Promise.reject(apiError);
    } else if (error.request) {
      // Network error
      return Promise.reject(new NetworkError('Network connection failed'));
    } else {
      // Other error
      return Promise.reject(error);
    }
  }
}

// WebSocket callback interface
interface WebSocketCallbacks {
  sessionId?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onNarrativeUpdate?: (data: any) => void;
  onWorldUpdate?: (data: any) => void;
  onCharacterUpdate?: (data: any) => void;
  onQuestUpdate?: (data: any) => void;
  onError?: (error: Error) => void;
}

// Error classes
class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

#### **Real-time Communication Hooks**

```typescript
// WebSocket Hook for Real-time Updates
const useGameWebSocket = (sessionId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<GameMessage | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const gameStore = useGameStore();

  const callbacks: WebSocketCallbacks = {
    sessionId,
    onConnect: () => {
      setIsConnected(true);
      setError(null);
      gameStore.setConnectionStatus('connected');
    },
    onDisconnect: () => {
      setIsConnected(false);
      gameStore.setConnectionStatus('disconnected');
    },
    onNarrativeUpdate: (data) => {
      gameStore.addStoryEntry(data.story_entry);
      if (data.world_changes) {
        gameStore.updateWorldState(data.world_changes);
      }
      setLastMessage({ type: 'narrative', data });
    },
    onWorldUpdate: (data) => {
      gameStore.updateWorldState(data.world_state);
      setLastMessage({ type: 'world', data });
    },
    onCharacterUpdate: (data) => {
      // Update character in current session
      setLastMessage({ type: 'character', data });
    },
    onQuestUpdate: (data) => {
      // Update quests in current session
      setLastMessage({ type: 'quest', data });
    },
    onError: (error) => {
      setError(error);
      gameStore.setConnectionStatus('error');
    },
  };

  useEffect(() => {
    if (sessionId) {
      gameAPI.connectToSession(sessionId, callbacks);

      return () => {
        gameAPI.disconnect();
      };
    }
  }, [sessionId]);

  const sendAction = useCallback((action: string) => {
    try {
      gameAPI.sendAction(action);
    } catch (error) {
      setError(error as Error);
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    error,
    sendAction,
    clearError: () => setError(null)
  };
};

// Custom hook for game actions with offline support
const useGameAction = (sessionId: string) => {
  const performActionMutation = usePerformAction();
  const { isOnline, addPendingAction } = useOfflineState();
  const { sendAction: sendWebSocketAction } = useGameWebSocket(sessionId);

  const performAction = useCallback(async (action: string) => {
    if (isOnline) {
      try {
        // Try WebSocket first for real-time response
        sendWebSocketAction(action);
      } catch (error) {
        // Fallback to REST API
        await performActionMutation.mutateAsync({ sessionId, action });
      }
    } else {
      // Queue action for later sync
      addPendingAction({ sessionId, action, timestamp: new Date() });
    }
  }, [sessionId, isOnline, sendWebSocketAction, performActionMutation, addPendingAction]);

  return {
    performAction,
    isLoading: performActionMutation.isLoading,
    error: performActionMutation.error,
  };
};
```

## 🗓️ Development Roadmap

### **Phase 1: Foundation (Weeks 1-2)** ✅ **COMPLETED**

#### **Week 1: Project Setup & Core Infrastructure** ✅ **COMPLETED**

**Day 1-2: Project Initialization** ✅ **COMPLETED**
- ✅ Initialize Next.js 15.3.2 project with TypeScript
- ✅ Configure ESLint, Prettier, and Tailwind CSS 4
- ✅ Set up project structure and folder organization
- ✅ Configure environment variables and build scripts
- ✅ Set up Git hooks and development workflow

**Day 3-4: Design System & Theming** ✅ **COMPLETED**
- ✅ Implement design system with Tailwind CSS
- ✅ Create theme configuration (light/dark modes)
- ✅ Build core UI components (buttons, inputs, cards, loading)
- ✅ Set up responsive breakpoints and utilities
- ⏳ Create component documentation with Storybook (PENDING)

**Day 5-7: Basic Layout & Navigation** ✅ **COMPLETED**
- ✅ Implement layout components (GameLayout, Header, Footer, Sidebar)
- ✅ Create navigation system with routing
- ✅ Build responsive header and sidebar components
- ✅ Set up comprehensive state management with Zustand
- ✅ Implement theme switching functionality

#### **Week 2: Core Game Interface** ✅ **COMPLETED**

**Day 8-10: Game Session Foundation** ✅ **COMPLETED**
- ✅ Create game session container component (SessionManager)
- ✅ Implement comprehensive story display component (StoryPanel)
- ✅ Build action input interface with form handling
- ✅ Set up complete API client service architecture with fallback
- ✅ Configure React Query for server state management

**Day 11-14: Real-time Communication** ✅ **COMPLETED**
- ✅ Integrate WebSocket connections with game_websocket service
- ✅ Implement real-time story updates with optimistic updates
- ✅ Add connection status indicators and management
- ✅ Create comprehensive error handling and retry logic
- ✅ Build offline support foundation with local storage

### **Phase 2: Core Gameplay (Weeks 3-4)** 🔄 **IN PROGRESS**

#### **Week 3: Session Management** ✅ **COMPLETED**

**Day 15-17: Session Creation & Loading** ✅ **COMPLETED**
- ✅ Build session creation wizard (SessionManager component)
- ✅ Implement lorebook selection interface (API integration ready)
- ✅ Create character creation flow (basic structure)
- ✅ Add session history and management (Zustand store)
- ⏳ Implement session import/export (PENDING)

**Day 18-21: Character System Foundation** 🔄 **PARTIALLY COMPLETED**
- ✅ Build character sheet interface (CharacterPanel component)
- ✅ Implement character stats display (basic structure)
- ⏳ Create equipment management basics (PENDING - needs enhancement)
- ⏳ Add character progression tracking (PENDING - needs implementation)
- ⏳ Build character customization tools (PENDING - needs implementation)

#### **Week 4: Interactive Gameplay** ✅ **COMPLETED**

**Day 22-24: Action System** ✅ **COMPLETED**
- ✅ Implement action input with suggestions (StoryPanel)
- ✅ Build action history display (integrated in StoryPanel)
- ✅ Create quick action bar (suggestion buttons)
- ✅ Add keyboard shortcuts (Enter to submit, Shift+Enter for new line)
- ✅ Implement action validation (Zod schema validation)

**Day 25-28: Story & Narrative** ✅ **COMPLETED**
- ✅ Build rich story display component (StoryPanel with markdown support)
- ✅ Implement narrative streaming (real-time WebSocket updates)
- ⏳ Add story bookmarking system (PENDING - needs implementation)
- ⏳ Create story export functionality (PENDING - needs implementation)
- ⏳ Build story search and filtering (PENDING - needs implementation)

### **Phase 3: Advanced Features (Weeks 5-6)** 🔄 **PARTIALLY COMPLETED**

#### **Week 5: World & Scenario Management** 🔄 **PARTIALLY COMPLETED**

**Day 29-31: World Interface** 🔄 **PARTIALLY COMPLETED**
- ✅ Create world state display (WorldPanel component structure)
- ⏳ Build location visualization (PENDING - needs implementation)
- ⏳ Implement environment panel (PENDING - needs implementation)
- ⏳ Add world map interface (basic) (PENDING - needs implementation)
- ⏳ Create world event tracking (PENDING - needs implementation)

**Day 32-35: Scenario Tools** 🔄 **PARTIALLY COMPLETED**
- ✅ Build scenario selection interface (API integration ready)
- ✅ Implement lorebook browser (API endpoints available)
- ✅ Create scenario generation monitoring (API client methods ready)
- ⏳ Add template management tools (PENDING - needs UI implementation)
- ⏳ Build generation progress tracking (PENDING - needs UI implementation)

#### **Week 6: Inventory & Quest Systems** 🔄 **PARTIALLY COMPLETED**

**Day 36-38: Inventory Management** 🔄 **PARTIALLY COMPLETED**
- ✅ Create inventory panel interface (InventoryPanel component structure)
- ⏳ Build item cards and tooltips (PENDING - needs implementation)
- ⏳ Implement drag-and-drop functionality (PENDING - needs implementation)
- ⏳ Add inventory filtering and sorting (PENDING - needs implementation)
- ⏳ Create equipment slot management (PENDING - needs implementation)

**Day 39-42: Quest System** 🔄 **PARTIALLY COMPLETED**
- ✅ Build quest log interface (QuestsPanel component structure)
- ⏳ Implement quest tracking (PENDING - needs implementation)
- ⏳ Create quest notifications (PENDING - needs implementation)
- ⏳ Add quest history and completion (PENDING - needs implementation)
- ⏳ Build quest progress visualization (PENDING - needs implementation)

### **Phase 4: Polish & Optimization (Weeks 7-8)** ⏳ **PENDING**

#### **Week 7: Performance & UX** ⏳ **PENDING**

**Day 43-45: Performance Optimization** ⏳ **PENDING**
- ⏳ Implement code splitting and lazy loading (PENDING)
- ⏳ Optimize bundle size and loading times (PENDING)
- ⏳ Add performance monitoring (PENDING)
- ⏳ Implement caching strategies (PENDING)
- ⏳ Optimize re-renders and state updates (PENDING)

**Day 46-49: User Experience Enhancement** ⏳ **PENDING**
- ✅ Add comprehensive loading states (COMPLETED - Loading component)
- ⏳ Implement smooth transitions and animations (PENDING - Framer Motion ready)
- ⏳ Create accessibility features (PENDING)
- ✅ Build responsive mobile interface (COMPLETED - Tailwind responsive design)
- ⏳ Add keyboard navigation support (PENDING)

#### **Week 8: Testing & Documentation** ⏳ **PENDING**

**Day 50-52: Testing Implementation** ⏳ **PENDING**
- ⏳ Write unit tests for components (PENDING - Jest/Testing Library configured)
- ⏳ Add integration tests for key flows (PENDING)
- ⏳ Implement E2E tests for critical paths (PENDING - Playwright configured)
- ⏳ Set up automated testing pipeline (PENDING)
- ⏳ Add performance testing (PENDING)

**Day 53-56: Documentation & Deployment** ⏳ **PENDING**
- ⏳ Create user documentation (PENDING)
- ⏳ Build developer documentation (PENDING)
- ⏳ Set up deployment pipeline (PENDING)
- ⏳ Implement error tracking and monitoring (PENDING)
- ⏳ Conduct final testing and bug fixes (PENDING)

## 🛠️ Technology Stack

### **Core Dependencies** ✅ **IMPLEMENTED**

```json
{
  "dependencies": {
    // Core Framework ✅ COMPLETED
    "next": "15.3.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5",

    // State Management ✅ COMPLETED
    "zustand": "^5.0.5",
    "@tanstack/react-query": "^5.77.2",
    "@tanstack/react-query-devtools": "^5.77.2",

    // UI Framework & Styling ✅ COMPLETED
    "tailwindcss": "^4",
    "@headlessui/react": "^2.2.4",
    "@heroicons/react": "^2.2.0",
    "framer-motion": "^12.15.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.0",
    "class-variance-authority": "^0.7.1",

    // Forms & Validation ✅ COMPLETED
    "react-hook-form": "^7.56.4",
    "@hookform/resolvers": "^5.0.1",
    "zod": "^3.25.30",

    // HTTP & Real-time Communication ✅ COMPLETED
    "axios": "^1.9.0",
    // Note: Using native WebSocket instead of socket.io

    // Utilities ✅ COMPLETED
    "date-fns": "^4.1.0",
    "lodash": "^4.17.21",
    "uuid": "^11.1.0",
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1",

    // Rich Text & Content ✅ COMPLETED
    "react-syntax-highlighter": "^15.6.1",
    // Note: react-virtualized not yet implemented

    // Notifications & Feedback ✅ COMPLETED
    "react-hot-toast": "^2.5.2"
    // Note: react-confetti not yet implemented
  },

  "devDependencies": {
    // TypeScript & Types
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/node": "^20.0.0",
    "@types/lodash": "^4.14.0",
    "@types/uuid": "^9.0.0",

    // Development Tools
    "eslint": "^8.50.0",
    "eslint-config-next": "^14.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "prettier": "^3.0.0",
    "prettier-plugin-tailwindcss": "^0.5.0",

    // Testing
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@playwright/test": "^1.40.0",

    // Build & Development
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@next/bundle-analyzer": "^14.0.0",

    // Documentation
    "@storybook/react": "^7.5.0",
    "@storybook/addon-essentials": "^7.5.0"
  }
}
```

### **Project Structure** ✅ **IMPLEMENTED**

```
frontend/                      # ✅ COMPLETED
├── src/                       # ✅ COMPLETED
│   ├── app/                   # ✅ Next.js App Router - COMPLETED
│   │   ├── globals.css        # ✅ Global styles - COMPLETED
│   │   ├── layout.tsx         # ✅ Root layout - COMPLETED
│   │   └── page.tsx           # ✅ Home page with game interface - COMPLETED
│   │   # Note: Auth/admin routes not yet implemented
│   ├── components/            # ✅ Reusable components - COMPLETED
│   │   ├── ui/               # ✅ Basic UI components - COMPLETED
│   │   │   ├── Button.tsx    # ✅ COMPLETED
│   │   │   ├── Card.tsx      # ✅ COMPLETED
│   │   │   ├── Input.tsx     # ✅ COMPLETED
│   │   │   └── Loading.tsx   # ✅ COMPLETED
│   │   ├── game/             # ✅ Game-specific components - COMPLETED
│   │   │   ├── StoryPanel.tsx      # ✅ COMPLETED - Full implementation
│   │   │   ├── CharacterPanel.tsx  # 🔄 PARTIAL - Needs enhancement
│   │   │   ├── InventoryPanel.tsx  # 🔄 PARTIAL - Needs enhancement
│   │   │   ├── QuestsPanel.tsx     # 🔄 PARTIAL - Needs enhancement
│   │   │   └── WorldPanel.tsx      # 🔄 PARTIAL - Needs enhancement
│   │   ├── layout/           # ✅ Layout components - COMPLETED
│   │   │   ├── GameLayout.tsx      # ✅ COMPLETED
│   │   │   ├── Header.tsx          # ✅ COMPLETED
│   │   │   ├── Footer.tsx          # ✅ COMPLETED
│   │   │   ├── Sidebar.tsx         # ✅ COMPLETED
│   │   │   └── MainContent.tsx     # ✅ COMPLETED
│   │   ├── session/          # ✅ Session management - COMPLETED
│   │   │   └── SessionManager.tsx  # ✅ COMPLETED
│   │   └── providers/        # ✅ Context providers - COMPLETED
│   │       ├── Providers.tsx       # ✅ COMPLETED
│   │       ├── QueryProvider.tsx   # ✅ COMPLETED
│   │       ├── ThemeProvider.tsx   # ✅ COMPLETED
│   │       └── ToastProvider.tsx   # ✅ COMPLETED
│   ├── hooks/                 # ✅ Custom React hooks - COMPLETED
│   │   ├── useGameAction.ts   # ✅ COMPLETED
│   │   ├── useGameWebSocket.ts # ✅ COMPLETED
│   │   └── useLocalStorage.ts # ✅ COMPLETED
│   ├── services/              # ✅ API and business logic - COMPLETED
│   │   ├── api/              # ✅ API client services - COMPLETED
│   │   │   ├── client.ts     # ✅ COMPLETED - Full implementation
│   │   │   └── mockClient.ts # ✅ COMPLETED - Development fallback
│   │   └── websocket/        # ✅ WebSocket management - COMPLETED
│   │       └── gameWebSocket.ts # ✅ COMPLETED
│   ├── stores/                # ✅ Zustand stores - COMPLETED
│   │   └── gameStore.ts      # ✅ COMPLETED - Comprehensive state management
│   ├── types/                 # ✅ TypeScript type definitions - COMPLETED
│   │   ├── game.ts           # ✅ COMPLETED
│   │   ├── api.ts            # ✅ COMPLETED
│   │   ├── ui.ts             # ✅ COMPLETED
│   │   └── index.ts          # ✅ COMPLETED
│   └── utils/                 # ✅ Utility functions - COMPLETED
│       ├── formatting.ts     # ✅ COMPLETED
│       ├── validation.ts     # ✅ COMPLETED
│       ├── constants.ts      # ✅ COMPLETED
│       └── helpers.ts        # ✅ COMPLETED
├── public/                    # ✅ Static assets - COMPLETED
│   ├── file.svg              # ✅ COMPLETED
│   ├── globe.svg             # ✅ COMPLETED
│   ├── next.svg              # ✅ COMPLETED
│   ├── vercel.svg            # ✅ COMPLETED
│   └── window.svg            # ✅ COMPLETED
├── tailwind.config.ts         # ✅ Tailwind CSS configuration - COMPLETED
├── next.config.ts             # ✅ Next.js configuration - COMPLETED
├── tsconfig.json             # ✅ TypeScript configuration - COMPLETED
├── package.json              # ✅ Dependencies and scripts - COMPLETED
├── postcss.config.mjs        # ✅ PostCSS configuration - COMPLETED
├── eslint.config.mjs         # ✅ ESLint configuration - COMPLETED
└── package-lock.json         # ✅ Dependency lock file - COMPLETED

# ⏳ PENDING IMPLEMENTATION:
# - tests/ directory (Jest/Testing Library/Playwright configured)
# - .storybook/ directory (for component documentation)
# - docs/ directory (for project documentation)
# - Auth/admin routes in app directory
# - Additional static assets (images, icons, sounds)
```

## ⚡ Key Features Implementation

### **AI-Driven Narrative Display**

#### **Streaming Text Animation**
```typescript
const StreamingText: React.FC<{ text: string; speed?: number }> = ({
  text,
  speed = 50
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <div className="relative">
      <span>{displayedText}</span>
      {!isComplete && (
        <span className="animate-pulse">|</span>
      )}
    </div>
  );
};
```

#### **Rich Content Rendering**
```typescript
const ContentRenderer: React.FC<{ content: string }> = ({ content }) => {
  const components = {
    // Custom markdown components
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold text-primary mb-4">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-semibold text-secondary mb-3">{children}</h2>
    ),
    p: ({ children }: any) => (
      <p className="text-base leading-relaxed mb-3">{children}</p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-accent pl-4 italic my-4">
        {children}
      </blockquote>
    ),
    code: ({ children }: any) => (
      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
        {children}
      </code>
    ),
  };

  return (
    <ReactMarkdown
      components={components}
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  );
};
```

### **Real-time Gameplay Features**

#### **Optimistic Updates**
```typescript
const useOptimisticAction = (sessionId: string) => {
  const queryClient = useQueryClient();
  const gameStore = useGameStore();

  const performOptimisticAction = useCallback(async (action: string) => {
    // Immediately update UI
    const tempEntry: StoryEntry = {
      id: `temp-${Date.now()}`,
      type: 'player',
      text: action,
      timestamp: new Date().toISOString()
    };

    gameStore.addStoryEntry(tempEntry);

    try {
      // Send to server
      const result = await gameAPI.performAction(sessionId, action);

      // Replace temp entry with server response
      gameStore.replaceStoryEntry(tempEntry.id, result.action_result.player_action);
      gameStore.addStoryEntry(result.action_result.ai_response);

    } catch (error) {
      // Remove temp entry on error
      gameStore.removeStoryEntry(tempEntry.id);
      throw error;
    }
  }, [sessionId, gameStore]);

  return { performOptimisticAction };
};
```

#### **Connection Recovery**
```typescript
const useConnectionRecovery = (sessionId: string) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  const reconnect = useCallback(async () => {
    if (retryCount >= maxRetries) {
      setConnectionState('failed');
      return;
    }

    setConnectionState('reconnecting');
    setRetryCount(prev => prev + 1);

    try {
      await gameAPI.connectToSession(sessionId, {
        onConnect: () => {
          setConnectionState('connected');
          setRetryCount(0);
        },
        onError: () => {
          setTimeout(reconnect, Math.pow(2, retryCount) * 1000);
        }
      });
    } catch (error) {
      setTimeout(reconnect, Math.pow(2, retryCount) * 1000);
    }
  }, [sessionId, retryCount, maxRetries]);

  return { connectionState, reconnect, retryCount };
};
```

### **Character Progression Visualization**

#### **Animated Stat Changes**
```typescript
const AnimatedStat: React.FC<{
  label: string;
  value: number;
  previousValue?: number;
  max?: number;
}> = ({ label, value, previousValue, max = 100 }) => {
  const [displayValue, setDisplayValue] = useState(previousValue || value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (previousValue !== undefined && previousValue !== value) {
      setIsAnimating(true);

      const duration = 1000;
      const steps = 60;
      const increment = (value - previousValue) / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        setDisplayValue(previousValue + (increment * currentStep));

        if (currentStep >= steps) {
          setDisplayValue(value);
          setIsAnimating(false);
          clearInterval(timer);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value, previousValue]);

  const percentage = (displayValue / max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="font-medium">{label}</span>
        <span className={`font-bold ${isAnimating ? 'text-green-500' : ''}`}>
          {Math.round(displayValue)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isAnimating ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
```

### **Responsive Design Implementation**

#### **Adaptive Layout Hook**
```typescript
const useResponsiveLayout = () => {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width < 640) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');

      setOrientation(height > width ? 'portrait' : 'landscape');
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  const isMobile = screenSize === 'mobile';
  const isTablet = screenSize === 'tablet';
  const isDesktop = screenSize === 'desktop';

  return {
    screenSize,
    orientation,
    isMobile,
    isTablet,
    isDesktop,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
};
```

## 🚀 Performance & Optimization

### **Code Splitting Strategy**

```typescript
// Lazy load heavy components
const CharacterSheet = lazy(() => import('@/components/character/CharacterSheet'));
const InventoryPanel = lazy(() => import('@/components/inventory/InventoryPanel'));
const WorldMap = lazy(() => import('@/components/world/WorldMap'));

// Route-based code splitting
const GameSession = lazy(() => import('@/app/(game)/session/[id]/page'));
const ScenarioCreator = lazy(() => import('@/app/(admin)/scenarios/create/page'));

// Component wrapper with loading fallback
const LazyComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);
```

### **Memoization and Optimization**

```typescript
// Memoized story display for large story arrays
const StoryDisplay = memo(({ story }: { story: StoryEntry[] }) => {
  const memoizedEntries = useMemo(() =>
    story.map(entry => ({
      ...entry,
      formattedTime: formatDistanceToNow(new Date(entry.timestamp))
    })),
    [story]
  );

  return (
    <div className="space-y-4">
      {memoizedEntries.map(entry => (
        <StoryEntry key={entry.id} entry={entry} />
      ))}
    </div>
  );
});

// Debounced search for better performance
const useDebounceSearch = (searchTerm: string, delay: number = 300) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), delay);
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return debouncedTerm;
};
```

### **Caching Strategy**

```typescript
// React Query configuration for optimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error instanceof NetworkError) return failureCount < 3;
        return false;
      },
    },
  },
});

// Service Worker for offline caching
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  }
};
```

## 🧪 Testing Strategy

### **Unit Testing**

```typescript
// Component testing example
describe('StoryDisplay', () => {
  const mockStory: StoryEntry[] = [
    {
      id: '1',
      type: 'narration',
      text: 'You enter a dark forest...',
      timestamp: '2024-01-01T10:00:00Z'
    },
    {
      id: '2',
      type: 'player',
      text: 'I look around carefully',
      timestamp: '2024-01-01T10:01:00Z'
    }
  ];

  it('renders story entries correctly', () => {
    render(<StoryDisplay story={mockStory} />);

    expect(screen.getByText('You enter a dark forest...')).toBeInTheDocument();
    expect(screen.getByText('I look around carefully')).toBeInTheDocument();
  });

  it('handles empty story array', () => {
    render(<StoryDisplay story={[]} />);

    expect(screen.getByText('No story entries yet')).toBeInTheDocument();
  });
});

// Hook testing example
describe('useGameAction', () => {
  it('performs action when online', async () => {
    const mockPerformAction = jest.fn().mockResolvedValue({ success: true });
    jest.mocked(gameAPI.performAction).mockImplementation(mockPerformAction);

    const { result } = renderHook(() => useGameAction('session-123'));

    await act(async () => {
      await result.current.performAction('test action');
    });

    expect(mockPerformAction).toHaveBeenCalledWith('session-123', 'test action');
  });
});
```

### **Integration Testing**

```typescript
// Integration test for game session flow
describe('Game Session Integration', () => {
  it('creates session and performs action', async () => {
    // Mock API responses
    server.use(
      rest.post('/api/game/sessions', (req, res, ctx) => {
        return res(ctx.json({ session_id: 'test-session' }));
      }),
      rest.post('/api/game/sessions/test-session/action', (req, res, ctx) => {
        return res(ctx.json({
          success: true,
          action_result: {
            player_action: { text: 'test action' },
            ai_response: { text: 'AI response' }
          }
        }));
      })
    );

    render(<GameSessionCreator />);

    // Fill out session creation form
    fireEvent.change(screen.getByLabelText('Character Name'), {
      target: { value: 'Test Character' }
    });

    fireEvent.click(screen.getByText('Create Session'));

    // Wait for session to be created
    await waitFor(() => {
      expect(screen.getByText('Session created successfully')).toBeInTheDocument();
    });

    // Perform an action
    fireEvent.change(screen.getByLabelText('Action Input'), {
      target: { value: 'test action' }
    });

    fireEvent.click(screen.getByText('Perform Action'));

    // Verify action result
    await waitFor(() => {
      expect(screen.getByText('AI response')).toBeInTheDocument();
    });
  });
});
```

### **E2E Testing with Playwright**

```typescript
// E2E test for complete game flow
test('complete game session flow', async ({ page }) => {
  // Navigate to application
  await page.goto('/');

  // Create new session
  await page.click('text=New Game');
  await page.fill('[data-testid=character-name]', 'Test Hero');
  await page.selectOption('[data-testid=scenario-select]', 'fantasy-adventure');
  await page.click('text=Start Game');

  // Wait for session to load
  await page.waitForSelector('[data-testid=story-display]');

  // Perform game action
  await page.fill('[data-testid=action-input]', 'I examine my surroundings');
  await page.click('[data-testid=submit-action]');

  // Wait for AI response
  await page.waitForSelector('[data-testid=ai-response]');

  // Verify story was updated
  const storyText = await page.textContent('[data-testid=story-display]');
  expect(storyText).toContain('I examine my surroundings');

  // Check character stats
  await page.click('[data-testid=character-tab]');
  await page.waitForSelector('[data-testid=character-stats]');

  const healthStat = await page.textContent('[data-testid=health-stat]');
  expect(healthStat).toContain('100');
});
```

## 🚀 Deployment & DevOps

### **Build Configuration**

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'api.emergentRPG.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer in development
    if (dev && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: false,
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
```

### **Environment Configuration**

```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_WS_URL=ws://localhost:8001
NEXT_PUBLIC_ENVIRONMENT=development

# .env.production
NEXT_PUBLIC_API_URL=https://api.emergentRPG.com
NEXT_PUBLIC_WS_URL=wss://api.emergentRPG.com
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### **CI/CD Pipeline**

```yaml
# .github/workflows/frontend.yml
name: Frontend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['frontend/**']
  pull_request:
    branches: [main]
    paths: ['frontend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: frontend

      - name: Run linting
        run: npm run lint
        working-directory: frontend

      - name: Run type checking
        run: npm run type-check
        working-directory: frontend

      - name: Run unit tests
        run: npm run test:ci
        working-directory: frontend

      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: frontend

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: frontend

      - name: Build application
        run: npm run build
        working-directory: frontend
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.PRODUCTION_API_URL }}
          NEXT_PUBLIC_WS_URL: ${{ secrets.PRODUCTION_WS_URL }}

      - name: Deploy to production
        run: npm run deploy
        working-directory: frontend
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

This comprehensive frontend development plan provides a complete roadmap for building a modern, scalable, and user-friendly interface for emergentRPG that seamlessly integrates with the existing backend architecture while showcasing the platform's innovative AI-driven storytelling capabilities.
