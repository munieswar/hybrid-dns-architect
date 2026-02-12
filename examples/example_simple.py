#!/usr/bin/env python3
"""
Example 1: Simple DNS Resolver
Demonstrates basic usage with a single public DNS provider.
"""

from hybrid_dns_architect import DNSResolver
from hybrid_dns_architect.providers import PublicDNSProvider

# Create a simple resolver with Google DNS
def main():
    # Create provider
    google_dns = PublicDNSProvider("google", config={"provider": "google"})

    # Create resolver
    resolver = DNSResolver(providers={"google": google_dns})

    # Resolve some domains
    test_domains = ["google.com", "github.com", "stackoverflow.com"]

    print("Simple DNS Resolver Example")
    print("=" * 50)

    for domain in test_domains:
        result = resolver.resolve(domain, "A")
        if result.success:
            print(f"✓ {domain}")
            print(f"  Records: {', '.join(result.records[:3])}")
            print(f"  Provider: {result.provider}")
            print(f"  Duration: {result.duration:.3f}s")
        else:
            print(f"✗ {domain} - Failed: {result.error}")
        print()


if __name__ == "__main__":
    main()
