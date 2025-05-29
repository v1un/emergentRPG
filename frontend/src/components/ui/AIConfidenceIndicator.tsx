// AI Confidence Indicator Component - Shows AI confidence levels

'use client';

import React from 'react';
import { cn } from '@/utils/helpers';

interface AIConfidenceIndicatorProps {
  confidence: number; // 0-1 scale
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showPercentage?: boolean;
  className?: string;
  variant?: 'bars' | 'circle' | 'text';
}

export function AIConfidenceIndicator({
  confidence,
  size = 'md',
  showLabel = true,
  showPercentage = true,
  className,
  variant = 'bars'
}: Readonly<AIConfidenceIndicatorProps>) {
  const bars = 5;
  const filledBars = Math.round(confidence * bars);
  const percentage = Math.round(confidence * 100);
  
  const sizeClasses = {
    sm: { bar: 'w-1 h-2', text: 'text-xs', circle: 'w-4 h-4' },
    md: { bar: 'w-1 h-3', text: 'text-sm', circle: 'w-5 h-5' },
    lg: { bar: 'w-1.5 h-4', text: 'text-base', circle: 'w-6 h-6' }
  };
  
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600 dark:text-green-400';
    if (conf >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    if (conf >= 0.4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBarColor = (conf: number) => {
    if (conf >= 0.8) return 'bg-green-500';
    if (conf >= 0.6) return 'bg-yellow-500';
    if (conf >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return 'High';
    if (conf >= 0.6) return 'Good';
    if (conf >= 0.4) return 'Fair';
    return 'Low';
  };

  if (variant === 'text') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {showLabel && (
          <span className={cn('font-medium', sizeClasses[size].text, getConfidenceColor(confidence))}>
            AI Confidence: {getConfidenceLabel(confidence)}
          </span>
        )}
        {showPercentage && (
          <span className={cn(sizeClasses[size].text, 'text-muted-foreground')}>
            ({percentage}%)
          </span>
        )}
      </div>
    );
  }

  if (variant === 'circle') {
    const circumference = 2 * Math.PI * 8; // radius = 8
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (confidence * circumference);

    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {showLabel && (
          <span className={cn(sizeClasses[size].text, 'text-muted-foreground')}>
            AI Confidence:
          </span>
        )}
        <div className="relative">
          <svg 
            className={cn(sizeClasses[size].circle, 'transform -rotate-90')}
            viewBox="0 0 20 20"
            role="meter" 
            aria-valuenow={confidence} 
            aria-valuemin={0} 
            aria-valuemax={1}
            aria-label={`AI confidence: ${percentage}%`}
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-gray-300 dark:text-gray-600"
            />
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={cn(
                'transition-all duration-300',
                confidence >= 0.8 ? 'text-green-500' 
                : confidence >= 0.6 ? 'text-yellow-500'
                : confidence >= 0.4 ? 'text-orange-500'
                : 'text-red-500'
              )}
            />
          </svg>
        </div>
        {showPercentage && (
          <span className={cn(sizeClasses[size].text, 'text-muted-foreground')}>
            {percentage}%
          </span>
        )}
      </div>
    );
  }

  // Default bars variant
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {showLabel && (
        <span className={cn(sizeClasses[size].text, 'text-muted-foreground')}>
          AI Confidence:
        </span>
      )}
      <div 
        className="flex space-x-0.5" 
        role="meter" 
        aria-valuenow={confidence} 
        aria-valuemin={0} 
        aria-valuemax={1}
        aria-label={`AI confidence: ${percentage}%`}
      >
        {Array.from({ length: bars }, (_, index) => (
          <div
            key={index}
            className={cn(
              sizeClasses[size].bar,
              'rounded-full transition-colors duration-200',
              index < filledBars 
                ? getConfidenceBarColor(confidence)
                : 'bg-gray-300 dark:bg-gray-600'
            )}
          />
        ))}
      </div>
      {showPercentage && (
        <span className={cn(sizeClasses[size].text, 'text-muted-foreground')}>
          {percentage}%
        </span>
      )}
    </div>
  );
}

// Compact version for inline use
export function AIConfidenceBadge({
  confidence,
  className
}: Readonly<{
  confidence: number;
  className?: string;
}>) {
  const percentage = Math.round(confidence * 100);
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (conf >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (conf >= 0.4) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        getConfidenceColor(confidence),
        className
      )}
      title={`AI Confidence: ${percentage}%`}
    >
      AI {percentage}%
    </span>
  );
}

export default AIConfidenceIndicator;
