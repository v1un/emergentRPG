// AI Insights Demo Component - Demonstrates all AI insights features

'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/helpers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AIInsightsPanel } from '@/components/ui/AIInsightsPanel';
import { AIInsightsWidget } from '@/components/ui/AIInsightsWidget';
import { AIInsightsGamePanel } from '@/components/game/AIInsightsGamePanel';
import { AIGeneratedContent, AIThinkingProcess, AIProcessStatus } from '@/components/ui/AIGeneratedContent';
import { AIConfidenceIndicator, AIConfidenceBadge } from '@/components/ui/AIConfidenceIndicator';
import { useAIInsights } from '@/services/aiInsightsService';
import { 
  CpuChipIcon,
  SparklesIcon,
  LightBulbIcon,
  EyeIcon,
  PlayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface AIInsightsDemoProps {
  className?: string;
}

export function AIInsightsDemo({ className }: Readonly<AIInsightsDemoProps>) {
  const { insights, generateMockInsight, clearInsights, stats } = useAIInsights();
  const [selectedDemo, setSelectedDemo] = useState<string>('overview');

  const demoSections = [
    { id: 'overview', label: 'Overview', icon: EyeIcon },
    { id: 'confidence', label: 'Confidence Indicators', icon: SparklesIcon },
    { id: 'widgets', label: 'Insight Widgets', icon: CpuChipIcon },
    { id: 'panels', label: 'Full Panels', icon: LightBulbIcon },
    { id: 'integration', label: 'Story Integration', icon: PlayIcon },
  ];

  const generateDemoInsights = () => {
    const types = ['narrative', 'consequence', 'character_development', 'world_change', 'quest_generation'];
    types.forEach((type, index) => {
      setTimeout(() => {
        generateMockInsight(type);
      }, index * 500);
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">AI Insights System Demo</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          The AI Insights system provides detailed explanations of AI decision-making processes, 
          helping users understand how the AI generates narratives, makes consequences, and drives the story forward.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <SparklesIcon className="h-5 w-5 text-purple-600" />
              <span>Confidence Scoring</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Visual indicators show how confident the AI is in its decisions.
            </p>
            <AIConfidenceIndicator confidence={0.85} size="md" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <CpuChipIcon className="h-5 w-5 text-blue-600" />
              <span>Decision Factors</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Detailed breakdown of what influenced AI decisions.
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Character motivation</span>
                <span className="text-green-600">85%</span>
              </div>
              <div className="flex justify-between">
                <span>Story tension</span>
                <span className="text-yellow-600">72%</span>
              </div>
              <div className="flex justify-between">
                <span>World consistency</span>
                <span className="text-blue-600">68%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <LightBulbIcon className="h-5 w-5 text-yellow-600" />
              <span>Process Transparency</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              See what the AI is thinking and considering.
            </p>
            <AIProcessStatus status="thinking" message="Analyzing character motivations..." />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center space-x-4">
        <Button onClick={generateDemoInsights} className="flex items-center space-x-2">
          <PlayIcon className="h-4 w-4" />
          <span>Generate Demo Insights</span>
        </Button>
        <Button variant="outline" onClick={clearInsights} className="flex items-center space-x-2">
          <TrashIcon className="h-4 w-4" />
          <span>Clear All ({insights.length})</span>
        </Button>
      </div>

      {stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Total Insights:</span>
                <span className="ml-2 text-foreground">{stats.total}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Avg Confidence:</span>
                <span className="ml-2 text-foreground">{Math.round(stats.averageConfidence * 100)}%</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Avg Processing:</span>
                <span className="ml-2 text-foreground">{Math.round(stats.averageProcessingTime)}ms</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Decision Types:</span>
                <span className="ml-2 text-foreground">{Object.keys(stats.byType).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderConfidenceDemo = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">Confidence Indicators</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bar Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">High Confidence (85%)</p>
              <AIConfidenceIndicator confidence={0.85} variant="bars" size="md" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Medium Confidence (60%)</p>
              <AIConfidenceIndicator confidence={0.60} variant="bars" size="md" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Low Confidence (30%)</p>
              <AIConfidenceIndicator confidence={0.30} variant="bars" size="md" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Circle Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">High Confidence</p>
              <AIConfidenceIndicator confidence={0.85} variant="circle" size="md" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Medium Confidence</p>
              <AIConfidenceIndicator confidence={0.60} variant="circle" size="md" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Low Confidence</p>
              <AIConfidenceIndicator confidence={0.30} variant="circle" size="md" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compact Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <AIConfidenceBadge confidence={0.95} />
            <AIConfidenceBadge confidence={0.78} />
            <AIConfidenceBadge confidence={0.52} />
            <AIConfidenceBadge confidence={0.23} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWidgetsDemo = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">Insight Widgets</h3>
      
      {insights.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CpuChipIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No insights available. Generate some demo insights to see the widgets.</p>
            <Button onClick={() => generateMockInsight('narrative')}>
              Generate Demo Insight
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.slice(0, 3).map((insight) => (
            <AIInsightsWidget
              key={insight.id}
              insight={insight}
              variant="detailed"
              showToggle={true}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderPanelsDemo = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">Full Panels</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sidebar Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <AIInsightsGamePanel variant="sidebar" maxHeight="300px" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inline Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <AIInsightsGamePanel variant="inline" />
          </CardContent>
        </Card>
      </div>

      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Full Insights Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <AIInsightsPanel insights={insights} maxHeight="400px" />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderIntegrationDemo = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">Story Integration</h3>
      
      <div className="space-y-4">
        <AIGeneratedContent confidence={0.82} type="narrative" variant="prominent">
          <p>
            As you step into the ancient library, the musty scent of old parchment fills your nostrils. 
            Towering shelves stretch toward a vaulted ceiling lost in shadow, their contents whispering 
            secrets of ages past. A faint blue glow emanates from deeper within the stacks.
          </p>
        </AIGeneratedContent>

        <AIThinkingProcess 
          context={[
            "Character has expressed interest in magical knowledge",
            "Previous scene established mysterious magical disturbances",
            "Library setting allows for discovery and exposition",
            "Blue glow suggests magical artifact or phenomenon"
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AIProcessStatus status="generating" message="Creating narrative response..." />
          <AIProcessStatus status="complete" message="Story generation complete" />
        </div>
      </div>
    </div>
  );

  const renderSelectedDemo = () => {
    switch (selectedDemo) {
      case 'overview': return renderOverview();
      case 'confidence': return renderConfidenceDemo();
      case 'widgets': return renderWidgetsDemo();
      case 'panels': return renderPanelsDemo();
      case 'integration': return renderIntegrationDemo();
      default: return renderOverview();
    }
  };

  return (
    <div className={cn('max-w-6xl mx-auto p-6', className)}>
      {/* Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {demoSections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.id}
                variant={selectedDemo === section.id ? 'default' : 'outline'}
                onClick={() => setSelectedDemo(section.id)}
                className="flex items-center space-x-2"
              >
                <Icon className="h-4 w-4" />
                <span>{section.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {renderSelectedDemo()}
      </div>
    </div>
  );
}

export default AIInsightsDemo;
