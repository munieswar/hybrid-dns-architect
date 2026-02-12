"""Test configuration and fixtures."""

import pytest


@pytest.fixture
def sample_config():
    """Sample configuration for testing."""
    return {
        "providers": [
            {
                "name": "google-dns",
                "type": "public",
                "config": {"provider": "google"},
            }
        ],
        "policies": [
            {
                "name": "test-policy",
                "patterns": ["*.test"],
                "providers": ["google-dns"],
                "priority": 10,
            }
        ],
        "cache": {"ttl": 300},
    }
