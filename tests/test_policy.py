"""Tests for DNS policy engine."""

import pytest
from hybrid_dns_architect.policy import DNSPolicy, PolicyEngine


class TestDNSPolicy:
    def test_exact_match(self):
        """Test exact domain matching."""
        policy = DNSPolicy("test", ["example.com"], ["provider1"])
        assert policy.matches("example.com") is True
        assert policy.matches("other.com") is False

    def test_wildcard_subdomain(self):
        """Test wildcard subdomain matching."""
        policy = DNSPolicy("test", ["*.example.com"], ["provider1"])
        assert policy.matches("www.example.com") is True
        assert policy.matches("api.example.com") is True
        assert policy.matches("example.com") is False
        assert policy.matches("example.org") is False

    def test_wildcard_tld(self):
        """Test wildcard TLD matching."""
        policy = DNSPolicy("test", ["example.*"], ["provider1"])
        assert policy.matches("example.com") is True
        assert policy.matches("example.org") is True
        assert policy.matches("example.co.uk") is True
        assert policy.matches("other.com") is False

    def test_multiple_patterns(self):
        """Test policy with multiple patterns."""
        policy = DNSPolicy(
            "test",
            ["*.internal", "*.corp.local", "localhost"],
            ["provider1"],
        )
        assert policy.matches("app.internal") is True
        assert policy.matches("web.corp.local") is True
        assert policy.matches("localhost") is True
        assert policy.matches("google.com") is False

    def test_case_insensitive(self):
        """Test case-insensitive matching."""
        policy = DNSPolicy("test", ["Example.COM"], ["provider1"])
        assert policy.matches("example.com") is True
        assert policy.matches("EXAMPLE.COM") is True
        assert policy.matches("Example.Com") is True


class TestPolicyEngine:
    def test_empty_engine(self):
        """Test engine with no policies."""
        engine = PolicyEngine()
        providers = engine.get_providers_for_domain("example.com", ["default"])
        assert providers == ["default"]

    def test_single_policy_match(self):
        """Test matching a single policy."""
        policy = DNSPolicy("internal", ["*.internal"], ["private-dns"])
        engine = PolicyEngine([policy])

        providers = engine.get_providers_for_domain("app.internal")
        assert providers == ["private-dns"]

    def test_no_match_returns_default(self):
        """Test that no match returns default providers."""
        policy = DNSPolicy("internal", ["*.internal"], ["private-dns"])
        engine = PolicyEngine([policy])

        providers = engine.get_providers_for_domain(
            "google.com", ["public-dns"]
        )
        assert providers == ["public-dns"]

    def test_priority_ordering(self):
        """Test that policies are evaluated in priority order."""
        policy1 = DNSPolicy("low-priority", ["*.com"], ["provider1"], priority=100)
        policy2 = DNSPolicy("high-priority", ["*.com"], ["provider2"], priority=10)

        engine = PolicyEngine([policy1, policy2])

        # Should match high-priority policy first
        providers = engine.get_providers_for_domain("example.com")
        assert providers == ["provider2"]

    def test_add_policy(self):
        """Test adding a policy."""
        engine = PolicyEngine()
        policy = DNSPolicy("test", ["*.test"], ["test-provider"])

        engine.add_policy(policy)
        providers = engine.get_providers_for_domain("app.test")
        assert providers == ["test-provider"]

    def test_remove_policy(self):
        """Test removing a policy."""
        policy = DNSPolicy("test", ["*.test"], ["test-provider"])
        engine = PolicyEngine([policy])

        engine.remove_policy("test")
        providers = engine.get_providers_for_domain("app.test", ["default"])
        assert providers == ["default"]

    def test_multiple_providers_in_policy(self):
        """Test policy with multiple providers."""
        policy = DNSPolicy(
            "multi", ["*.example.com"], ["primary", "backup"]
        )
        engine = PolicyEngine([policy])

        providers = engine.get_providers_for_domain("www.example.com")
        assert providers == ["primary", "backup"]
