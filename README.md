# 🏗️ Hybrid DNS Architect

**An interactive Azure DNS Private Resolver visualizer, configuration generator, and MCP server for GitHub Copilot.**

> Built for the [Agents League TechConnect Hackathon](https://github.com/agents-league-techconnect) — Creative Apps Track (Battle #1)

![Architecture Visualizer](https://img.shields.io/badge/Azure-DNS%20Private%20Resolver-0078D4?style=for-the-badge&logo=microsoft-azure)
![MCP](https://img.shields.io/badge/MCP-Enabled-blueviolet?style=for-the-badge)
![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-Powered-black?style=for-the-badge&logo=github)

---

## 🎯 What It Does

Hybrid DNS Architect helps network engineers and cloud architects **visualize, understand, and deploy** Azure DNS Private Resolver configurations for hybrid DNS environments. It tackles the complexity of setting up bidirectional DNS resolution between Azure and on-premises networks.

### Features

| Feature | Description |
|---------|-------------|
| 🏗️ **Architecture Visualizer** | Interactive animated SVG diagram showing Azure and on-premises DNS components, with live data flow visualization |
| 🔍 **DNS Path Tracer** | Step-by-step animated walkthrough of DNS resolution paths (Azure→On-Prem and On-Prem→Azure) |
| ⚙️ **Config Generator** | Generates ready-to-deploy scripts in **Bicep**, **PowerShell**, **Azure CLI**, and **On-Prem DNS** formats |
| 🤖 **MCP Server** | 5 tools exposed to GitHub Copilot for generating configs, explaining DNS paths, and troubleshooting |

### MCP Tools for GitHub Copilot

The MCP server exposes these tools directly in Copilot Chat:

| Tool | Description |
|------|-------------|
| `generate_hybrid_dns_config` | Generate Bicep/PowerShell/CLI deployment scripts |
| `generate_onprem_dns_config` | Generate on-premises DNS conditional forwarder configs |
| `explain_dns_resolution_path` | Explain step-by-step DNS resolution for any query |
| `troubleshoot_hybrid_dns` | Get troubleshooting guides for common issues |
| `get_hybrid_dns_info` | Retrieve knowledge about hybrid DNS concepts |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [VS Code](https://code.visualstudio.com/) with [GitHub Copilot](https://code.visualstudio.com/docs/copilot/setup)

### Install & Run the Web App

```bash
cd hybrid
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the interactive visualizer.

### Setup the MCP Server for GitHub Copilot

1. Install MCP server dependencies:
   ```bash
   cd mcp-server
   npm install
   ```

2. The MCP configuration is already set up in `.vscode/mcp.json`. VS Code will detect it automatically.

3. Open Copilot Chat and try:
   - *"Generate a Bicep template for hybrid DNS with my domain corp.example.com"*
   - *"Explain the DNS resolution path when an Azure VM queries an on-prem domain"*
   - *"How do I troubleshoot when on-prem can't resolve Azure private zones?"*
   - *"Generate PowerShell to set up conditional forwarders on my Windows DNS server"*

---

## 📐 Architecture

Based on the official [Azure DNS Private Resolver for hybrid DNS](https://learn.microsoft.com/azure/dns/private-resolver-hybrid-dns) documentation:

```
┌─────────────────────────────┐       VPN/ER        ┌─────────────────────────────┐
│       Azure Cloud           │◄────────────────────►│      On-Premises            │
│                             │                      │                             │
│  ┌───────────────────────┐  │                      │  ┌───────────────────────┐  │
│  │ DNS Private Resolver  │  │                      │  │ Windows DNS Server    │  │
│  │ ├─ Inbound Endpoint   │  │                      │  │ + Conditional         │  │
│  │ └─ Outbound Endpoint  │  │                      │  │   Forwarders          │  │
│  └───────────────────────┘  │                      │  └───────────────────────┘  │
│  ┌───────────────────────┐  │                      │  ┌───────────────────────┐  │
│  │ Forwarding Ruleset    │  │                      │  │ AD / DNS Zones        │  │
│  └───────────────────────┘  │                      │  └───────────────────────┘  │
│  ┌───────────────────────┐  │                      │                             │
│  │ Private DNS Zone      │  │                      │                             │
│  └───────────────────────┘  │                      │                             │
└─────────────────────────────┘                      └─────────────────────────────┘
```

### DNS Resolution Flows

**Azure → On-Premises:**
`Azure VM → Azure DNS (168.63.129.16) → Outbound Endpoint → Forwarding Rule → VPN/ER → On-Prem DNS`

**On-Premises → Azure:**
`Client → On-Prem DNS → Conditional Forwarder → VPN/ER → Inbound Endpoint → Private DNS Zone`

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Visualizations**: SVG with CSS animations
- **MCP Server**: Node.js + `@modelcontextprotocol/sdk`
- **Config Generation**: Bicep, PowerShell, Azure CLI, Windows DNS

---

## 📂 Project Structure

```
hybrid/
├── src/                         # React web application
│   ├── App.jsx                  # Main app with tabs & config state
│   ├── components/
│   │   ├── ArchitectureVisualizer.jsx  # Animated SVG architecture diagram
│   │   ├── DnsPathTracer.jsx           # Step-by-step DNS path animation
│   │   ├── ConfigGenerator.jsx         # Multi-format config generator
│   │   ├── ConfigForm.jsx              # Configuration input panel
│   │   └── Header.jsx                  # App header
│   ├── main.jsx
│   └── index.css
├── mcp-server/                  # MCP Server for GitHub Copilot
│   ├── index.js                 # Server with 5 tools + knowledge base
│   └── package.json
├── .vscode/
│   └── mcp.json                 # VS Code MCP integration config
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 🤖 GitHub Copilot Usage

This project was built entirely with GitHub Copilot assistance:

- **Architecture design**: Copilot helped design the component structure and data flow
- **SVG visualization**: Copilot generated the animated architecture diagram with proper positioning
- **Config generators**: Copilot produced Bicep, PowerShell, and Azure CLI scripts following Azure best practices
- **MCP server**: Copilot structured the MCP tools with proper Zod schemas and response formats
- **Troubleshooting knowledge base**: Copilot compiled comprehensive troubleshooting guides from Azure documentation

---

## 📚 References

- [Azure DNS Private Resolver — Hybrid DNS](https://learn.microsoft.com/azure/dns/private-resolver-hybrid-dns)
- [DNS Private Resolver Overview](https://learn.microsoft.com/azure/dns/dns-private-resolver-overview)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [MCP in VS Code](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
- [DNS Failover with Private Resolvers](https://learn.microsoft.com/azure/dns/tutorial-dns-private-resolver-failover)

---

## 📜 License

MIT — See [LICENSE](../../LICENSE) for details.
