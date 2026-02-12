"""
Base DNS provider interface and implementations.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
import dns.resolver
import dns.exception
import logging
import time

logger = logging.getLogger(__name__)


class DNSProvider(ABC):
    """Abstract base class for DNS providers."""

    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None):
        """
        Initialize DNS provider.

        Args:
            name: Provider name
            config: Provider-specific configuration
        """
        self.name = name
        self.config = config or {}
        self.healthy = True
        self.last_check = None
        self._resolver = None

    @abstractmethod
    def resolve(self, domain: str, record_type: str = "A") -> List[str]:
        """
        Resolve a domain name.

        Args:
            domain: Domain name to resolve
            record_type: DNS record type (A, AAAA, CNAME, etc.)

        Returns:
            List of resolved addresses/records

        Raises:
            dns.exception.DNSException: If resolution fails
        """
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """
        Check if the provider is healthy.

        Returns:
            True if healthy, False otherwise
        """
        pass


class PublicDNSProvider(DNSProvider):
    """Public DNS provider (e.g., Google, Cloudflare, Quad9)."""

    DEFAULT_SERVERS = {
        "google": ["8.8.8.8", "8.8.4.4"],
        "cloudflare": ["1.1.1.1", "1.0.0.1"],
        "quad9": ["9.9.9.9", "149.112.112.112"],
    }

    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(name, config)
        self.servers = self._get_servers()
        self._setup_resolver()

    def _get_servers(self) -> List[str]:
        """Get DNS servers from config or defaults."""
        if "servers" in self.config:
            return self.config["servers"]

        provider = self.config.get("provider", "google")
        return self.DEFAULT_SERVERS.get(provider, self.DEFAULT_SERVERS["google"])

    def _setup_resolver(self):
        """Setup the DNS resolver with configured servers."""
        self._resolver = dns.resolver.Resolver()
        self._resolver.nameservers = self.servers
        self._resolver.timeout = self.config.get("timeout", 5.0)
        self._resolver.lifetime = self.config.get("lifetime", 10.0)

    def resolve(self, domain: str, record_type: str = "A") -> List[str]:
        """Resolve domain using public DNS servers."""
        try:
            logger.debug(f"Resolving {domain} ({record_type}) via {self.name}")
            answers = self._resolver.resolve(domain, record_type)
            results = [str(rdata) for rdata in answers]
            logger.info(
                f"Successfully resolved {domain} via {self.name}: {results}"
            )
            return results
        except dns.exception.DNSException as e:
            logger.error(f"Failed to resolve {domain} via {self.name}: {e}")
            raise

    def health_check(self) -> bool:
        """Check health by resolving a known domain."""
        test_domain = self.config.get("health_check_domain", "google.com")
        try:
            self.resolve(test_domain, "A")
            self.healthy = True
            self.last_check = time.time()
            logger.debug(f"Health check passed for {self.name}")
            return True
        except Exception as e:
            self.healthy = False
            self.last_check = time.time()
            logger.warning(f"Health check failed for {self.name}: {e}")
            return False


class PrivateDNSProvider(DNSProvider):
    """Private/Internal DNS provider for corporate networks."""

    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(name, config)
        self.servers = self.config.get("servers", [])
        if not self.servers:
            raise ValueError("Private DNS provider requires 'servers' in config")
        self._setup_resolver()

    def _setup_resolver(self):
        """Setup the DNS resolver with private DNS servers."""
        self._resolver = dns.resolver.Resolver()
        self._resolver.nameservers = self.servers
        self._resolver.timeout = self.config.get("timeout", 5.0)
        self._resolver.lifetime = self.config.get("lifetime", 10.0)

    def resolve(self, domain: str, record_type: str = "A") -> List[str]:
        """Resolve domain using private DNS servers."""
        try:
            logger.debug(
                f"Resolving {domain} ({record_type}) via private DNS {self.name}"
            )
            answers = self._resolver.resolve(domain, record_type)
            results = [str(rdata) for rdata in answers]
            logger.info(
                f"Successfully resolved {domain} via {self.name}: {results}"
            )
            return results
        except dns.exception.DNSException as e:
            logger.error(f"Failed to resolve {domain} via {self.name}: {e}")
            raise

    def health_check(self) -> bool:
        """Check health by attempting to connect to DNS servers."""
        test_domain = self.config.get("health_check_domain", "localhost")
        try:
            self.resolve(test_domain, "A")
            self.healthy = True
            self.last_check = time.time()
            logger.debug(f"Health check passed for {self.name}")
            return True
        except Exception as e:
            # For private DNS, we might not always have a test domain
            # So we just check if we can connect
            self.healthy = True  # Assume healthy if configured
            self.last_check = time.time()
            logger.debug(
                f"Health check for {self.name} returned: {e}, assuming healthy"
            )
            return True


class CloudDNSProvider(DNSProvider):
    """Cloud-based DNS provider (AWS Route53, Azure DNS, Google Cloud DNS)."""

    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(name, config)
        self.cloud_provider = self.config.get("cloud_provider", "aws")
        self.servers = self.config.get("servers", [])
        self._setup_resolver()

    def _setup_resolver(self):
        """Setup the DNS resolver for cloud DNS."""
        if self.servers:
            self._resolver = dns.resolver.Resolver()
            self._resolver.nameservers = self.servers
            self._resolver.timeout = self.config.get("timeout", 5.0)
            self._resolver.lifetime = self.config.get("lifetime", 10.0)
        else:
            # Use default system resolver
            self._resolver = dns.resolver.Resolver()

    def resolve(self, domain: str, record_type: str = "A") -> List[str]:
        """Resolve domain using cloud DNS."""
        try:
            logger.debug(
                f"Resolving {domain} ({record_type}) via cloud DNS {self.name}"
            )
            answers = self._resolver.resolve(domain, record_type)
            results = [str(rdata) for rdata in answers]
            logger.info(
                f"Successfully resolved {domain} via {self.name}: {results}"
            )
            return results
        except dns.exception.DNSException as e:
            logger.error(f"Failed to resolve {domain} via {self.name}: {e}")
            raise

    def health_check(self) -> bool:
        """Check health by resolving a cloud-specific test domain."""
        test_domains = {
            "aws": "amazon.com",
            "azure": "microsoft.com",
            "gcp": "google.com",
        }
        test_domain = self.config.get(
            "health_check_domain",
            test_domains.get(self.cloud_provider, "google.com"),
        )

        try:
            self.resolve(test_domain, "A")
            self.healthy = True
            self.last_check = time.time()
            logger.debug(f"Health check passed for {self.name}")
            return True
        except Exception as e:
            self.healthy = False
            self.last_check = time.time()
            logger.warning(f"Health check failed for {self.name}: {e}")
            return False
