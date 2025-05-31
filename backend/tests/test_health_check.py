import pytest
import asyncio
from config.settings import settings
from utils.performance_monitor import performance_monitor

@pytest.mark.asyncio
async def test_health_endpoint_basic():
    config_summary = settings.get_config_summary()
    assert isinstance(config_summary, dict)
    assert "General" in config_summary or len(config_summary) > 0

    await performance_monitor.record_metric("pytest_operation", 0.1, True)
    health_summary = performance_monitor.get_health_summary()
    assert "health_status" in health_summary
    assert health_summary["total_operations"] >= 1

    all_stats = await performance_monitor.get_stats()
    assert isinstance(all_stats, dict)
    assert "pytest_operation" in all_stats

    # Health should be healthy or degraded since we don't have a real DB in test
    status = health_summary["health_status"]
    assert status in {"healthy", "degraded", "unhealthy"}

    # Check slow/error-prone operations functions
    slow_ops = await performance_monitor.get_slow_operations(threshold_seconds=0.05)
    assert isinstance(slow_ops, list)

    error_ops = await performance_monitor.get_error_prone_operations(error_rate_threshold=0.0)
    assert isinstance(error_ops, list)