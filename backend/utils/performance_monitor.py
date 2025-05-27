"""
Performance monitoring utilities for emergentRPG backend.

Provides decorators and utilities for monitoring API performance,
database query times, AI response generation, and system metrics.
"""

import asyncio
import functools
import logging
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, Union
from collections import deque

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetric:
    """Individual performance metric record."""
    operation: str
    duration: float
    timestamp: datetime
    success: bool
    metadata: Dict[str, Any] = field(default_factory=dict)
    error_type: Optional[str] = None


@dataclass
class PerformanceStats:
    """Aggregated performance statistics."""
    operation: str
    total_calls: int
    successful_calls: int
    failed_calls: int
    avg_duration: float
    min_duration: float
    max_duration: float
    p95_duration: float
    p99_duration: float
    error_rate: float
    last_updated: datetime


class PerformanceMonitor:
    """
    Performance monitoring system for backend operations.
    
    Tracks timing, success rates, and performance metrics for
    database operations, AI calls, and API endpoints.
    """
    
    def __init__(self, max_metrics: int = 10000, stats_window_hours: int = 24):
        self.max_metrics = max_metrics
        self.stats_window = timedelta(hours=stats_window_hours)
        self.metrics: deque = deque(maxlen=max_metrics)
        self.operation_stats: Dict[str, PerformanceStats] = {}
        self._lock = asyncio.Lock()
    
    async def record_metric(
        self, 
        operation: str, 
        duration: float, 
        success: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
        error_type: Optional[str] = None
    ) -> None:
        """
        Record a performance metric.
        
        Args:
            operation: Name of the operation
            duration: Duration in seconds
            success: Whether operation succeeded
            metadata: Additional metadata
            error_type: Type of error if failed
        """
        async with self._lock:
            metric = PerformanceMetric(
                operation=operation,
                duration=duration,
                timestamp=datetime.now(),
                success=success,
                metadata=metadata or {},
                error_type=error_type
            )
            
            self.metrics.append(metric)
            await self._update_stats(operation)
    
    async def _update_stats(self, operation: str) -> None:
        """Update aggregated statistics for an operation."""
        # Get recent metrics for this operation
        cutoff_time = datetime.now() - self.stats_window
        recent_metrics = [
            m for m in self.metrics 
            if m.operation == operation and m.timestamp >= cutoff_time
        ]
        
        if not recent_metrics:
            return
        
        # Calculate statistics
        durations = [m.duration for m in recent_metrics]
        successful = [m for m in recent_metrics if m.success]
        failed = [m for m in recent_metrics if not m.success]
        
        durations.sort()
        total_calls = len(recent_metrics)
        
        # Calculate percentiles
        p95_idx = int(0.95 * len(durations))
        p99_idx = int(0.99 * len(durations))
        
        self.operation_stats[operation] = PerformanceStats(
            operation=operation,
            total_calls=total_calls,
            successful_calls=len(successful),
            failed_calls=len(failed),
            avg_duration=sum(durations) / len(durations),
            min_duration=min(durations),
            max_duration=max(durations),
            p95_duration=durations[p95_idx] if p95_idx < len(durations) else durations[-1],
            p99_duration=durations[p99_idx] if p99_idx < len(durations) else durations[-1],
            error_rate=len(failed) / total_calls if total_calls > 0 else 0.0,
            last_updated=datetime.now()
        )
    
    async def get_stats(self, operation: Optional[str] = None) -> Union[PerformanceStats, Dict[str, PerformanceStats], None]:
        """
        Get performance statistics.
        
        Args:
            operation: Specific operation name, or None for all operations
            
        Returns:
            Performance statistics for operation(s)
        """
        async with self._lock:
            if operation:
                return self.operation_stats.get(operation)
            return self.operation_stats.copy()
    
    async def get_slow_operations(self, threshold_seconds: float = 1.0) -> List[PerformanceStats]:
        """
        Get operations that are performing slowly.
        
        Args:
            threshold_seconds: Duration threshold for "slow" operations
            
        Returns:
            List of slow operations
        """
        async with self._lock:
            return [
                stats for stats in self.operation_stats.values()
                if stats.avg_duration > threshold_seconds
            ]
    
    async def get_error_prone_operations(self, error_rate_threshold: float = 0.1) -> List[PerformanceStats]:
        """
        Get operations with high error rates.
        
        Args:
            error_rate_threshold: Error rate threshold (0.1 = 10%)
            
        Returns:
            List of error-prone operations
        """
        async with self._lock:
            return [
                stats for stats in self.operation_stats.values()
                if stats.error_rate > error_rate_threshold and stats.total_calls >= 10
            ]
    
    async def cleanup_old_metrics(self) -> int:
        """
        Clean up old metrics outside the stats window.
        
        Returns:
            Number of metrics removed
        """
        async with self._lock:
            cutoff_time = datetime.now() - self.stats_window
            initial_count = len(self.metrics)
            
            # Filter out old metrics
            self.metrics = deque(
                (m for m in self.metrics if m.timestamp >= cutoff_time),
                maxlen=self.max_metrics
            )
            
            removed_count = initial_count - len(self.metrics)
            logger.debug(f"Cleaned up {removed_count} old performance metrics")
            return removed_count
    
    def get_health_summary(self) -> Dict[str, Any]:
        """
        Get a health summary of system performance.
        
        Returns:
            Dictionary with health metrics
        """
        total_operations = len(self.operation_stats)
        slow_ops = sum(1 for stats in self.operation_stats.values() if stats.avg_duration > 1.0)
        error_prone_ops = sum(1 for stats in self.operation_stats.values() if stats.error_rate > 0.1)
        
        overall_error_rate = 0.0
        if self.operation_stats:
            total_calls = sum(stats.total_calls for stats in self.operation_stats.values())
            total_errors = sum(stats.failed_calls for stats in self.operation_stats.values())
            overall_error_rate = total_errors / total_calls if total_calls > 0 else 0.0
        
        return {
            "total_operations": total_operations,
            "slow_operations": slow_ops,
            "error_prone_operations": error_prone_ops,
            "overall_error_rate": overall_error_rate,
            "metrics_count": len(self.metrics),
            "health_status": "healthy" if slow_ops == 0 and error_prone_ops == 0 else "degraded"
        }


# Global performance monitor instance
performance_monitor = PerformanceMonitor()


def monitor_performance(operation_name: Optional[str] = None):
    """
    Decorator to monitor function performance.
    
    Args:
        operation_name: Custom operation name, defaults to function name
    """
    def decorator(func: Callable) -> Callable:
        op_name = operation_name or f"{func.__module__}.{func.__name__}"
        
        if asyncio.iscoroutinefunction(func):
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()
                success = True
                error_type = None
                
                try:
                    result = await func(*args, **kwargs)
                    return result
                except Exception as e:
                    success = False
                    error_type = type(e).__name__
                    raise
                finally:
                    duration = time.time() - start_time
                    await performance_monitor.record_metric(
                        operation=op_name,
                        duration=duration,
                        success=success,
                        error_type=error_type
                    )
            
            return async_wrapper
        else:
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                success = True
                error_type = None
                
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    success = False
                    error_type = type(e).__name__
                    raise
                finally:
                    duration = time.time() - start_time
                    # Schedule the async recording
                    asyncio.create_task(performance_monitor.record_metric(
                        operation=op_name,
                        duration=duration,
                        success=success,
                        error_type=error_type
                    ))
            
            return sync_wrapper
    
    return decorator


@asynccontextmanager
async def monitor_operation(operation_name: str, metadata: Optional[Dict[str, Any]] = None):
    """
    Context manager for monitoring operation performance.
    
    Args:
        operation_name: Name of the operation
        metadata: Additional metadata to record
    
    Usage:
        async with monitor_operation("database_query", {"table": "users"}):
            result = await db.query("SELECT * FROM users")
    """
    start_time = time.time()
    success = True
    error_type = None
    
    try:
        yield
    except Exception as e:
        success = False
        error_type = type(e).__name__
        raise
    finally:
        duration = time.time() - start_time
        await performance_monitor.record_metric(
            operation=operation_name,
            duration=duration,
            success=success,
            metadata=metadata,
            error_type=error_type
        )
