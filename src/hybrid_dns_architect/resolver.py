"""
Main DNS Resolver with hybrid provider support.
"""

from typing import List, Optional, Dict, Any
import logging
import time
from .providers import DNSProvider
from .policy import PolicyEngine, DNSPolicy

logger = logging.getLogger(__name__)


class ResolutionResult:
    """Result of a DNS resolution attempt."""

    def __init__(
        self,
        domain: str,
        record_type: str,
        records: Optional[List[str]] = None,
        provider: Optional[str] = None,
        success: bool = True,
        error: Optional[str] = None,
        duration: float = 0.0,
    ):
        self.domain = domain
        self.record_type = record_type
        self.records = records or []
        self.provider = provider
        self.success = success
        self.error = error
        self.duration = duration

    def __repr__(self):
        return (
            f"ResolutionResult(domain={self.domain}, "
            f"records={self.records}, provider={self.provider}, "
            f"success={self.success})"
        )


class DNSResolver:
    """Hybrid DNS resolver with support for multiple providers and policies."""

    def __init__(
        self,
        providers: Optional[Dict[str, DNSProvider]] = None,
        policy_engine: Optional[PolicyEngine] = None,
        cache_ttl: int = 300,
    ):
        """
        Initialize the DNS resolver.

        Args:
            providers: Dictionary of provider name -> DNSProvider instance
            policy_engine: Policy engine for routing decisions
            cache_ttl: Cache TTL in seconds (0 to disable)
        """
        self.providers = providers or {}
        self.policy_engine = policy_engine or PolicyEngine()
        self.cache_ttl = cache_ttl
        self._cache: Dict[str, tuple] = {}  # (timestamp, result)
        self.default_providers: List[str] = list(self.providers.keys())

    def add_provider(self, provider: DNSProvider):
        """
        Add a DNS provider.

        Args:
            provider: DNS provider to add
        """
        self.providers[provider.name] = provider
        if provider.name not in self.default_providers:
            self.default_providers.append(provider.name)
        logger.info(f"Added provider: {provider.name}")

    def remove_provider(self, name: str):
        """
        Remove a DNS provider.

        Args:
            name: Provider name to remove
        """
        if name in self.providers:
            del self.providers[name]
            self.default_providers = [p for p in self.default_providers if p != name]
            logger.info(f"Removed provider: {name}")

    def _get_cached(self, cache_key: str) -> Optional[List[str]]:
        """Get cached resolution result if still valid."""
        if cache_key in self._cache:
            timestamp, records = self._cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                logger.debug(f"Cache hit for {cache_key}")
                return records
            else:
                # Expired, remove from cache
                del self._cache[cache_key]
        return None

    def _cache_result(self, cache_key: str, records: List[str]):
        """Cache a resolution result."""
        if self.cache_ttl > 0:
            self._cache[cache_key] = (time.time(), records)
            logger.debug(f"Cached result for {cache_key}")

    def resolve(
        self,
        domain: str,
        record_type: str = "A",
        use_cache: bool = True,
    ) -> ResolutionResult:
        """
        Resolve a domain name using the appropriate provider(s).

        Args:
            domain: Domain name to resolve
            record_type: DNS record type (A, AAAA, CNAME, etc.)
            use_cache: Whether to use cached results

        Returns:
            ResolutionResult with the resolution outcome
        """
        start_time = time.time()
        cache_key = f"{domain}:{record_type}"

        # Check cache first
        if use_cache:
            cached = self._get_cached(cache_key)
            if cached is not None:
                duration = time.time() - start_time
                return ResolutionResult(
                    domain=domain,
                    record_type=record_type,
                    records=cached,
                    provider="cache",
                    success=True,
                    duration=duration,
                )

        # Get providers to try based on policy
        provider_names = self.policy_engine.get_providers_for_domain(
            domain, self.default_providers
        )

        # Try each provider in order
        for provider_name in provider_names:
            if provider_name not in self.providers:
                logger.warning(f"Provider {provider_name} not found, skipping")
                continue

            provider = self.providers[provider_name]

            # Skip unhealthy providers
            if not provider.healthy:
                logger.warning(
                    f"Provider {provider_name} is unhealthy, skipping"
                )
                continue

            try:
                records = provider.resolve(domain, record_type)
                duration = time.time() - start_time

                # Cache successful result
                self._cache_result(cache_key, records)

                return ResolutionResult(
                    domain=domain,
                    record_type=record_type,
                    records=records,
                    provider=provider_name,
                    success=True,
                    duration=duration,
                )

            except Exception as e:
                logger.warning(
                    f"Failed to resolve {domain} with {provider_name}: {e}"
                )
                continue

        # All providers failed
        duration = time.time() - start_time
        return ResolutionResult(
            domain=domain,
            record_type=record_type,
            records=[],
            provider=None,
            success=False,
            error="All providers failed",
            duration=duration,
        )

    def health_check_all(self) -> Dict[str, bool]:
        """
        Run health checks on all providers.

        Returns:
            Dictionary of provider name -> health status
        """
        results = {}
        for name, provider in self.providers.items():
            try:
                results[name] = provider.health_check()
            except Exception as e:
                logger.error(f"Health check failed for {name}: {e}")
                results[name] = False
        return results

    def get_status(self) -> Dict[str, Any]:
        """
        Get the current status of the resolver.

        Returns:
            Dictionary with status information
        """
        return {
            "providers": {
                name: {
                    "healthy": provider.healthy,
                    "last_check": provider.last_check,
                }
                for name, provider in self.providers.items()
            },
            "policies": len(self.policy_engine.policies),
            "cache_size": len(self._cache),
            "cache_ttl": self.cache_ttl,
        }
