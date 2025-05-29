// AI Insights Game Panel - Dedicated panel for AI decision insights in the game interface

'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/helpers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AIInsightsPanel } from '@/components/ui/AIInsightsPanel';
import { AIInsightsWidget } from '@/components/ui/AIInsightsWidget';
import { useAIInsights } from '@/services/aiInsightsService';
import { useCurrentSession } from '@/stores/gameStore';
import { 
  CpuChipIcon,
  ChartBarIcon,
  LightBulbIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

interface AIInsightsGamePanelProps {
  className?: string;
  variant?: 'sidebar' | 'modal' | 'inline';
  maxHeight?: string;
}

export function AIInsightsGamePanel({ 
  className,
  variant = 'sidebar',
  maxHeight = "400px"
}: Readonly<AIInsightsGamePanelProps>) {
  const currentSession = useCurrentSession();
  const { insights, generateMockInsight, stats, clearInsights } = useAIInsights();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Filter insights for current session if available
  const sessionInsights = currentSession 
    ? insights.filter(insight => 
        insight.context_used.character_state?.session_id === currentSession.session_id ||
        insight.timestamp >= currentSession.created_at
      )
    : insights;

  const recentInsights = sessionInsights.slice(0, 5);

  if (variant === 'inline') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground flex items-center space-x-2">
            <CpuChipIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Recent AI Decisions</span>
          </h4>
          {recentInsights.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Show Less' : 'Show All'}
            </Button>
          )}
        </div>

        {recentInsights.length === 0 ? (
          <div className="text-center py-4">
            <CpuChipIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No AI insights yet. AI decisions will appear here.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateMockInsight('narrative')}
              className="mt-2"
            >
              Generate Demo Insight
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {(isExpanded ? sessionInsights : recentInsights).map((insight) => (
              <AIInsightsWidget
                key={insight.id}
                insight={insight}
                variant="compact"
                showToggle={true}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className={cn('bg-white dark:bg-gray-900 rounded-lg shadow-xl', className)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
              <CpuChipIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span>AI Decision Insights</span>
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                <ChartBarIcon className="h-4 w-4" />
                <span className="ml-1">Stats</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateMockInsight('narrative')}
              >
                <LightBulbIcon className="h-4 w-4" />
                <span className="ml-1">Demo</span>
              </Button>
            </div>
          </div>

          {showStats && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Session Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Total Decisions:</span>
                    <span className="ml-2 text-foreground">{stats.total}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Avg Confidence:</span>
                    <span className="ml-2 text-foreground">
                      {Math.round(stats.averageConfidence * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Avg Processing:</span>
                    <span className="ml-2 text-foreground">
                      {Math.round(stats.averageProcessingTime)}ms
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Session Insights:</span>
                    <span className="ml-2 text-foreground">{sessionInsights.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <AIInsightsPanel 
            insights={sessionInsights}
            maxHeight="500px"
          />
        </div>
      </div>
    );
  }

  // Default sidebar variant
  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center space-x-2">
            <CpuChipIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>AI Insights</span>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="h-6 w-6 p-0"
              aria-label={showStats ? 'Hide stats' : 'Show stats'}
            >
              {showStats ? (
                <EyeSlashIcon className="h-3 w-3" />
              ) : (
                <EyeIcon className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ArrowsPointingInIcon className="h-3 w-3" />
              ) : (
                <ArrowsPointingOutIcon className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {showStats && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded">
              <div className="font-medium text-blue-900 dark:text-blue-100">
                {sessionInsights.length}
              </div>
              <div className="text-blue-700 dark:text-blue-300">Decisions</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
              <div className="font-medium text-green-900 dark:text-green-100">
                {Math.round(stats.averageConfidence * 100)}%
              </div>
              <div className="text-green-700 dark:text-green-300">Avg Confidence</div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {sessionInsights.length === 0 ? (
          <div className="p-4 text-center">
            <CpuChipIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No AI insights yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateMockInsight('narrative')}
              className="text-xs"
            >
              Generate Demo
            </Button>
          </div>
        ) : isExpanded ? (
          <AIInsightsPanel 
            insights={sessionInsights}
            maxHeight={maxHeight}
            className="border-0 rounded-none"
          />
        ) : (
          <div 
            className="p-3 space-y-2 overflow-y-auto"
            style={{ maxHeight }}
          >
            {recentInsights.map((insight) => (
              <AIInsightsWidget
                key={insight.id}
                insight={insight}
                variant="minimal"
                showToggle={false}
              />
            ))}
            {sessionInsights.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="w-full text-xs"
              >
                View All {sessionInsights.length} Insights
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIInsightsGamePanel;
