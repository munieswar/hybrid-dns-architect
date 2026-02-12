"""
DNS Policy Engine for routing queries to appropriate providers.
"""

from typing import List, Optional, Dict, Any
import re
import logging

logger = logging.getLogger(__name__)


class DNSPolicy:
    """Represents a DNS routing policy."""

    def __init__(
        self,
        name: str,
        patterns: List[str],
        providers: List[str],
        priority: int = 100,
    ):
        """
        Initialize a DNS policy.

        Args:
            name: Policy name
            patterns: List of domain patterns (supports wildcards)
            providers: List of provider names to use for matching domains
            priority: Policy priority (lower number = higher priority)
        """
        self.name = name
        self.patterns = patterns
        self.providers = providers
        self.priority = priority
        self._compiled_patterns = [self._compile_pattern(p) for p in patterns]

    def _compile_pattern(self, pattern: str) -> re.Pattern:
        """
        Compile a domain pattern into a regex.

        Supports wildcards:
        - *.example.com matches any subdomain of example.com
        - example.* matches example with any TLD
        """
        # Escape special regex characters except *
        escaped = re.escape(pattern)
        # Replace escaped \* with regex .*
        regex_pattern = escaped.replace(r"\*", ".*")
        # Anchor the pattern
        regex_pattern = f"^{regex_pattern}$"
        return re.compile(regex_pattern, re.IGNORECASE)

    def matches(self, domain: str) -> bool:
        """
        Check if domain matches this policy.

        Args:
            domain: Domain name to check

        Returns:
            True if domain matches any pattern
        """
        return any(pattern.match(domain) for pattern in self._compiled_patterns)

    def __repr__(self):
        return (
            f"DNSPolicy(name={self.name}, patterns={self.patterns}, "
            f"providers={self.providers}, priority={self.priority})"
        )


class PolicyEngine:
    """Manages and applies DNS routing policies."""

    def __init__(self, policies: Optional[List[DNSPolicy]] = None):
        """
        Initialize the policy engine.

        Args:
            policies: List of DNS policies
        """
        self.policies = policies or []
        self._sort_policies()

    def _sort_policies(self):
        """Sort policies by priority (lower number = higher priority)."""
        self.policies.sort(key=lambda p: p.priority)

    def add_policy(self, policy: DNSPolicy):
        """
        Add a policy to the engine.

        Args:
            policy: DNS policy to add
        """
        self.policies.append(policy)
        self._sort_policies()
        logger.debug(f"Added policy: {policy}")

    def remove_policy(self, name: str):
        """
        Remove a policy by name.

        Args:
            name: Policy name to remove
        """
        self.policies = [p for p in self.policies if p.name != name]
        logger.debug(f"Removed policy: {name}")

    def get_providers_for_domain(
        self, domain: str, default_providers: Optional[List[str]] = None
    ) -> List[str]:
        """
        Get the list of providers that should handle a domain.

        Args:
            domain: Domain name to resolve
            default_providers: Default providers if no policy matches

        Returns:
            List of provider names
        """
        # Check policies in priority order
        for policy in self.policies:
            if policy.matches(domain):
                logger.debug(
                    f"Domain {domain} matched policy {policy.name}, "
                    f"using providers: {policy.providers}"
                )
                return policy.providers

        # No policy matched, use default providers
        providers = default_providers or []
        logger.debug(
            f"Domain {domain} matched no policy, using default providers: {providers}"
        )
        return providers

    def __repr__(self):
        return f"PolicyEngine(policies={len(self.policies)})"


def create_policy_from_config(config: Dict[str, Any]) -> DNSPolicy:
    """
    Create a DNS policy from configuration dictionary.

    Args:
        config: Policy configuration

    Returns:
        DNSPolicy instance
    """
    return DNSPolicy(
        name=config["name"],
        patterns=config["patterns"],
        providers=config["providers"],
        priority=config.get("priority", 100),
    )
