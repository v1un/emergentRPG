// AI Generated Content Component - Enhanced styling for AI-generated content

'use client';

import React from 'react';
import { cn } from '@/utils/helpers';
import { AIConfidenceIndicator, AIConfidenceBadge } from './AIConfidenceIndicator';

interface AIGeneratedContentProps {
  children: React.ReactNode;
  confidence?: number;
  type?: 'narrative' | 'suggestion' | 'system' | 'response';
  showBadge?: boolean;
  showConfidence?: boolean;
  className?: string;
  variant?: 'default' | 'subtle' | 'prominent';
}

export function AIGeneratedContent({
  children,
  confidence,
  type = 'narrative',
  showBadge = true,
  showConfidence = true,
  className,
  variant = 'default'
}: Readonly<AIGeneratedContentProps>) {
  const typeStyles = {
    narrative: {
      gradient: 'from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950',
      border: 'border-l-purple-500',
      badge: 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300',
      icon: '🤖'
    },
    suggestion: {
      gradient: 'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
      border: 'border-l-green-500',
      badge: 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300',
      icon: '💡'
    },
    system: {
      gradient: 'from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950',
      border: 'border-l-yellow-500',
      badge: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300',
      icon: '⚙️'
    },
    response: {
      gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950',
      border: 'border-l-blue-500',
      badge: 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300',
      icon: '💬'
    }
  };

  const variantStyles = {
    default: 'p-4 rounded-lg border-l-4',
    subtle: 'p-3 rounded-md border-l-2',
    prominent: 'p-6 rounded-xl border-l-4 shadow-lg'
  };

  const currentType = typeStyles[type];
  const isHighConfidence = confidence && confidence > 0.8;

  return (
    <div className={cn(
      'relative bg-gradient-to-r transition-all duration-200',
      currentType.gradient,
      currentType.border,
      variantStyles[variant],
      isHighConfidence && variant === 'default' && 'shadow-lg',
      isHighConfidence && variant === 'prominent' && 'shadow-xl',
      className
    )}>
      {/* Header with badge and confidence */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {showBadge && (
            <span className={cn(
              'inline-flex items-center space-x-1 text-xs px-2 py-1 rounded-full font-medium',
              currentType.badge
            )}>
              <span>{currentType.icon}</span>
              <span>AI Generated</span>
            </span>
          )}
          
          {confidence && showConfidence && (
            <AIConfidenceBadge confidence={confidence} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        showBadge && 'mt-2'
      )}>
        {children}
      </div>

      {/* Detailed confidence indicator for prominent variant */}
      {confidence && showConfidence && variant === 'prominent' && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <AIConfidenceIndicator 
            confidence={confidence}
            size="sm"
            variant="bars"
            showLabel={true}
            showPercentage={true}
          />
        </div>
      )}
    </div>
  );
}

// Inline AI content wrapper for smaller elements
export function AIInlineContent({
  children,
  confidence,
  type = 'response',
  className
}: Readonly<{
  children: React.ReactNode;
  confidence?: number;
  type?: 'response' | 'suggestion';
  className?: string;
}>) {
  const typeStyles = {
    response: 'bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800',
    suggestion: 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800'
  };

  return (
    <span className={cn(
      'inline-flex items-center space-x-1 px-2 py-1 rounded border text-sm',
      typeStyles[type],
      className
    )}>
      <span className="text-xs">🤖</span>
      <span>{children}</span>
      {confidence && (
        <span className="text-xs opacity-75">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </span>
  );
}

// AI thinking process indicator
export function AIThinkingProcess({
  context,
  className
}: Readonly<{
  context: string[];
  className?: string;
}>) {
  return (
    <div className={cn(
      'bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm border border-blue-200 dark:border-blue-800',
      className
    )}>
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">🧠</span>
        <p className="font-medium text-blue-900 dark:text-blue-100">
          AI is considering:
        </p>
      </div>
      <ul className="space-y-1 text-blue-700 dark:text-blue-300">
        {context.map((item) => (
          <li key={item} className="flex items-start space-x-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            <span className="flex-1">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// AI process status indicator
export function AIProcessStatus({
  status,
  message,
  className
}: Readonly<{
  status: 'thinking' | 'generating' | 'complete' | 'error';
  message?: string;
  className?: string;
}>) {
  const statusConfig = {
    thinking: {
      icon: '🤔',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      defaultMessage: 'AI is thinking...'
    },
    generating: {
      icon: '✨',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950',
      border: 'border-purple-200 dark:border-purple-800',
      defaultMessage: 'AI is generating response...'
    },
    complete: {
      icon: '✅',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800',
      defaultMessage: 'AI response complete'
    },
    error: {
      icon: '❌',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800',
      defaultMessage: 'AI encountered an error'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      'flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm',
      config.bg,
      config.border,
      config.color,
      className
    )}>
      <span className="text-base">{config.icon}</span>
      <span className="font-medium">
        {message ?? config.defaultMessage}
      </span>
      {status === 'thinking' || status === 'generating' ? (
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      ) : null}
    </div>
  );
}

export default AIGeneratedContent;
