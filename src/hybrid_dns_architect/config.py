"""
Configuration loader for hybrid DNS architect.
"""

import yaml
import json
from typing import Dict, Any, List
from pathlib import Path
import logging

from .providers import PublicDNSProvider, PrivateDNSProvider, CloudDNSProvider
from .policy import PolicyEngine, create_policy_from_config
from .resolver import DNSResolver

logger = logging.getLogger(__name__)


class ConfigLoader:
    """Load and parse configuration files."""

    PROVIDER_TYPES = {
        "public": PublicDNSProvider,
        "private": PrivateDNSProvider,
        "cloud": CloudDNSProvider,
    }

    @staticmethod
    def load_file(filepath: str) -> Dict[str, Any]:
        """
        Load configuration from a file.

        Args:
            filepath: Path to configuration file (YAML or JSON)

        Returns:
            Configuration dictionary
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Configuration file not found: {filepath}")

        with open(path, "r") as f:
            if path.suffix in [".yaml", ".yml"]:
                config = yaml.safe_load(f)
            elif path.suffix == ".json":
                config = json.load(f)
            else:
                raise ValueError(
                    f"Unsupported configuration format: {path.suffix}"
                )

        logger.info(f"Loaded configuration from {filepath}")
        return config

    @staticmethod
    def create_resolver_from_config(config: Dict[str, Any]) -> DNSResolver:
        """
        Create a DNSResolver from configuration.

        Args:
            config: Configuration dictionary

        Returns:
            Configured DNSResolver instance
        """
        # Create providers
        providers = {}
        for provider_config in config.get("providers", []):
            provider_type = provider_config.get("type", "public")
            provider_name = provider_config["name"]

            if provider_type not in ConfigLoader.PROVIDER_TYPES:
                logger.warning(
                    f"Unknown provider type {provider_type}, skipping {provider_name}"
                )
                continue

            provider_class = ConfigLoader.PROVIDER_TYPES[provider_type]
            provider = provider_class(
                name=provider_name, config=provider_config.get("config", {})
            )
            providers[provider_name] = provider
            logger.info(f"Created provider: {provider_name} ({provider_type})")

        # Create policies
        policies = []
        for policy_config in config.get("policies", []):
            policy = create_policy_from_config(policy_config)
            policies.append(policy)
            logger.info(f"Created policy: {policy.name}")

        # Create policy engine
        policy_engine = PolicyEngine(policies)

        # Create resolver
        cache_ttl = config.get("cache", {}).get("ttl", 300)
        resolver = DNSResolver(
            providers=providers,
            policy_engine=policy_engine,
            cache_ttl=cache_ttl,
        )

        logger.info("Successfully created DNS resolver from configuration")
        return resolver


def load_resolver(config_path: str) -> DNSResolver:
    """
    Load a DNS resolver from a configuration file.

    Args:
        config_path: Path to configuration file

    Returns:
        Configured DNSResolver instance
    """
    config = ConfigLoader.load_file(config_path)
    return ConfigLoader.create_resolver_from_config(config)
