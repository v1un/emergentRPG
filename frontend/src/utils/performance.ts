// Performance monitoring and optimization utilities

import { useEffect, useRef, useState, useCallback } from 'react';

// Performance metrics interface
interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
  props?: any;
}

// Performance monitoring class
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  recordMetric(metric: PerformanceMetrics) {
    if (!this.isEnabled) return;
    
    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log slow renders in development
    if (metric.renderTime > 16) { // 16ms = 60fps threshold
      console.warn(`Slow render detected in ${metric.componentName}: ${metric.renderTime.toFixed(2)}ms`);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageRenderTime(componentName?: string): number {
    const filteredMetrics = componentName 
      ? this.metrics.filter(m => m.componentName === componentName)
      : this.metrics;
    
    if (filteredMetrics.length === 0) return 0;
    
    const total = filteredMetrics.reduce((sum, metric) => sum + metric.renderTime, 0);
    return total / filteredMetrics.length;
  }

  getSlowRenders(threshold = 16): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.renderTime > threshold);
  }

  clear() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook to measure component render time
export function useRenderTime(componentName: string, props?: any) {
  const startTimeRef = useRef<number>(0);
  
  // Mark start of render
  startTimeRef.current = performance.now();
  
  useEffect(() => {
    if (startTimeRef.current) {
      const renderTime = performance.now() - startTimeRef.current;
      performanceMonitor.recordMetric({
        renderTime,
        componentName,
        timestamp: Date.now(),
        props: process.env.NODE_ENV === 'development' ? props : undefined,
      });
    }
  });
}

// Hook to measure async operations
export function useAsyncPerformance() {
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const measureAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const operationDuration = endTime - startTime;
      
      setDuration(operationDuration);
      
      // Log slow operations
      if (operationDuration > 1000) { // 1 second threshold
        console.warn(`Slow async operation: ${operationName} took ${operationDuration.toFixed(2)}ms`);
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { measureAsync, isLoading, duration };
}

// Hook for memory usage monitoring
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    if ('memory' in performance) {
      const updateMemoryInfo = () => {
        setMemoryInfo({
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        });
      };

      updateMemoryInfo();
      const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, []);

  return memoryInfo;
}

// Debounce hook for performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for performance optimization
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Virtual scrolling hook for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

// Image lazy loading hook
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
          };
          img.onerror = () => {
            setIsError(true);
          };
          img.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return { imageSrc, isLoaded, isError, imgRef };
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return;

  const modules = (window as any).__webpack_require__.cache;
  const moduleStats: { [key: string]: number } = {};

  Object.keys(modules).forEach(moduleId => {
    const moduleData = modules[moduleId];
    if (moduleData && moduleData.exports) {
      const size = JSON.stringify(moduleData.exports).length;
      moduleStats[moduleId] = size;
    }
  });

  const sortedModules = Object.entries(moduleStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  console.table(sortedModules);
}

// Performance optimization utilities
export const performanceUtils = {
  // Memoization helper
  memoize: <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map();
    return ((...args: any[]) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Deep comparison for React.memo
  deepEqual: (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => performanceUtils.deepEqual(a[key], b[key]));
    }
    
    return false;
  },

  // Batch DOM updates
  batchUpdates: (updates: (() => void)[]): void => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  },
};

export default {
  performanceMonitor,
  useRenderTime,
  useAsyncPerformance,
  useMemoryMonitoring,
  useDebounce,
  useThrottle,
  useVirtualScrolling,
  useLazyImage,
  analyzeBundleSize,
  performanceUtils,
};
