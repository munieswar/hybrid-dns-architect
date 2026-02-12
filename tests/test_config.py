"""Tests for configuration loader."""

import pytest
import tempfile
import yaml
import json
from pathlib import Path
from hybrid_dns_architect.config import ConfigLoader, load_resolver


class TestConfigLoader:
    def test_load_yaml_file(self):
        """Test loading YAML configuration."""
        config = {
            "providers": [
                {
                    "name": "test-provider",
                    "type": "public",
                    "config": {"provider": "google"},
                }
            ],
            "policies": [],
            "cache": {"ttl": 300},
        }

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".yaml", delete=False
        ) as f:
            yaml.dump(config, f)
            temp_path = f.name

        try:
            loaded = ConfigLoader.load_file(temp_path)
            assert loaded["providers"][0]["name"] == "test-provider"
        finally:
            Path(temp_path).unlink()

    def test_load_json_file(self):
        """Test loading JSON configuration."""
        config = {
            "providers": [
                {
                    "name": "test-provider",
                    "type": "public",
                    "config": {"provider": "google"},
                }
            ],
            "policies": [],
            "cache": {"ttl": 300},
        }

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False
        ) as f:
            json.dump(config, f)
            temp_path = f.name

        try:
            loaded = ConfigLoader.load_file(temp_path)
            assert loaded["providers"][0]["name"] == "test-provider"
        finally:
            Path(temp_path).unlink()

    def test_load_nonexistent_file(self):
        """Test loading nonexistent file raises error."""
        with pytest.raises(FileNotFoundError):
            ConfigLoader.load_file("/nonexistent/file.yaml")

    def test_create_resolver_from_config(self):
        """Test creating resolver from configuration."""
        config = {
            "providers": [
                {
                    "name": "google-dns",
                    "type": "public",
                    "config": {"provider": "google"},
                },
                {
                    "name": "cloudflare-dns",
                    "type": "public",
                    "config": {"provider": "cloudflare"},
                },
            ],
            "policies": [
                {
                    "name": "test-policy",
                    "patterns": ["*.test"],
                    "providers": ["google-dns"],
                    "priority": 10,
                }
            ],
            "cache": {"ttl": 600},
        }

        resolver = ConfigLoader.create_resolver_from_config(config)

        assert "google-dns" in resolver.providers
        assert "cloudflare-dns" in resolver.providers
        assert len(resolver.policy_engine.policies) == 1
        assert resolver.cache_ttl == 600

    def test_create_resolver_unknown_provider_type(self):
        """Test that unknown provider types are skipped."""
        config = {
            "providers": [
                {
                    "name": "unknown-provider",
                    "type": "unknown-type",
                    "config": {},
                }
            ],
            "policies": [],
            "cache": {"ttl": 300},
        }

        resolver = ConfigLoader.create_resolver_from_config(config)
        assert "unknown-provider" not in resolver.providers
