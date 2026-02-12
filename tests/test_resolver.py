"""Tests for DNS resolver."""

import pytest
from unittest.mock import Mock, patch
from hybrid_dns_architect.resolver import DNSResolver, ResolutionResult
from hybrid_dns_architect.providers import PublicDNSProvider
from hybrid_dns_architect.policy import PolicyEngine, DNSPolicy


class TestResolutionResult:
    def test_init_success(self):
        """Test successful resolution result."""
        result = ResolutionResult(
            domain="example.com",
            record_type="A",
            records=["192.0.2.1"],
            provider="test-provider",
            success=True,
            duration=0.1,
        )
        assert result.domain == "example.com"
        assert result.success is True
        assert result.records == ["192.0.2.1"]

    def test_init_failure(self):
        """Test failed resolution result."""
        result = ResolutionResult(
            domain="example.com",
            record_type="A",
            success=False,
            error="Timeout",
        )
        assert result.success is False
        assert result.error == "Timeout"


class TestDNSResolver:
    def test_init_empty(self):
        """Test initialization with no providers."""
        resolver = DNSResolver()
        assert len(resolver.providers) == 0
        assert resolver.cache_ttl == 300

    def test_init_with_providers(self):
        """Test initialization with providers."""
        provider = Mock()
        provider.name = "test-provider"
        resolver = DNSResolver(providers={"test-provider": provider})
        assert "test-provider" in resolver.providers

    def test_add_provider(self):
        """Test adding a provider."""
        resolver = DNSResolver()
        provider = Mock()
        provider.name = "test-provider"

        resolver.add_provider(provider)
        assert "test-provider" in resolver.providers

    def test_remove_provider(self):
        """Test removing a provider."""
        provider = Mock()
        provider.name = "test-provider"
        resolver = DNSResolver(providers={"test-provider": provider})

        resolver.remove_provider("test-provider")
        assert "test-provider" not in resolver.providers

    @patch("dns.resolver.Resolver.resolve")
    def test_resolve_success(self, mock_resolve):
        """Test successful resolution."""
        mock_answer = Mock()
        mock_answer.__iter__ = Mock(return_value=iter(["192.0.2.1"]))
        mock_resolve.return_value = mock_answer

        provider = PublicDNSProvider("test")
        resolver = DNSResolver(providers={"test": provider})

        result = resolver.resolve("example.com", "A")
        assert result.success is True
        assert result.records == ["192.0.2.1"]
        assert result.provider == "test"

    def test_resolve_with_unhealthy_provider(self):
        """Test resolution skips unhealthy providers."""
        provider1 = Mock()
        provider1.name = "unhealthy"
        provider1.healthy = False

        provider2 = Mock()
        provider2.name = "healthy"
        provider2.healthy = True
        provider2.resolve.return_value = ["192.0.2.1"]

        resolver = DNSResolver(
            providers={"unhealthy": provider1, "healthy": provider2}
        )

        result = resolver.resolve("example.com", "A")
        assert result.provider == "healthy"
        provider1.resolve.assert_not_called()

    @patch("dns.resolver.Resolver.resolve")
    def test_resolve_with_cache(self, mock_resolve):
        """Test that caching works."""
        mock_answer = Mock()
        mock_answer.__iter__ = Mock(return_value=iter(["192.0.2.1"]))
        mock_resolve.return_value = mock_answer

        provider = PublicDNSProvider("test")
        resolver = DNSResolver(providers={"test": provider}, cache_ttl=300)

        # First call should hit the provider
        result1 = resolver.resolve("example.com", "A")
        assert result1.provider == "test"

        # Second call should hit the cache
        result2 = resolver.resolve("example.com", "A")
        assert result2.provider == "cache"

        # Should only call resolve once
        assert mock_resolve.call_count == 1

    def test_resolve_with_policy(self):
        """Test resolution with routing policy."""
        provider1 = Mock()
        provider1.name = "provider1"
        provider1.healthy = True
        provider1.resolve.return_value = ["192.0.2.1"]

        provider2 = Mock()
        provider2.name = "provider2"
        provider2.healthy = True
        provider2.resolve.return_value = ["192.0.2.2"]

        policy = DNSPolicy("test", ["*.internal"], ["provider2"])
        engine = PolicyEngine([policy])

        resolver = DNSResolver(
            providers={"provider1": provider1, "provider2": provider2},
            policy_engine=engine,
        )

        # Should use provider2 due to policy
        result = resolver.resolve("app.internal", "A")
        assert result.provider == "provider2"
        provider2.resolve.assert_called_once()

    def test_health_check_all(self):
        """Test health checking all providers."""
        provider1 = Mock()
        provider1.name = "provider1"
        provider1.health_check.return_value = True

        provider2 = Mock()
        provider2.name = "provider2"
        provider2.health_check.return_value = False

        resolver = DNSResolver(
            providers={"provider1": provider1, "provider2": provider2}
        )

        results = resolver.health_check_all()
        assert results["provider1"] is True
        assert results["provider2"] is False

    def test_get_status(self):
        """Test getting resolver status."""
        provider = Mock()
        provider.name = "test"
        provider.healthy = True
        provider.last_check = 123456.0

        resolver = DNSResolver(providers={"test": provider})
        status = resolver.get_status()

        assert "providers" in status
        assert "test" in status["providers"]
        assert status["providers"]["test"]["healthy"] is True
