#!/usr/bin/env python3
"""
Example 3: Policy-Based Routing
Demonstrates intelligent DNS routing based on domain patterns.
"""

from hybrid_dns_architect import DNSResolver
from hybrid_dns_architect.providers import PublicDNSProvider, PrivateDNSProvider
from hybrid_dns_architect.policy import DNSPolicy, PolicyEngine

def main():
    # Create providers
    public_dns = PublicDNSProvider("public", config={"provider": "google"})
    
    # Note: This will fail in most environments without actual internal DNS
    # It's just for demonstration
    try:
        private_dns = PrivateDNSProvider(
            "private",
            config={"servers": ["10.0.0.1"]}
        )
    except:
        # Fallback to another public DNS if private DNS not available
        private_dns = PublicDNSProvider("private-fallback", config={"provider": "quad9"})

    providers = {
        "public": public_dns,
        "private": private_dns,
    }

    # Create policies
    policies = [
        # Internal domains go to private DNS
        DNSPolicy(
            name="internal",
            patterns=["*.internal", "*.corp", "*.local"],
            providers=["private"],
            priority=10
        ),
        # Cloud services go to public DNS
        DNSPolicy(
            name="cloud-services",
            patterns=["*.amazonaws.com", "*.azure.com", "*.cloud.google.com"],
            providers=["public"],
            priority=20
        ),
        # Everything else uses public DNS
        DNSPolicy(
            name="default",
            patterns=["*"],
            providers=["public"],
            priority=100
        ),
    ]

    # Create policy engine
    policy_engine = PolicyEngine(policies)

    # Create resolver
    resolver = DNSResolver(
        providers=providers,
        policy_engine=policy_engine,
        cache_ttl=300
    )

    print("Policy-Based DNS Routing Example")
    print("=" * 50)

    # Test different domain types
    test_domains = [
        ("app.internal", "Internal domain"),
        ("s3.amazonaws.com", "AWS service"),
        ("google.com", "Public domain"),
    ]

    for domain, description in test_domains:
        print(f"\n{description}: {domain}")
        
        # Show which providers would be used
        providers_list = policy_engine.get_providers_for_domain(domain)
        print(f"  Policy matched: {providers_list}")
        
        # Attempt resolution
        result = resolver.resolve(domain, "A")
        if result.success:
            print(f"  ✓ Resolved via: {result.provider}")
            print(f"  Records: {result.records[:2]}")
        else:
            print(f"  ✗ Resolution failed: {result.error}")

    print("\n" + "=" * 50)
    print("\nPolicy Configuration:")
    for policy in policy_engine.policies:
        print(f"  {policy.name} (priority: {policy.priority})")
        print(f"    Patterns: {policy.patterns}")
        print(f"    Providers: {policy.providers}")


if __name__ == "__main__":
    main()
