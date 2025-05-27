// Performance Monitoring Component - Real-time performance metrics

'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/helpers';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  bundleSize: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export function PerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  className 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    bundleSize: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage: getMemoryUsage(),
          renderTime: performance.now() - currentTime,
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    // Initial load time measurement
    const loadTime = performance.timing 
      ? performance.timing.loadEventEnd - performance.timing.navigationStart
      : 0;

    setMetrics(prev => ({
      ...prev,
      loadTime,
      bundleSize: getBundleSize(),
    }));

    measureFPS();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled]);

  const getMemoryUsage = (): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  };

  const getBundleSize = (): number => {
    // Estimate bundle size from loaded scripts
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && src.includes('/_next/')) {
        // Rough estimation - in production, you'd want actual bundle analysis
        totalSize += 100; // KB estimate per chunk
      }
    });
    
    return totalSize;
  };

  const getPerformanceColor = (value: number, type: 'fps' | 'memory' | 'time') => {
    switch (type) {
      case 'fps':
        if (value >= 55) return 'text-green-500';
        if (value >= 30) return 'text-yellow-500';
        return 'text-red-500';
      case 'memory':
        if (value <= 50) return 'text-green-500';
        if (value <= 100) return 'text-yellow-500';
        return 'text-red-500';
      case 'time':
        if (value <= 16) return 'text-green-500';
        if (value <= 33) return 'text-yellow-500';
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  if (!enabled) return null;

  return (
    <div
      className={cn(
        'fixed z-50 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono',
        'transition-all duration-200 backdrop-blur-sm',
        positionClasses[position],
        isVisible ? 'opacity-100' : 'opacity-30 hover:opacity-100',
        className
      )}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Performance</span>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-gray-400 hover:text-white ml-2"
            aria-label="Toggle performance monitor"
          >
            {isVisible ? '−' : '+'}
          </button>
        </div>
        
        {isVisible && (
          <>
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={getPerformanceColor(metrics.fps, 'fps')}>
                {metrics.fps}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className={getPerformanceColor(metrics.memoryUsage, 'memory')}>
                {metrics.memoryUsage}MB
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Render:</span>
              <span className={getPerformanceColor(metrics.renderTime, 'time')}>
                {metrics.renderTime.toFixed(1)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Load:</span>
              <span className="text-blue-400">
                {(metrics.loadTime / 1000).toFixed(1)}s
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Bundle:</span>
              <span className="text-purple-400">
                ~{metrics.bundleSize}KB
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Hook for performance monitoring in components
export function usePerformanceMonitor() {
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
    };
  });

  return { renderTime };
}

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Measure component render time
  measureRender: (componentName: string) => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      console.log(`${componentName} render time: ${endTime - startTime}ms`);
    };
  },

  // Preload critical resources
  preloadResource: (url: string, type: 'script' | 'style' | 'image' = 'script') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    document.head.appendChild(link);
  },
};

export default PerformanceMonitor;
