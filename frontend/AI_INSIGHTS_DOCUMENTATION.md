# AI Insights Feature Documentation

## Overview

The AI Insights feature provides detailed explanations of AI decision-making processes in emergentRPG, enhancing transparency and helping users understand how the AI generates narratives, makes consequences, and drives the story forward.

## Features

### 1. AI Confidence Indicators
Visual representations of how confident the AI is in its decisions.

**Components:**
- `AIConfidenceIndicator` - Main confidence display component
- `AIConfidenceBadge` - Compact inline confidence badge

**Variants:**
- **Bars**: Traditional bar chart style (default)
- **Circle**: Circular progress indicator
- **Text**: Text-only confidence display

**Usage:**
```tsx
import { AIConfidenceIndicator, AIConfidenceBadge } from '@/components/ui/AIConfidenceIndicator';

// Bar indicator
<AIConfidenceIndicator confidence={0.85} variant="bars" size="md" />

// Circle indicator
<AIConfidenceIndicator confidence={0.85} variant="circle" size="lg" />

// Compact badge
<AIConfidenceBadge confidence={0.85} />
```

### 2. AI Generated Content Styling
Enhanced visual styling for AI-generated content with confidence integration.

**Components:**
- `AIGeneratedContent` - Main wrapper for AI content
- `AIInlineContent` - Inline AI content wrapper
- `AIThinkingProcess` - Shows AI thinking process
- `AIProcessStatus` - Displays AI generation status

**Content Types:**
- **narrative**: Story narration (purple theme)
- **suggestion**: AI suggestions (green theme)
- **system**: System messages (yellow theme)
- **response**: AI responses (blue theme)

**Usage:**
```tsx
import { AIGeneratedContent, AIThinkingProcess, AIProcessStatus } from '@/components/ui/AIGeneratedContent';

// AI-generated narrative
<AIGeneratedContent confidence={0.82} type="narrative" variant="prominent">
  <p>Your AI-generated story content here...</p>
</AIGeneratedContent>

// AI thinking process
<AIThinkingProcess context={[
  "Character motivation analysis",
  "Story tension evaluation",
  "World consistency check"
]} />

// AI status
<AIProcessStatus status="generating" message="Creating narrative response..." />
```

### 3. AI Insights Widgets
Compact widgets for displaying AI decision insights.

**Components:**
- `AIInsightsWidget` - Main insight widget
- `AIInsightTooltip` - Hover tooltip for insights
- `AIInsightsSummary` - Summary of multiple insights

**Variants:**
- **minimal**: Very compact display
- **compact**: Standard widget size (default)
- **detailed**: Expanded information display

**Usage:**
```tsx
import { AIInsightsWidget, AIInsightTooltip } from '@/components/ui/AIInsightsWidget';

// Compact widget
<AIInsightsWidget insight={insight} variant="compact" showToggle={true} />

// Tooltip wrapper
<AIInsightTooltip insight={insight}>
  <span>Hover for AI insight</span>
</AIInsightTooltip>
```

### 4. AI Insights Panels
Full-featured panels for comprehensive insight display.

**Components:**
- `AIInsightsPanel` - Complete insights panel
- `AIInsightsGamePanel` - Game-integrated panel

**Panel Variants:**
- **sidebar**: Sidebar integration
- **modal**: Modal/full-screen display
- **inline**: Inline content display

**Usage:**
```tsx
import { AIInsightsPanel } from '@/components/ui/AIInsightsPanel';
import { AIInsightsGamePanel } from '@/components/game/AIInsightsGamePanel';

// Full insights panel
<AIInsightsPanel insights={insights} maxHeight="600px" />

// Game-integrated panel
<AIInsightsGamePanel variant="sidebar" maxHeight="400px" />
```

### 5. AI Insights Service
Service for managing AI insights data and state.

**Features:**
- Insight storage and management
- Real-time updates via subscriptions
- Mock insight generation for testing
- Statistics and analytics
- Import/export functionality

**Usage:**
```tsx
import { useAIInsights } from '@/services/aiInsightsService';

function MyComponent() {
  const { 
    insights, 
    addInsight, 
    generateMockInsight, 
    clearInsights, 
    stats 
  } = useAIInsights();

  // Generate demo insight
  const handleDemo = () => {
    generateMockInsight('narrative');
  };

  return (
    <div>
      <p>Total insights: {stats.total}</p>
      <button onClick={handleDemo}>Generate Demo</button>
    </div>
  );
}
```

## Data Structures

### AIInsight Interface
```typescript
interface AIInsight {
  id: string;
  timestamp: string;
  decision_type: 'narrative' | 'consequence' | 'character_development' | 'world_change' | 'quest_generation';
  confidence: number; // 0-1 scale
  reasoning: string;
  factors: AIDecisionFactor[];
  alternatives_considered?: {
    option: string;
    reason_rejected: string;
    confidence: number;
  }[];
  context_used: {
    recent_story: string[];
    character_state: Record<string, any>;
    world_state: Record<string, any>;
    player_preferences?: Record<string, any>;
  };
  processing_time_ms?: number;
  model_version?: string;
}
```

### AIDecisionFactor Interface
```typescript
interface AIDecisionFactor {
  category: 'character' | 'world' | 'story' | 'player' | 'context' | 'constraint';
  factor: string;
  influence: number; // 0-1 scale
  explanation: string;
  evidence?: string[];
}
```

### StoryEntry Metadata
```typescript
interface StoryEntry {
  // ... existing fields
  metadata?: {
    ai_confidence?: number;
    ai_context?: string[];
    ai_generated?: boolean;
    ai_insight_id?: string; // Links to AIInsight
    [key: string]: any;
  };
}
```

## Integration Points

### 1. Story Panel Integration
AI insights are automatically displayed for AI-generated story entries:

```tsx
// In StoryPanel.tsx
{entry.type === ACTION_TYPES.NARRATION && entry.metadata?.ai_insight_id && (
  <div className="mt-3">
    <AIInsightsWidget insight={insight} variant="compact" showToggle={true} />
  </div>
)}
```

### 2. Sidebar Navigation
AI Insights panel is available in the main navigation:

```tsx
// Added to PANELS constant
export const PANELS = {
  // ... existing panels
  AI_INSIGHTS: 'ai_insights',
} as const;
```

### 3. WebSocket Integration
AI insights can be received via WebSocket for real-time updates:

```typescript
// In WebSocket message handling
case 'ai_insight':
  const insight = aiInsightsService.parseAIResponse(message.data);
  if (insight) {
    aiInsightsService.addInsight(insight);
  }
  break;
```

## Styling and Theming

### Color Schemes
- **Narrative**: Purple theme (`from-purple-50 to-blue-50`)
- **Suggestions**: Green theme (`from-green-50 to-emerald-50`)
- **System**: Yellow theme (`from-yellow-50 to-orange-50`)
- **Responses**: Blue theme (`from-blue-50 to-indigo-50`)

### Confidence Colors
- **High (80%+)**: Green (`text-green-500`)
- **Good (60-79%)**: Yellow (`text-yellow-500`)
- **Fair (40-59%)**: Orange (`text-orange-500`)
- **Low (<40%)**: Red (`text-red-500`)

### Responsive Design
All components are fully responsive with:
- Mobile-first approach
- Proper touch interactions
- Accessible keyboard navigation
- Screen reader support

## Accessibility

### ARIA Support
- Proper `role` attributes for meters and progress indicators
- `aria-label` and `aria-describedby` for complex components
- Screen reader announcements for state changes

### Keyboard Navigation
- Tab navigation through all interactive elements
- Enter/Space activation for buttons
- Escape key for closing expanded views

### Visual Accessibility
- High contrast color schemes
- Scalable text and icons
- Reduced motion support
- Focus indicators

## Testing

### Unit Tests
```bash
# Test confidence indicators
npm test AIConfidenceIndicator

# Test insight widgets
npm test AIInsightsWidget

# Test service functionality
npm test aiInsightsService
```

### Integration Tests
```bash
# Test story panel integration
npm test StoryPanel

# Test sidebar navigation
npm test Sidebar

# Test WebSocket integration
npm test WebSocketManager
```

### Demo and Development
Use the demo component for testing and development:

```tsx
import { AIInsightsDemo } from '@/components/demo/AIInsightsDemo';

// Full demo interface
<AIInsightsDemo />
```

## Performance Considerations

### Optimization Features
- Lazy loading for large insight lists
- Virtualization for performance with many insights
- Debounced search and filtering
- Efficient re-rendering with React.memo

### Memory Management
- Automatic cleanup of old insights (configurable limit)
- Efficient subscription management
- Proper cleanup in useEffect hooks

## Future Enhancements

### Planned Features
1. **AI Coaching**: Help users write better actions based on insights
2. **Story Analytics**: Detailed story progression analysis
3. **Character Relationship Tracking**: AI-driven NPC interaction insights
4. **World Building Insights**: Collaborative AI world creation analysis
5. **Export/Import**: Save and share insight data
6. **Advanced Filtering**: Complex insight search and filtering
7. **Insight Trends**: Historical analysis of AI decision patterns

### Backend Integration
- Real-time insight generation from AI models
- Insight persistence and retrieval
- User preference learning
- Performance metrics and analytics

## Conclusion

The AI Insights feature significantly enhances the emergentRPG experience by providing transparency into AI decision-making processes. It helps users understand and trust the AI while maintaining the focus on AI-driven storytelling over traditional game mechanics.

The modular design allows for easy integration across the application, while the comprehensive service layer ensures consistent data management and real-time updates.
