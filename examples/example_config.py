#!/usr/bin/env python3
"""
Example 4: Using Configuration Files
Demonstrates loading resolver configuration from YAML files.
"""

from hybrid_dns_architect.config import load_resolver
import sys

def main():
    # Load resolver from configuration file
    config_file = "examples/simple-config.yaml"
    
    print("Configuration-Based DNS Resolver")
    print("=" * 50)
    print(f"Loading configuration from: {config_file}\n")

    try:
        resolver = load_resolver(config_file)
    except FileNotFoundError:
        print(f"Error: Configuration file not found: {config_file}")
        print("Please run this example from the project root directory.")
        sys.exit(1)

    # Show resolver status
    status = resolver.get_status()
    print("Resolver Configuration:")
    print(f"  Providers: {len(status['providers'])}")
    for name, info in status['providers'].items():
        print(f"    - {name}")
    print(f"  Policies: {status['policies']}")
    print(f"  Cache TTL: {status['cache_ttl']}s")

    print("\n" + "=" * 50)

    # Test resolution
    test_domains = ["example.com", "github.com"]
    print(f"\nTesting resolution with {len(test_domains)} domains:")
    
    for domain in test_domains:
        result = resolver.resolve(domain, "A")
        if result.success:
            print(f"  ✓ {domain} -> {result.records[0]} via {result.provider}")
        else:
            print(f"  ✗ {domain} -> Failed")

    print("\n" + "=" * 50)
    print("\nConfiguration file format:")
    print("""
  providers:
    - name: provider-name
      type: public|private|cloud
      config:
        # provider-specific config
  
  policies:
    - name: policy-name
      patterns: ["*.example.com"]
      providers: ["provider-name"]
      priority: 10
  
  cache:
    ttl: 300
    """)


if __name__ == "__main__":
    main()
