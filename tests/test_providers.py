"""Tests for DNS providers."""

import pytest
from unittest.mock import Mock, patch
from hybrid_dns_architect.providers import (
    PublicDNSProvider,
    PrivateDNSProvider,
    CloudDNSProvider,
)


class TestPublicDNSProvider:
    def test_init_with_default_servers(self):
        """Test initialization with default Google DNS servers."""
        provider = PublicDNSProvider("test-google")
        assert provider.name == "test-google"
        assert provider.servers == ["8.8.8.8", "8.8.4.4"]

    def test_init_with_cloudflare(self):
        """Test initialization with Cloudflare DNS."""
        provider = PublicDNSProvider(
            "test-cf", config={"provider": "cloudflare"}
        )
        assert provider.servers == ["1.1.1.1", "1.0.0.1"]

    def test_init_with_custom_servers(self):
        """Test initialization with custom servers."""
        custom_servers = ["9.9.9.9", "149.112.112.112"]
        provider = PublicDNSProvider(
            "test-custom", config={"servers": custom_servers}
        )
        assert provider.servers == custom_servers

    @patch("dns.resolver.Resolver.resolve")
    def test_resolve_success(self, mock_resolve):
        """Test successful DNS resolution."""
        mock_answer = Mock()
        mock_answer.__iter__ = Mock(return_value=iter(["192.0.2.1"]))
        mock_resolve.return_value = mock_answer

        provider = PublicDNSProvider("test")
        result = provider.resolve("example.com", "A")

        assert result == ["192.0.2.1"]
        mock_resolve.assert_called_once_with("example.com", "A")

    @patch("dns.resolver.Resolver.resolve")
    def test_resolve_failure(self, mock_resolve):
        """Test DNS resolution failure."""
        import dns.exception

        mock_resolve.side_effect = dns.exception.NXDOMAIN()

        provider = PublicDNSProvider("test")
        with pytest.raises(dns.exception.DNSException):
            provider.resolve("nonexistent.example.com", "A")


class TestPrivateDNSProvider:
    def test_init_requires_servers(self):
        """Test that private DNS requires servers in config."""
        with pytest.raises(ValueError):
            PrivateDNSProvider("test-private")

    def test_init_with_servers(self):
        """Test initialization with servers."""
        servers = ["10.0.0.1", "10.0.0.2"]
        provider = PrivateDNSProvider("test-private", config={"servers": servers})
        assert provider.servers == servers

    @patch("dns.resolver.Resolver.resolve")
    def test_resolve_success(self, mock_resolve):
        """Test successful resolution via private DNS."""
        mock_answer = Mock()
        mock_answer.__iter__ = Mock(return_value=iter(["10.1.2.3"]))
        mock_resolve.return_value = mock_answer

        provider = PrivateDNSProvider(
            "test-private", config={"servers": ["10.0.0.1"]}
        )
        result = provider.resolve("internal.example.com", "A")

        assert result == ["10.1.2.3"]


class TestCloudDNSProvider:
    def test_init_default(self):
        """Test initialization with defaults."""
        provider = CloudDNSProvider("test-cloud")
        assert provider.name == "test-cloud"
        assert provider.cloud_provider == "aws"

    def test_init_with_azure(self):
        """Test initialization for Azure."""
        provider = CloudDNSProvider(
            "test-azure", config={"cloud_provider": "azure"}
        )
        assert provider.cloud_provider == "azure"

    @patch("dns.resolver.Resolver.resolve")
    def test_health_check_success(self, mock_resolve):
        """Test successful health check."""
        mock_answer = Mock()
        mock_answer.__iter__ = Mock(return_value=iter(["192.0.2.1"]))
        mock_resolve.return_value = mock_answer

        provider = CloudDNSProvider("test-cloud")
        assert provider.health_check() is True
        assert provider.healthy is True

    @patch("dns.resolver.Resolver.resolve")
    def test_health_check_failure(self, mock_resolve):
        """Test failed health check."""
        import dns.exception

        mock_resolve.side_effect = dns.exception.Timeout()

        provider = CloudDNSProvider("test-cloud")
        assert provider.health_check() is False
        assert provider.healthy is False
