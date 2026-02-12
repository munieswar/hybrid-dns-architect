# Deployment Guide

## Prerequisites

- Python 3.8 or higher
- pip package manager
- Network access to DNS servers

## Installation Methods

### 1. Production Installation

```bash
# Clone the repository
git clone https://github.com/munieswar/hybrid-dns-architect.git
cd hybrid-dns-architect

# Install dependencies
pip install -r requirements.txt

# Install the package
pip install .
```

### 2. Development Installation

```bash
# Clone the repository
git clone https://github.com/munieswar/hybrid-dns-architect.git
cd hybrid-dns-architect

# Install in editable mode with dev dependencies
pip install -e .
pip install -r requirements-dev.txt
```

### 3. Docker Deployment (Coming Soon)

```bash
# Build Docker image
docker build -t hybrid-dns-architect .

# Run container
docker run -v $(pwd)/config:/app/config hybrid-dns-architect resolve example.com
```

## Configuration

### 1. Create Configuration Directory

```bash
mkdir -p /etc/hybrid-dns-architect
```

### 2. Copy Configuration Template

```bash
cp config/dns-config.yaml /etc/hybrid-dns-architect/config.yaml
```

### 3. Edit Configuration

Edit `/etc/hybrid-dns-architect/config.yaml` to match your environment:

```yaml
providers:
  - name: primary-dns
    type: public
    config:
      provider: google

  - name: internal-dns
    type: private
    config:
      servers:
        - 192.168.1.1
        - 192.168.1.2

policies:
  - name: internal
    patterns:
      - "*.internal"
      - "*.corp"
    providers:
      - internal-dns
    priority: 10
```

## Running as a Service

### Systemd Service (Linux)

Create `/etc/systemd/system/hybrid-dns.service`:

```ini
[Unit]
Description=Hybrid DNS Architect Service
After=network.target

[Service]
Type=simple
User=dns-user
Group=dns-group
WorkingDirectory=/opt/hybrid-dns-architect
ExecStart=/usr/bin/python3 -m hybrid_dns_architect.server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable hybrid-dns
sudo systemctl start hybrid-dns
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  hybrid-dns:
    image: hybrid-dns-architect:latest
    volumes:
      - ./config:/app/config:ro
    restart: unless-stopped
    networks:
      - dns-network

networks:
  dns-network:
    driver: bridge
```

Run:

```bash
docker-compose up -d
```

## Cloud Deployment

### AWS

1. **EC2 Deployment**
   - Launch EC2 instance (Ubuntu 20.04+)
   - Install Python and dependencies
   - Configure security groups for DNS (port 53)
   - Set up as systemd service

2. **Lambda Function** (for API mode)
   - Package application with dependencies
   - Create Lambda function
   - Configure API Gateway
   - Set environment variables

### Azure

1. **Azure VM**
   - Create Ubuntu VM
   - Install dependencies
   - Configure NSG for DNS traffic
   - Set up as systemd service

2. **Azure Container Instances**
   - Build Docker image
   - Push to Azure Container Registry
   - Deploy container instance

### Google Cloud

1. **Compute Engine**
   - Create VM instance
   - Install dependencies
   - Configure firewall rules
   - Set up as systemd service

2. **Cloud Run** (for API mode)
   - Build container image
   - Push to Container Registry
   - Deploy to Cloud Run

## Kubernetes Deployment

Create `k8s-deployment.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hybrid-dns-config
data:
  config.yaml: |
    providers:
      - name: google-dns
        type: public
        config:
          provider: google
    # ... rest of config

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hybrid-dns
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hybrid-dns
  template:
    metadata:
      labels:
        app: hybrid-dns
    spec:
      containers:
      - name: hybrid-dns
        image: hybrid-dns-architect:latest
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: hybrid-dns-config

---
apiVersion: v1
kind: Service
metadata:
  name: hybrid-dns-service
spec:
  selector:
    app: hybrid-dns
  ports:
  - port: 53
    protocol: UDP
  type: ClusterIP
```

Deploy:

```bash
kubectl apply -f k8s-deployment.yaml
```

## Monitoring

### Health Checks

```bash
# Check provider health
hybrid-dns health

# Get detailed status
hybrid-dns status --json
```

### Logging

Configure logging in your application:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/hybrid-dns.log'),
        logging.StreamHandler()
    ]
)
```

### Metrics (Coming Soon)

Integration with:
- Prometheus
- Grafana
- CloudWatch
- Azure Monitor
- Stackdriver

## Security Best Practices

1. **Network Isolation**
   - Run in isolated network/VPC
   - Use security groups/firewalls
   - Limit DNS server access

2. **Access Control**
   - Run as non-root user
   - Use minimal permissions
   - Implement authentication (API mode)

3. **Encryption**
   - Use DNS-over-HTTPS (DoH) for public providers
   - Encrypt configuration files
   - Use secure communication channels

4. **Updates**
   - Regularly update dependencies
   - Monitor security advisories
   - Apply patches promptly

## Troubleshooting

### DNS Resolution Failures

```bash
# Test with verbose logging
hybrid-dns -v resolve example.com

# Check provider health
hybrid-dns health

# Verify configuration
hybrid-dns status
```

### Performance Issues

- Check cache hit rate
- Monitor DNS latency
- Review policy complexity
- Consider adding more providers

### Common Issues

1. **Permission Denied**
   - Check file permissions
   - Verify user has network access
   - Review SELinux/AppArmor policies

2. **All Providers Failed**
   - Verify network connectivity
   - Check DNS server availability
   - Review firewall rules

3. **Configuration Errors**
   - Validate YAML syntax
   - Check provider types
   - Verify pattern syntax

## Support

For issues and questions:
- GitHub Issues: https://github.com/munieswar/hybrid-dns-architect/issues
- Documentation: See README.md and docs/
