#!/usr/bin/env python3
"""
Simple test script to verify the enhanced health check endpoint works correctly.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.settings import settings
from utils.performance_monitor import performance_monitor


async def test_health_endpoint():
    """Test the health check functionality without starting the full server."""
    
    print("=== Testing Enhanced Health Check System ===\n")
    
    # Test configuration summary
    print("1. Configuration Summary:")
    config_summary = settings.get_config_summary()
    for section, data in config_summary.items():
        print(f"   {section}: {data}")
    print()
    
    # Test performance monitor
    print("2. Performance Monitor Health:")
    
    # Add some test metrics
    await performance_monitor.record_metric("test_operation", 0.5, True)
    await performance_monitor.record_metric("test_operation", 1.2, True)
    await performance_monitor.record_metric("slow_operation", 2.5, True)
    await performance_monitor.record_metric("error_operation", 0.3, False, error_type="TestError")
    
    health_summary = performance_monitor.get_health_summary()
    print(f"   Health Status: {health_summary['health_status']}")
    print(f"   Total Operations: {health_summary['total_operations']}")
    print(f"   Slow Operations: {health_summary['slow_operations']}")
    print(f"   Error Prone Operations: {health_summary['error_prone_operations']}")
    print(f"   Overall Error Rate: {health_summary['overall_error_rate']:.3f}")
    print()
    
    # Test performance statistics
    print("3. Performance Statistics:")
    all_stats = await performance_monitor.get_stats()
    if isinstance(all_stats, dict):
        for op_name, stats in all_stats.items():
            print(f"   {op_name}:")
            print(f"     Total Calls: {stats.total_calls}")
            print(f"     Success Rate: {stats.successful_calls / stats.total_calls:.3f}")
            print(f"     Avg Duration: {stats.avg_duration:.3f}s")
            print(f"     Error Rate: {stats.error_rate:.3f}")
    print()
    
    # Test slow operations detection
    print("4. Slow Operations Detection:")
    slow_ops = await performance_monitor.get_slow_operations(threshold_seconds=1.0)
    if slow_ops:
        for stats in slow_ops:
            print(f"   {stats.operation}: {stats.avg_duration:.3f}s avg")
    else:
        print("   No slow operations detected")
    print()
    
    # Test error-prone operations detection
    print("5. Error-Prone Operations Detection:")
    error_ops = await performance_monitor.get_error_prone_operations(error_rate_threshold=0.1)
    if error_ops:
        for stats in error_ops:
            print(f"   {stats.operation}: {stats.error_rate:.3f} error rate")
    else:
        print("   No error-prone operations detected")
    print()
    
    # Simulate health check logic
    print("6. Simulated Health Check Response:")
    health_data = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "database": {
                "status": "degraded",  # Simulated - no actual DB connection
                "connected": False,
                "error": "Database not connected (test mode)"
            },
            "cache": {
                "status": "healthy",
                "memory_cache": {"status": "healthy", "size": 0},
                "redis_cache": {"status": "unavailable", "connected": False}
            },
            "ai": {
                "status": "healthy" if settings.ai.google_api_key else "degraded",
                "api_key_configured": bool(settings.ai.google_api_key),
                "model": settings.ai.gemini_model,
                "rate_limit": settings.ai.requests_per_minute
            }
        },
        "performance": health_summary,
        "configuration": config_summary
    }
    
    # Determine overall status
    unhealthy_services = [
        name for name, service in health_data["services"].items()
        if service.get("status") != "healthy"
    ]
    
    if unhealthy_services:
        health_data["status"] = "unhealthy" if len(unhealthy_services) > 1 else "degraded"
        health_data["unhealthy_services"] = unhealthy_services
    
    print(f"   Overall Status: {health_data['status']}")
    print(f"   Services Status:")
    for service, status in health_data["services"].items():
        print(f"     {service}: {status.get('status', 'unknown')}")
    
    if "unhealthy_services" in health_data:
        print(f"   Unhealthy Services: {health_data['unhealthy_services']}")
    
    print()
    print("=== Health Check Test Complete ===")
    
    return health_data


async def test_performance_monitoring():
    """Test performance monitoring functionality."""
    
    print("\n=== Testing Performance Monitoring ===\n")
    
    # Test the monitor_performance decorator simulation
    print("1. Testing Performance Metrics Recording:")
    
    # Record various operations
    operations = [
        ("database_query", 0.1, True),
        ("database_query", 0.15, True),
        ("database_query", 2.0, False, "TimeoutError"),
        ("ai_generation", 1.5, True),
        ("ai_generation", 0.8, True),
        ("cache_operation", 0.01, True),
        ("cache_operation", 0.02, True),
    ]
    
    for op_data in operations:
        if len(op_data) == 3:
            op_name, duration, success = op_data
            await performance_monitor.record_metric(op_name, duration, success)
        else:
            op_name, duration, success, error_type = op_data
            await performance_monitor.record_metric(op_name, duration, success, error_type=error_type)
    
    print(f"   Recorded {len(operations)} test operations")
    
    # Get updated statistics
    print("\n2. Updated Performance Statistics:")
    all_stats = await performance_monitor.get_stats()
    if isinstance(all_stats, dict):
        for op_name, stats in all_stats.items():
            print(f"   {op_name}:")
            print(f"     Calls: {stats.total_calls} (Success: {stats.successful_calls}, Failed: {stats.failed_calls})")
            print(f"     Duration: avg={stats.avg_duration:.3f}s, p95={stats.p95_duration:.3f}s")
            print(f"     Error Rate: {stats.error_rate:.3f}")
    
    # Test cleanup
    print("\n3. Testing Metric Cleanup:")
    initial_count = len(performance_monitor.metrics)
    cleaned = await performance_monitor.cleanup_old_metrics()
    final_count = len(performance_monitor.metrics)
    print(f"   Initial metrics: {initial_count}")
    print(f"   Cleaned metrics: {cleaned}")
    print(f"   Final metrics: {final_count}")
    
    print("\n=== Performance Monitoring Test Complete ===")


if __name__ == "__main__":
    async def main():
        await test_health_endpoint()
        await test_performance_monitoring()
    
    asyncio.run(main())
