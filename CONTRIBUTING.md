# Contributing to Hybrid DNS Architect

Thank you for considering contributing to Hybrid DNS Architect! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## How to Contribute

### Reporting Bugs

Before submitting a bug report:
- Check existing issues to avoid duplicates
- Collect relevant information (version, OS, configuration)

Submit bug reports with:
- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Error messages and logs
- Environment details

### Suggesting Features

Feature suggestions should include:
- Clear description of the feature
- Use cases and benefits
- Potential implementation approach
- Any related issues or discussions

### Pull Requests

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR-USERNAME/hybrid-dns-architect.git
   cd hybrid-dns-architect
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

3. **Make Changes**
   - Follow code style guidelines
   - Add tests for new features
   - Update documentation
   - Keep commits focused and atomic

4. **Test Your Changes**
   ```bash
   # Run tests
   pytest
   
   # Check coverage
   pytest --cov=hybrid_dns_architect --cov-report=html
   
   # Run linters
   black src/ tests/
   flake8 src/ tests/
   ```

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Provide clear description
   - Reference related issues
   - Include test results
   - Update CHANGELOG.md

## Development Setup

### Prerequisites

- Python 3.8+
- pip
- git

### Installation

```bash
# Clone repository
git clone https://github.com/munieswar/hybrid-dns-architect.git
cd hybrid-dns-architect

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install in development mode
pip install -e .
pip install -r requirements-dev.txt
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_resolver.py

# Run with coverage
pytest --cov=hybrid_dns_architect --cov-report=html

# Run specific test
pytest tests/test_resolver.py::TestDNSResolver::test_resolve_success
```

### Code Style

We use:
- **black** for code formatting
- **flake8** for linting
- **isort** for import sorting

```bash
# Format code
black src/ tests/

# Check linting
flake8 src/ tests/

# Sort imports
isort src/ tests/
```

### Type Hints

Use type hints for better code quality:

```python
from typing import List, Optional, Dict

def resolve(domain: str, record_type: str = "A") -> List[str]:
    """Resolve a domain."""
    pass
```

## Code Organization

```
src/hybrid_dns_architect/
├── __init__.py          # Package initialization
├── cli.py               # CLI interface
├── config.py            # Configuration loader
├── policy.py            # Policy engine
├── providers.py         # DNS providers
└── resolver.py          # Main resolver

tests/
├── test_config.py       # Configuration tests
├── test_policy.py       # Policy tests
├── test_providers.py    # Provider tests
└── test_resolver.py     # Resolver tests
```

## Writing Tests

### Test Structure

```python
class TestFeature:
    def test_basic_functionality(self):
        """Test basic feature functionality."""
        # Arrange
        resolver = create_test_resolver()
        
        # Act
        result = resolver.resolve("example.com")
        
        # Assert
        assert result.success is True
        assert len(result.records) > 0
```

### Mocking

Use `unittest.mock` for external dependencies:

```python
from unittest.mock import Mock, patch

@patch("dns.resolver.Resolver.resolve")
def test_with_mock(mock_resolve):
    mock_resolve.return_value = ["192.0.2.1"]
    # ... test code
```

### Test Coverage

Aim for:
- 80%+ overall coverage
- 100% coverage for critical paths
- All edge cases covered

## Documentation

### Docstrings

Use Google-style docstrings:

```python
def resolve(domain: str, record_type: str = "A") -> List[str]:
    """
    Resolve a domain name.

    Args:
        domain: Domain name to resolve
        record_type: DNS record type (A, AAAA, CNAME, etc.)

    Returns:
        List of resolved addresses/records

    Raises:
        DNSException: If resolution fails
    """
    pass
```

### Documentation Files

Update relevant documentation:
- README.md - User guide
- docs/ARCHITECTURE.md - Architecture details
- docs/DEPLOYMENT.md - Deployment guide
- CHANGELOG.md - Version changes

## Commit Messages

Follow conventional commits:

```
feat: add new provider type
fix: resolve caching issue
docs: update README with examples
test: add resolver integration tests
refactor: simplify policy matching
perf: optimize cache lookup
chore: update dependencies
```

## Pull Request Process

1. **Before Submitting**
   - Ensure all tests pass
   - Update documentation
   - Add changelog entry
   - Rebase on latest main

2. **PR Description**
   - What: Clear description of changes
   - Why: Motivation and context
   - How: Implementation approach
   - Testing: How changes were tested

3. **Review Process**
   - Address review comments
   - Keep PR focused and manageable
   - Be responsive to feedback

4. **After Approval**
   - Squash commits if needed
   - Ensure CI passes
   - Maintainer will merge

## Release Process

1. Update version in `setup.py`
2. Update CHANGELOG.md
3. Create release tag
4. Build and publish to PyPI
5. Create GitHub release

## Questions?

- Open an issue for questions
- Join discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
