# Hybrid DNS Architect

A flexible, policy-based DNS resolution system with support for multiple DNS providers and intelligent routing. Perfect for hybrid cloud environments, enterprise networks, and complex DNS scenarios.

## Features

- **Multiple DNS Provider Support**: Public DNS (Google, Cloudflare, Quad9), Private DNS, and Cloud DNS (AWS, Azure, GCP)
- **Intelligent Routing**: Policy-based DNS query routing with pattern matching
- **High Availability**: Automatic failover and health checking
- **Performance**: Built-in caching with configurable TTL
- **Flexibility**: YAML/JSON configuration with hot-reload support
- **Easy Integration**: Python library and CLI tool

## Installation

### From Source

```bash
git clone https://github.com/munieswar/hybrid-dns-architect.git
cd hybrid-dns-architect
pip install -e .
```

### Using pip

```bash
pip install -r requirements.txt
```

### Development Installation

```bash
pip install -r requirements-dev.txt
```

## Quick Start

### 1. Create a Configuration File

Create `config/dns-config.yaml`:

```yaml
providers:
  - name: google-dns
    type: public
    config:
      provider: google

  - name: private-dns
    type: private
    config:
      servers:
        - 10.0.0.1
        - 10.0.0.2

policies:
  - name: corporate-internal
    patterns:
      - "*.corp.local"
      - "*.internal"
    providers:
      - private-dns
    priority: 10

cache:
  ttl: 300
```

### 2. Use the CLI

```bash
# Resolve a domain
hybrid-dns resolve example.com

# Check provider health
hybrid-dns health

# Show resolver status
hybrid-dns status

# Test multiple domains
hybrid-dns test google.com github.com
```

### 3. Use as a Python Library

```python
from hybrid_dns_architect import DNSResolver
from hybrid_dns_architect.providers import PublicDNSProvider
from hybrid_dns_architect.policy import DNSPolicy, PolicyEngine

# Create providers
google = PublicDNSProvider("google", config={"provider": "google"})
cloudflare = PublicDNSProvider("cloudflare", config={"provider": "cloudflare"})

# Create policies
policy = DNSPolicy(
    name="internal",
    patterns=["*.internal"],
    providers=["google"]
)

# Create resolver
resolver = DNSResolver(
    providers={"google": google, "cloudflare": cloudflare},
    policy_engine=PolicyEngine([policy])
)

# Resolve domains
result = resolver.resolve("example.com", "A")
if result.success:
    print(f"Resolved to: {result.records}")
```

## Configuration

### Provider Types

#### Public DNS
```yaml
- name: google-dns
  type: public
  config:
    provider: google  # Options: google, cloudflare, quad9
    timeout: 5.0
    health_check_domain: google.com
```

#### Private DNS
```yaml
- name: corporate-dns
  type: private
  config:
    servers:
      - 10.0.0.1
      - 10.0.0.2
    timeout: 3.0
```

#### Cloud DNS
```yaml
- name: aws-dns
  type: cloud
  config:
    cloud_provider: aws  # Options: aws, azure, gcp
    servers:
      - 8.8.8.8
```

### Policy Configuration

Policies use pattern matching to route DNS queries:

```yaml
policies:
  - name: internal-network
    patterns:
      - "*.corp.local"      # Subdomain wildcard
      - "*.internal"
      - "localhost"
    providers:
      - corporate-dns       # Try these providers in order
      - google-dns
    priority: 10           # Lower = higher priority
```

**Pattern Matching:**
- `example.com` - Exact match
- `*.example.com` - Any subdomain of example.com
- `example.*` - example with any TLD
- Case-insensitive matching

### Cache Configuration

```yaml
cache:
  ttl: 300  # Seconds (0 to disable)
```

## CLI Reference

### Resolve a Domain

```bash
hybrid-dns resolve <domain> [-t TYPE]

# Examples
hybrid-dns resolve example.com
hybrid-dns resolve example.com -t AAAA
hybrid-dns resolve example.com -t MX
```

### Check Provider Health

```bash
hybrid-dns health
```

Output:
```
Provider Health Status:
----------------------------------------
google-dns: ✓ Healthy
corporate-dns: ✗ Unhealthy
```

### Show Resolver Status

```bash
hybrid-dns status [--json]

# Example output
DNS Resolver Status:
----------------------------------------
Providers: 3
Policies: 2
Cache Size: 15
Cache TTL: 300s

Provider Details:
  google-dns: Healthy (checked at 1234567890)
  cloudflare-dns: Healthy (checked at 1234567890)
  corporate-dns: Unhealthy (checked at 1234567890)
```

### Test Multiple Domains

```bash
hybrid-dns test [domain1 domain2 ...] [-t TYPE]

# Examples
hybrid-dns test
hybrid-dns test google.com github.com stackoverflow.com
```

### Configuration File

```bash
hybrid-dns -c /path/to/config.yaml resolve example.com
```

### Verbose Logging

```bash
hybrid-dns -v resolve example.com
```

## Architecture

```
┌─────────────────────────────────────────┐
│         DNS Resolver (Main)             │
│  ┌─────────────────────────────────┐   │
│  │      Policy Engine              │   │
│  │  - Pattern Matching             │   │
│  │  - Priority-based Routing       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      Cache Layer                │   │
│  │  - TTL-based Expiration         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │    Provider Manager             │   │
│  │  - Health Checking              │   │
│  │  - Automatic Failover           │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
          │         │         │
    ┌─────┴───┐ ┌───┴────┐ ┌─┴─────┐
    │ Public  │ │Private │ │ Cloud │
    │   DNS   │ │  DNS   │ │  DNS  │
    └─────────┘ └────────┘ └───────┘
```

## Use Cases

### 1. Hybrid Cloud Environment

Route internal corporate domains to private DNS while using public DNS for internet domains:

```yaml
policies:
  - name: corporate
    patterns: ["*.corp.local", "*.internal"]
    providers: [private-dns]
    priority: 1

  - name: public
    patterns: ["*"]
    providers: [google-dns, cloudflare-dns]
    priority: 100
```

### 2. Cloud Provider Optimization

Route cloud-specific domains to the respective cloud provider's DNS:

```yaml
policies:
  - name: aws-services
    patterns: ["*.amazonaws.com", "*.aws.com"]
    providers: [aws-route53, google-dns]
    priority: 10

  - name: azure-services
    patterns: ["*.azure.com", "*.microsoft.com"]
    providers: [azure-dns, google-dns]
    priority: 10
```

### 3. Security-Focused Routing

Use security-focused DNS providers for sensitive domains:

```yaml
policies:
  - name: financial
    patterns: ["*.bank.com", "*.financial.*"]
    providers: [quad9-security, google-dns]
    priority: 5
```

## Testing

Run the test suite:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=hybrid_dns_architect --cov-report=html

# Run specific test file
pytest tests/test_resolver.py

# Run with verbose output
pytest -v
```

## Development

### Code Style

This project uses:
- `black` for code formatting
- `flake8` for linting

```bash
# Format code
black src/ tests/

# Run linter
flake8 src/ tests/
```

### Project Structure

```
hybrid-dns-architect/
├── src/
│   └── hybrid_dns_architect/
│       ├── __init__.py
│       ├── cli.py           # CLI interface
│       ├── config.py        # Configuration loader
│       ├── policy.py        # Policy engine
│       ├── providers.py     # DNS providers
│       └── resolver.py      # Main resolver
├── tests/
│   ├── test_config.py
│   ├── test_policy.py
│   ├── test_providers.py
│   └── test_resolver.py
├── config/
│   └── dns-config.yaml      # Default configuration
├── examples/
│   ├── simple-config.yaml
│   └── advanced-config.yaml
├── requirements.txt
├── requirements-dev.txt
├── setup.py
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions, please visit:
https://github.com/munieswar/hybrid-dns-architect
