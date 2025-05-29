// AI Insights Widget - Compact inline AI decision explanations

'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/helpers';
import { Button } from '@/components/ui/Button';
import { AIConfidenceIndicator } from './AIConfidenceIndicator';
import { AIInsight, AIDecisionFactor } from './AIInsightsPanel';
import { 
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CpuChipIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface AIInsightsWidgetProps {
  insight: AIInsight;
  className?: string;
  variant?: 'minimal' | 'compact' | 'detailed';
  showToggle?: boolean;
}

export function AIInsightsWidget({ 
  insight, 
  className,
  variant = 'compact',
  showToggle = true
}: Readonly<AIInsightsWidgetProps>) {
  const [isExpanded, setIsExpanded] = useState(false);

  const topFactors = insight.factors
    .sort((a, b) => b.influence - a.influence)
    .slice(0, 3);

  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return 'p-2 text-xs';
      case 'compact':
        return 'p-3 text-sm';
      case 'detailed':
        return 'p-4 text-sm';
      default:
        return 'p-3 text-sm';
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={cn(
        'inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg',
        getVariantStyles(),
        className
      )}>
        <CpuChipIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
        <span className="text-blue-900 dark:text-blue-100 font-medium">
          AI Decision
        </span>
        <AIConfidenceIndicator 
          confidence={insight.confidence}
          size="sm"
          showLabel={false}
          showPercentage={false}
          variant="bars"
        />
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950',
      'border border-blue-200 dark:border-blue-800 rounded-lg',
      'transition-all duration-200',
      getVariantStyles(),
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
            <CpuChipIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium text-blue-900 dark:text-blue-100">
            AI Decision: {insight.decision_type.replace('_', ' ')}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <AIConfidenceIndicator 
            confidence={insight.confidence}
            size="sm"
            showLabel={false}
            variant="bars"
          />
          {showToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
              aria-label={isExpanded ? 'Hide details' : 'Show details'}
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-3 w-3" />
              ) : (
                <ChevronDownIcon className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Summary */}
      {!isExpanded && variant !== 'minimal' && (
        <div className="mt-2">
          <p className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
            {insight.reasoning.length > 100 
              ? `${insight.reasoning.substring(0, 100)}...`
              : insight.reasoning
            }
          </p>
          {topFactors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {topFactors.map((factor, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center space-x-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs"
                >
                  <span>{factor.category}</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {Math.round(factor.influence * 100)}%
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 space-y-3 border-t border-blue-200 dark:border-blue-800 pt-3">
          {/* Full Reasoning */}
          <div>
            <h6 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
              AI Reasoning:
            </h6>
            <p className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
              {insight.reasoning}
            </p>
          </div>

          {/* Top Decision Factors */}
          <div>
            <h6 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Key Factors:
            </h6>
            <div className="space-y-2">
              {topFactors.map((factor, index) => (
                <div key={index} className="bg-blue-100 dark:bg-blue-900 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-blue-900 dark:text-blue-100 capitalize">
                      {factor.category}: {factor.factor}
                    </span>
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      {Math.round(factor.influence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    {factor.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Processing Info */}
          <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
            <span>
              {new Date(insight.timestamp).toLocaleTimeString()}
            </span>
            {insight.processing_time_ms && (
              <span>
                Processed in {insight.processing_time_ms}ms
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Quick AI insight tooltip for hover states
export function AIInsightTooltip({ 
  insight, 
  children,
  className 
}: Readonly<{
  insight: AIInsight;
  children: React.ReactNode;
  className?: string;
}>) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={cn('relative inline-block', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg max-w-xs">
            <div className="flex items-center space-x-2 mb-2">
              <CpuChipIcon className="h-3 w-3" />
              <span className="font-medium">AI Decision</span>
              <AIConfidenceIndicator 
                confidence={insight.confidence}
                size="sm"
                showLabel={false}
                showPercentage={true}
                variant="text"
              />
            </div>
            <p className="leading-relaxed">
              {insight.reasoning.length > 120 
                ? `${insight.reasoning.substring(0, 120)}...`
                : insight.reasoning
              }
            </p>
            {insight.factors.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <span className="text-gray-300">
                  Key factor: {insight.factors[0].factor}
                </span>
              </div>
            )}
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

// AI insights summary for story entries
export function AIInsightsSummary({ 
  insights,
  className 
}: Readonly<{
  insights: AIInsight[];
  className?: string;
}>) {
  if (insights.length === 0) return null;

  const avgConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length;
  const decisionTypes = [...new Set(insights.map(insight => insight.decision_type))];

  return (
    <div className={cn(
      'inline-flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1',
      className
    )}>
      <LightBulbIcon className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
      <span className="text-xs text-gray-700 dark:text-gray-300">
        {insights.length} AI decision{insights.length !== 1 ? 's' : ''}
      </span>
      <AIConfidenceIndicator 
        confidence={avgConfidence}
        size="sm"
        showLabel={false}
        showPercentage={false}
        variant="bars"
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {decisionTypes.join(', ').replace(/_/g, ' ')}
      </span>
    </div>
  );
}

export default AIInsightsWidget;
