#!/usr/bin/env python3
"""
Example 2: Multi-Provider Resolver with Failover
Demonstrates using multiple providers with automatic failover.
"""

from hybrid_dns_architect import DNSResolver
from hybrid_dns_architect.providers import PublicDNSProvider

def main():
    # Create multiple providers
    providers = {
        "google": PublicDNSProvider("google", config={"provider": "google"}),
        "cloudflare": PublicDNSProvider("cloudflare", config={"provider": "cloudflare"}),
        "quad9": PublicDNSProvider("quad9", config={"provider": "quad9"}),
    }

    # Create resolver
    resolver = DNSResolver(providers=providers, cache_ttl=300)

    print("Multi-Provider DNS Resolver with Failover")
    print("=" * 50)

    # Test resolution
    domain = "example.com"
    print(f"Resolving: {domain}")

    result = resolver.resolve(domain, "A")
    if result.success:
        print(f"✓ Success!")
        print(f"  Provider: {result.provider}")
        print(f"  Records: {result.records}")
        print(f"  Duration: {result.duration:.3f}s")
    else:
        print(f"✗ Failed: {result.error}")

    print("\n" + "=" * 50)

    # Check provider health
    print("\nProvider Health Status:")
    health = resolver.health_check_all()
    for name, status in health.items():
        status_str = "Healthy" if status else "Unhealthy"
        print(f"  {name}: {status_str}")

    # Show resolver status
    print("\nResolver Status:")
    status = resolver.get_status()
    print(f"  Total Providers: {len(status['providers'])}")
    print(f"  Cache Size: {status['cache_size']}")
    print(f"  Cache TTL: {status['cache_ttl']}s")


if __name__ == "__main__":
    main()
