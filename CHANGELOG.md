# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-12

### Added
- Initial release of Hybrid DNS Architect
- Core DNS resolution engine with provider abstraction
- Support for multiple DNS provider types:
  - Public DNS (Google, Cloudflare, Quad9)
  - Private DNS (internal corporate servers)
  - Cloud DNS (AWS, Azure, GCP)
- Policy-based routing with pattern matching
  - Wildcard support for domains
  - Priority-based policy evaluation
  - Multiple provider fallback
- Health checking and automatic failover
- TTL-based caching for performance
- Configuration loader (YAML/JSON)
- Command-line interface with multiple commands:
  - `resolve` - Resolve domain names
  - `health` - Check provider health
  - `status` - Show resolver status
  - `test` - Test multiple domains
- Comprehensive test suite with 41 unit tests
- Example configurations and Python scripts
- Full documentation:
  - User guide (README.md)
  - Architecture documentation
  - Deployment guide
  - Contributing guidelines

### Features
- Multiple DNS provider support with automatic failover
- Intelligent routing based on domain patterns
- Configurable caching with TTL
- Health monitoring of DNS providers
- Flexible YAML/JSON configuration
- Python library and CLI tool
- Logging and error handling

### Documentation
- Comprehensive README with usage examples
- Architecture documentation explaining design decisions
- Deployment guide for various platforms
- Contributing guidelines
- Example configurations and code samples

## [Unreleased]

### Planned Features
- DNS-over-HTTPS (DoH) support
- DNS-over-TLS (DoT) support
- DNSSEC validation
- Prometheus metrics export
- REST API server mode
- Advanced caching strategies (LRU, distributed)
- Parallel provider queries
- IPv6 support
- Active Directory integration
- Web UI for configuration and monitoring
