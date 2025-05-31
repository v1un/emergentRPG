// AI Insights Panel - Detailed AI decision explanations and transparency

'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/helpers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AIConfidenceIndicator } from './AIConfidenceIndicator';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  LightBulbIcon,
  CpuChipIcon,
  BookOpenIcon,
  UserIcon,
  GlobeAltIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export interface AIDecisionFactor {
  category: 'character' | 'world' | 'story' | 'player' | 'context' | 'constraint';
  factor: string;
  influence: number; // 0-1 scale
  explanation: string;
  evidence?: string[];
}

export interface AIInsight {
  id: string;
  timestamp: string;
  decision_type: 'narrative' | 'consequence' | 'character_development' | 'world_change' | 'quest_generation';
  confidence: number;
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

interface AIInsightsPanelProps {
  insights: AIInsight[];
  className?: string;
  maxHeight?: string;
}

export function AIInsightsPanel({ 
  insights, 
  className,
  maxHeight = "600px" 
}: Readonly<AIInsightsPanelProps>) {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleInsight = (insightId: string) => {
    setExpandedInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) {
        newSet.delete(insightId);
      } else {
        newSet.add(insightId);
      }
      return newSet;
    });
  };

  const getDecisionTypeIcon = (type: string) => {
    switch (type) {
      case 'narrative': return <BookOpenIcon className="h-4 w-4" />;
      case 'consequence': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'character_development': return <UserIcon className="h-4 w-4" />;
      case 'world_change': return <GlobeAltIcon className="h-4 w-4" />;
      case 'quest_generation': return <LightBulbIcon className="h-4 w-4" />;
      default: return <CpuChipIcon className="h-4 w-4" />;
    }
  };

  const getDecisionTypeColor = (type: string) => {
    switch (type) {
      case 'narrative': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950';
      case 'consequence': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950';
      case 'character_development': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950';
      case 'world_change': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      case 'quest_generation': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'character': return <UserIcon className="h-3 w-3" />;
      case 'world': return <GlobeAltIcon className="h-3 w-3" />;
      case 'story': return <BookOpenIcon className="h-3 w-3" />;
      case 'player': return <UserIcon className="h-3 w-3" />;
      case 'context': return <ClockIcon className="h-3 w-3" />;
      case 'constraint': return <ExclamationTriangleIcon className="h-3 w-3" />;
      default: return <CpuChipIcon className="h-3 w-3" />;
    }
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.decision_type === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Decisions' },
    { id: 'narrative', label: 'Narrative' },
    { id: 'consequence', label: 'Consequences' },
    { id: 'character_development', label: 'Character' },
    { id: 'world_change', label: 'World' },
    { id: 'quest_generation', label: 'Quests' }
  ];

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CpuChipIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-foreground">AI Decision Insights</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredInsights.length} decision{filteredInsights.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Category Filter */}
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="text-xs"
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Insights List */}
      <div 
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {filteredInsights.length === 0 ? (
          <div className="p-8 text-center">
            <CpuChipIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No AI Insights Available</h4>
            <p className="text-muted-foreground">
              AI decision insights will appear here as the AI makes storytelling decisions.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {filteredInsights.map((insight) => (
              <Card key={insight.id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => toggleInsight(insight.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        getDecisionTypeColor(insight.decision_type)
                      )}>
                        {getDecisionTypeIcon(insight.decision_type)}
                      </div>
                      <div>
                        <CardTitle className="text-base capitalize">
                          {insight.decision_type.replace('_', ' ')}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <AIConfidenceIndicator 
                            confidence={insight.confidence}
                            size="sm"
                            showLabel={false}
                            variant="bars"
                          />
                          <span className="text-xs text-muted-foreground">
                            {new Date(insight.timestamp).toLocaleTimeString()}
                          </span>
                          {insight.processing_time_ms && (
                            <span className="text-xs text-muted-foreground">
                              • {insight.processing_time_ms}ms
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {insight.factors.length} factor{insight.factors.length !== 1 ? 's' : ''}
                      </span>
                      {expandedInsights.has(insight.id) ? (
                        <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedInsights.has(insight.id) && (
                  <CardContent className="pt-0">
                    {/* Main Reasoning */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-foreground mb-2">AI Reasoning:</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.reasoning}
                      </p>
                    </div>

                    {/* Decision Factors */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-foreground mb-3">Decision Factors:</h5>
                      <div className="space-y-3">
                        {insight.factors
                          .sort((a, b) => b.influence - a.influence)
                          .map((factor, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getCategoryIcon(factor.category)}
                                <span className="text-sm font-medium capitalize">
                                  {factor.category}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(factor.influence * 100)}% influence
                                </span>
                              </div>
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${factor.influence * 100}%` }}
                                />
                              </div>
                            </div>
                            <p className="text-sm font-medium text-foreground mb-1">
                              {factor.factor}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {factor.explanation}
                            </p>
                            {factor.evidence && factor.evidence.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Evidence:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {factor.evidence.map((evidence, evidenceIndex) => (
                                    <li key={evidenceIndex} className="flex items-start space-x-1">
                                      <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                                      <span>{evidence}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Alternatives Considered */}
                    {insight.alternatives_considered && insight.alternatives_considered.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-foreground mb-3">Alternatives Considered:</h5>
                        <div className="space-y-2">
                          {insight.alternatives_considered.map((alt, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-foreground">
                                  {alt.option}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(alt.confidence * 100)}% confidence
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Rejected: {alt.reason_rejected}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Context Summary */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <h5 className="text-sm font-medium text-foreground mb-2">Context Used:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-medium text-muted-foreground">Recent Story:</span>
                          <span className="ml-2 text-muted-foreground">
                            {insight.context_used.recent_story.length} entries
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Character State:</span>
                          <span className="ml-2 text-muted-foreground">
                            {Object.keys(insight.context_used.character_state).length} properties
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">World State:</span>
                          <span className="ml-2 text-muted-foreground">
                            {Object.keys(insight.context_used.world_state).length} properties
                          </span>
                        </div>
                        {insight.model_version && (
                          <div>
                            <span className="font-medium text-muted-foreground">Model:</span>
                            <span className="ml-2 text-muted-foreground">
                              {insight.model_version}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIInsightsPanel;
