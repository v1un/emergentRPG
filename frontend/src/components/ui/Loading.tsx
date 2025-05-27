// Loading Components

import React from 'react';
import { cn } from '@/utils/helpers';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn('flex space-x-1', className)}>
      <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="h-2 w-2 bg-current rounded-full animate-bounce" />
    </div>
  );
}

export interface LoadingBarProps {
  progress?: number;
  className?: string;
  showPercentage?: boolean;
}

export function LoadingBar({ progress, className, showPercentage = false }: LoadingBarProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Loading...
        </span>
        {showPercentage && progress !== undefined && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{
            width: progress !== undefined ? `${Math.min(100, Math.max(0, progress))}%` : '0%',
          }}
        />
      </div>
    </div>
  );
}

export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  className?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({ 
  isVisible, 
  message = 'Loading...', 
  progress,
  className,
  children 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
      className
    )}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {message}
            </p>
            {progress !== undefined && (
              <div className="mt-3 w-full">
                <LoadingBar progress={progress} showPercentage />
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
}

export function LoadingSkeleton({ className, lines = 3, avatar = false }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="flex space-x-4">
        {avatar && (
          <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-10 w-10" />
        )}
        <div className="flex-1 space-y-2 py-1">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-4 bg-gray-300 dark:bg-gray-600 rounded',
                index === lines - 1 ? 'w-3/4' : 'w-full'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export interface LoadingCardProps {
  className?: string;
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn('border rounded-lg p-6 animate-pulse', className)}>
      <div className="space-y-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
        </div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20" />
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export interface TypingIndicatorProps {
  className?: string;
  message?: string;
}

export function TypingIndicator({ className, message = 'AI is thinking' }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center space-x-2 text-gray-500 dark:text-gray-400', className)}>
      <LoadingDots />
      <span className="text-sm">{message}</span>
    </div>
  );
}

export interface LoadingStateProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LoadingState({ 
  isLoading, 
  message, 
  progress, 
  children, 
  fallback 
}: LoadingStateProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        )}
        {progress !== undefined && (
          <LoadingBar progress={progress} className="w-64" showPercentage />
        )}
        {fallback}
      </div>
    );
  }

  return <>{children}</>;
}

export default LoadingSpinner;
