"""
Command-line interface for hybrid DNS architect.
"""

import argparse
import logging
import sys
import json
from pathlib import Path

from .config import load_resolver
from .resolver import DNSResolver

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def cmd_resolve(args):
    """Resolve a domain name."""
    try:
        resolver = load_resolver(args.config)
        result = resolver.resolve(args.domain, args.type)

        if result.success:
            print(f"Domain: {result.domain}")
            print(f"Type: {result.record_type}")
            print(f"Provider: {result.provider}")
            print(f"Records:")
            for record in result.records:
                print(f"  - {record}")
            print(f"Duration: {result.duration:.3f}s")
            return 0
        else:
            print(f"Failed to resolve {result.domain}: {result.error}")
            return 1

    except Exception as e:
        logger.error(f"Error resolving domain: {e}")
        return 1


def cmd_health(args):
    """Check health of all providers."""
    try:
        resolver = load_resolver(args.config)
        results = resolver.health_check_all()

        print("Provider Health Status:")
        print("-" * 40)
        all_healthy = True
        for name, healthy in results.items():
            status = "✓ Healthy" if healthy else "✗ Unhealthy"
            print(f"{name}: {status}")
            if not healthy:
                all_healthy = False

        return 0 if all_healthy else 1

    except Exception as e:
        logger.error(f"Error checking health: {e}")
        return 1


def cmd_status(args):
    """Show resolver status."""
    try:
        resolver = load_resolver(args.config)
        status = resolver.get_status()

        if args.json:
            print(json.dumps(status, indent=2))
        else:
            print("DNS Resolver Status:")
            print("-" * 40)
            print(f"Providers: {len(status['providers'])}")
            print(f"Policies: {status['policies']}")
            print(f"Cache Size: {status['cache_size']}")
            print(f"Cache TTL: {status['cache_ttl']}s")
            print("\nProvider Details:")
            for name, info in status["providers"].items():
                health = "Healthy" if info["healthy"] else "Unhealthy"
                last_check = info["last_check"]
                check_info = (
                    f"(checked at {last_check:.0f})"
                    if last_check
                    else "(not checked)"
                )
                print(f"  {name}: {health} {check_info}")

        return 0

    except Exception as e:
        logger.error(f"Error getting status: {e}")
        return 1


def cmd_test(args):
    """Test DNS resolution with multiple domains."""
    try:
        resolver = load_resolver(args.config)

        # Default test domains if none provided
        test_domains = args.domains or [
            "google.com",
            "github.com",
            "localhost",
        ]

        print(f"Testing {len(test_domains)} domains...")
        print("-" * 60)

        success_count = 0
        for domain in test_domains:
            result = resolver.resolve(domain, args.type)
            if result.success:
                status = "✓"
                records_str = ", ".join(result.records[:3])
                if len(result.records) > 3:
                    records_str += f" (+{len(result.records) - 3} more)"
                print(
                    f"{status} {domain:30} -> {records_str} "
                    f"[{result.provider}, {result.duration:.3f}s]"
                )
                success_count += 1
            else:
                status = "✗"
                print(f"{status} {domain:30} -> FAILED: {result.error}")

        print("-" * 60)
        print(
            f"Results: {success_count}/{len(test_domains)} successful "
            f"({success_count * 100 // len(test_domains)}%)"
        )

        return 0 if success_count == len(test_domains) else 1

    except Exception as e:
        logger.error(f"Error testing domains: {e}")
        return 1


def main():
    """Main entry point for CLI."""
    parser = argparse.ArgumentParser(
        description="Hybrid DNS Architect - Multi-provider DNS resolution system",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "-c",
        "--config",
        default="config/dns-config.yaml",
        help="Path to configuration file (default: config/dns-config.yaml)",
    )

    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Enable verbose logging"
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Resolve command
    resolve_parser = subparsers.add_parser(
        "resolve", help="Resolve a domain name"
    )
    resolve_parser.add_argument("domain", help="Domain name to resolve")
    resolve_parser.add_argument(
        "-t",
        "--type",
        default="A",
        help="DNS record type (default: A)",
    )
    resolve_parser.set_defaults(func=cmd_resolve)

    # Health command
    health_parser = subparsers.add_parser(
        "health", help="Check provider health"
    )
    health_parser.set_defaults(func=cmd_health)

    # Status command
    status_parser = subparsers.add_parser("status", help="Show resolver status")
    status_parser.add_argument(
        "--json", action="store_true", help="Output as JSON"
    )
    status_parser.set_defaults(func=cmd_status)

    # Test command
    test_parser = subparsers.add_parser(
        "test", help="Test resolution with multiple domains"
    )
    test_parser.add_argument(
        "domains", nargs="*", help="Domains to test (optional)"
    )
    test_parser.add_argument(
        "-t",
        "--type",
        default="A",
        help="DNS record type (default: A)",
    )
    test_parser.set_defaults(func=cmd_test)

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if not args.command:
        parser.print_help()
        return 1

    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
