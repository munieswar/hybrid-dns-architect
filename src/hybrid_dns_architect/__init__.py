"""
Hybrid DNS Architect - A flexible DNS resolution system with support for multiple providers.
"""

__version__ = "0.1.0"

from .resolver import DNSResolver
from .policy import DNSPolicy, PolicyEngine
from .providers import PublicDNSProvider, PrivateDNSProvider, CloudDNSProvider

__all__ = [
    "DNSResolver",
    "DNSPolicy",
    "PolicyEngine",
    "PublicDNSProvider",
    "PrivateDNSProvider",
    "CloudDNSProvider",
]
