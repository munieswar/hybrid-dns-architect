#!/usr/bin/env node

/**
 * Hybrid DNS Architect — MCP Server
 *
 * Exposes tools for GitHub Copilot to generate Azure DNS Private Resolver
 * configurations, explain hybrid DNS concepts, and produce deployment scripts.
 *
 * Docs: https://learn.microsoft.com/azure/dns/private-resolver-hybrid-dns
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "hybrid-dns-architect",
  version: "1.0.0",
});

// ─────────────────────────────────────────────────────────
// RESOURCES — Knowledge base about hybrid DNS
// ─────────────────────────────────────────────────────────

const HYBRID_DNS_KNOWLEDGE = {
  overview: {
    title: "Azure DNS Private Resolver — Hybrid DNS Overview",
    content: `Azure DNS Private Resolver enables hybrid DNS resolution between Azure and on-premises networks.

**Key Concepts:**
- **Inbound Endpoint**: Receives DNS queries from on-premises, forwarded via VPN/ExpressRoute
- **Outbound Endpoint**: Sends DNS queries from Azure to on-premises DNS servers
- **Forwarding Ruleset**: Rules that route DNS queries for specific domains to target DNS servers
- **Private DNS Zone**: Azure-hosted DNS zone for internal name resolution (e.g., azure.contoso.com)

**Resolution Flows:**
1. Azure → On-Prem: Azure VM → Azure DNS (168.63.129.16) → Outbound Endpoint → Forwarding Rule → VPN/ER → On-Prem DNS
2. On-Prem → Azure: Client → On-Prem DNS → Conditional Forwarder → VPN/ER → Inbound Endpoint → Private DNS Zone

**Benefits over VM-based resolvers:**
- Zero maintenance (fully managed)
- Cost reduction (multitenant)
- Built-in high availability (availability zone aware)
- DevOps friendly (ARM/Bicep support)

Reference: https://learn.microsoft.com/azure/dns/private-resolver-hybrid-dns`,
  },
  bestPractices: {
    title: "Hybrid DNS Best Practices",
    content: `**Network Design:**
- Deploy resolver in a hub VNet for hub-and-spoke topologies
- Use dedicated /28 subnets (minimum) for inbound and outbound endpoints
- Delegate subnets to Microsoft.Network/dnsResolvers
- Keep DNS default settings on VNet (do NOT override with inbound endpoint IP)

**Forwarding Rules:**
- Create specific rules for on-prem domains (e.g., contoso.com.)
- Always include trailing dot in domain names
- Set destination to on-prem DNS server IP and port 53
- Enable the rule explicitly

**On-Premises Configuration:**
- Add conditional forwarders for each Azure private DNS zone
- Point to the inbound endpoint IP address
- Consider adding a second inbound endpoint for failover
- Use Forest-wide replication for AD-integrated zones

**Security:**
- Use NSGs on resolver subnets to restrict access
- Monitor DNS query logs via Azure Monitor
- Implement DNS failover for high availability

**Troubleshooting:**
- Verify VNet links exist for both private zones and forwarding rulesets
- Check subnet delegations are correct
- Confirm VPN/ExpressRoute connectivity
- Use nslookup/Resolve-DnsName to test resolution from both sides`,
  },
  architecture: {
    title: "Reference Architecture",
    content: `**Components:**

┌─────────────────────────────────────┐    VPN/ER    ┌─────────────────────────────────────┐
│           Azure Cloud               │◄────────────►│          On-Premises                │
│                                     │              │                                     │
│  ┌─────────────────────────────┐    │              │  ┌─────────────────────────────┐    │
│  │  Virtual Network (Hub)      │    │              │  │  Corporate Network          │    │
│  │  ┌───────────────────────┐  │    │              │  │  ┌───────────────────────┐  │    │
│  │  │ DNS Private Resolver  │  │    │              │  │  │ Windows DNS Server    │  │    │
│  │  │ ├─ Inbound Endpoint   │  │    │              │  │  │ + Conditional         │  │    │
│  │  │ └─ Outbound Endpoint  │  │    │              │  │  │   Forwarders          │  │    │
│  │  └───────────────────────┘  │    │              │  │  └───────────────────────┘  │    │
│  │  ┌───────────────────────┐  │    │              │  │  ┌───────────────────────┐  │    │
│  │  │ Forwarding Ruleset    │  │    │              │  │  │ AD/DNS Zones          │  │    │
│  │  │ → contoso.com → 10.x  │  │    │              │  │  │ contoso.com           │  │    │
│  │  └───────────────────────┘  │    │              │  │  └───────────────────────┘  │    │
│  └─────────────────────────────┘    │              │  └─────────────────────────────┘    │
│                                     │              │                                     │
│  ┌─────────────────────────────┐    │              │                                     │
│  │ Private DNS Zone            │    │              │                                     │
│  │ azure.contoso.com           │    │              │                                     │
│  └─────────────────────────────┘    │              │                                     │
└─────────────────────────────────────┘              └─────────────────────────────────────┘

**Subnet Requirements:**
- Inbound subnet: minimum /28, delegated to Microsoft.Network/dnsResolvers
- Outbound subnet: minimum /28, delegated to Microsoft.Network/dnsResolvers
- Both subnets must be in the same VNet as the resolver`,
  },
};

// ─────────────────────────────────────────────────────────
// TOOL: generate_hybrid_dns_config
// ─────────────────────────────────────────────────────────

server.tool(
  "generate_hybrid_dns_config",
  "Generate deployment configuration (Bicep, PowerShell, or Azure CLI) for Azure DNS Private Resolver hybrid DNS setup",
  {
    format: z
      .enum(["bicep", "powershell", "azcli"])
      .describe("Output format: bicep, powershell, or azcli"),
    resourceGroup: z
      .string()
      .default("rg-hybrid-dns")
      .describe("Azure resource group name"),
    location: z
      .string()
      .default("eastus")
      .describe("Azure region"),
    vnetName: z
      .string()
      .default("myHubVnet")
      .describe("Virtual network name"),
    vnetCidr: z
      .string()
      .default("10.10.0.0/16")
      .describe("VNet address space CIDR"),
    inboundSubnetCidr: z
      .string()
      .default("10.10.0.0/28")
      .describe("Inbound endpoint subnet CIDR (min /28)"),
    outboundSubnetCidr: z
      .string()
      .default("10.10.0.16/28")
      .describe("Outbound endpoint subnet CIDR (min /28)"),
    resolverName: z
      .string()
      .default("myPrivateResolver")
      .describe("DNS Private Resolver name"),
    privateZoneName: z
      .string()
      .default("azure.contoso.com")
      .describe("Private DNS zone name"),
    onPremDomain: z
      .string()
      .default("contoso.com")
      .describe("On-premises domain name"),
    onPremDnsIp: z
      .string()
      .default("10.100.0.2")
      .describe("On-premises DNS server IP"),
  },
  async (params) => {
    const config = {
      resourceGroup: params.resourceGroup,
      location: params.location,
      azureVnetName: params.vnetName,
      azureVnetCidr: params.vnetCidr,
      resolverSubnetCidr: params.inboundSubnetCidr,
      outboundSubnetCidr: params.outboundSubnetCidr,
      resolverName: params.resolverName,
      privateZoneName: params.privateZoneName,
      onpremDomain: params.onPremDomain,
      onpremDnsIp: params.onPremDnsIp,
    };

    let code;
    if (params.format === "bicep") {
      code = generateBicep(config);
    } else if (params.format === "powershell") {
      code = generatePowerShell(config);
    } else {
      code = generateAzCli(config);
    }

    return {
      content: [
        {
          type: "text",
          text: `# Azure DNS Private Resolver — ${params.format.toUpperCase()} Configuration\n\n\`\`\`${params.format === "azcli" ? "bash" : params.format}\n${code}\n\`\`\`\n\n**Next steps:**\n1. Deploy the Azure-side resources using the script above\n2. Configure on-premises conditional forwarders (use the \`generate_onprem_dns_config\` tool)\n3. Test resolution from both sides`,
        },
      ],
    };
  }
);

// ─────────────────────────────────────────────────────────
// TOOL: generate_onprem_dns_config
// ─────────────────────────────────────────────────────────

server.tool(
  "generate_onprem_dns_config",
  "Generate on-premises DNS server configuration (Windows DNS conditional forwarders) for hybrid DNS",
  {
    privateZoneName: z
      .string()
      .default("azure.contoso.com")
      .describe("Azure private DNS zone name to forward to"),
    inboundEndpointIp: z
      .string()
      .default("10.10.0.4")
      .describe("Azure DNS Private Resolver inbound endpoint IP"),
    onPremDnsIp: z
      .string()
      .default("10.100.0.2")
      .describe("On-premises DNS server IP"),
  },
  async (params) => {
    const script = `# On-Premises DNS Configuration — Windows DNS Server
# Run on your Domain Controller / DNS Server

# Add Conditional Forwarder
Add-DnsServerConditionalForwarderZone \`
    -Name "${params.privateZoneName}" \`
    -MasterServers ${params.inboundEndpointIp} \`
    -ReplicationScope "Forest"

# Verify
Get-DnsServerZone -Name "${params.privateZoneName}"

# Test resolution
Resolve-DnsName -Name "test.${params.privateZoneName}" -Server ${params.onPremDnsIp}`;

    return {
      content: [
        {
          type: "text",
          text: `# On-Premises DNS Configuration\n\n\`\`\`powershell\n${script}\n\`\`\`\n\nThis configures your on-prem DNS to forward queries for \`${params.privateZoneName}\` to the Azure DNS Private Resolver inbound endpoint at \`${params.inboundEndpointIp}\`.`,
        },
      ],
    };
  }
);

// ─────────────────────────────────────────────────────────
// TOOL: explain_dns_resolution_path
// ─────────────────────────────────────────────────────────

server.tool(
  "explain_dns_resolution_path",
  "Explain the DNS resolution path for a hybrid DNS query (Azure-to-OnPrem or OnPrem-to-Azure)",
  {
    direction: z
      .enum(["azure-to-onprem", "onprem-to-azure"])
      .describe("Direction of DNS resolution"),
    queryDomain: z
      .string()
      .describe("The domain being queried (e.g., test.azure.contoso.com)"),
    inboundEndpointIp: z
      .string()
      .default("10.10.0.4")
      .describe("Inbound endpoint IP"),
    onPremDnsIp: z
      .string()
      .default("10.100.0.2")
      .describe("On-premises DNS server IP"),
    connectionType: z
      .enum(["vpn", "expressroute"])
      .default("vpn")
      .describe("Network connection type"),
  },
  async (params) => {
    const conn = params.connectionType === "vpn" ? "VPN Gateway" : "ExpressRoute";

    let explanation;
    if (params.direction === "azure-to-onprem") {
      explanation = `## DNS Resolution: Azure → On-Premises

**Query:** \`${params.queryDomain}\`

### Resolution Steps:

1. **Azure VM** sends DNS query to Azure DNS (\`168.63.129.16\`)
2. **Azure DNS** checks private zones — no match found for on-prem domain
3. **DNS Private Resolver** outbound endpoint processes the query
4. **Forwarding Ruleset** matches the domain, forwards to \`${params.onPremDnsIp}\`
5. Query travels through **${conn}** to on-premises network
6. **On-premises DNS** (\`${params.onPremDnsIp}\`) resolves the record
7. Response returns via the same path back to the Azure VM

### Path Diagram:
\`\`\`
Azure VM → Azure DNS (168.63.129.16) → Outbound Endpoint → Forwarding Rule
  → ${conn} → On-Prem DNS (${params.onPremDnsIp}) → Response
\`\`\``;
    } else {
      explanation = `## DNS Resolution: On-Premises → Azure

**Query:** \`${params.queryDomain}\`

### Resolution Steps:

1. **On-premises client** queries local DNS server at \`${params.onPremDnsIp}\`
2. **DNS Server** matches conditional forwarder rule, forwards to \`${params.inboundEndpointIp}\`
3. Query travels through **${conn}** to Azure
4. **Inbound Endpoint** (\`${params.inboundEndpointIp}\`) receives the query
5. **Azure DNS** resolves from the linked Private DNS Zone
6. Response returns via the same path back to the on-premises client

### Path Diagram:
\`\`\`
On-Prem Client → DNS Server (${params.onPremDnsIp}) → Conditional Forwarder
  → ${conn} → Inbound Endpoint (${params.inboundEndpointIp}) → Private DNS Zone → Response
\`\`\``;
    }

    return {
      content: [{ type: "text", text: explanation }],
    };
  }
);

// ─────────────────────────────────────────────────────────
// TOOL: troubleshoot_hybrid_dns
// ─────────────────────────────────────────────────────────

server.tool(
  "troubleshoot_hybrid_dns",
  "Get troubleshooting steps for common hybrid DNS issues",
  {
    issue: z
      .enum([
        "azure-cannot-resolve-onprem",
        "onprem-cannot-resolve-azure",
        "intermittent-failures",
        "slow-resolution",
        "general",
      ])
      .describe("The type of issue to troubleshoot"),
  },
  async (params) => {
    const guides = {
      "azure-cannot-resolve-onprem": `## Troubleshooting: Azure Cannot Resolve On-Premises Domains

### Checklist:
1. **Verify Outbound Endpoint exists** and is in "Succeeded" provisioning state
2. **Check Forwarding Ruleset:**
   - Rule exists for the on-prem domain (with trailing dot)
   - Rule is set to "Enabled"
   - Destination IP matches your on-prem DNS server
   - Port is 53
3. **Verify VNet Link:** Forwarding ruleset must be linked to the VNet
4. **Check VPN/ExpressRoute:** Ensure connectivity between Azure and on-prem
5. **Verify On-Prem DNS:** Ensure the DNS server is accessible and responding on port 53
6. **Check NSGs:** No rules blocking UDP/TCP 53 on resolver subnets

### Test Commands (from Azure VM):
\`\`\`powershell
nslookup <record>.<onprem-domain> 168.63.129.16
Resolve-DnsName -Name "<record>.<onprem-domain>" -DnsOnly
\`\`\`

**Important:** Do NOT change VNet DNS settings to point to the inbound endpoint IP. Leave default Azure DNS settings.`,

      "onprem-cannot-resolve-azure": `## Troubleshooting: On-Premises Cannot Resolve Azure Private DNS Zones

### Checklist:
1. **Verify Inbound Endpoint exists** and note its IP address
2. **Check Conditional Forwarder** on on-prem DNS server:
   - Zone name matches Azure private DNS zone exactly
   - Master server IP matches inbound endpoint IP
3. **Verify VPN/ExpressRoute:** Ensure connectivity from on-prem to inbound endpoint IP
4. **Check Private DNS Zone:**
   - Zone exists with correct records
   - VNet link exists to the resolver's VNet
5. **Test connectivity:** Can on-prem ping the inbound endpoint IP?
6. **Check firewall rules:** UDP/TCP 53 must be allowed

### Test Commands (from on-prem):
\`\`\`powershell
nslookup test.azure.contoso.com <onprem-dns-ip>
Resolve-DnsName -Name "test.azure.contoso.com" -Server <onprem-dns-ip>
Test-NetConnection -ComputerName <inbound-endpoint-ip> -Port 53
\`\`\``,

      "intermittent-failures": `## Troubleshooting: Intermittent DNS Resolution Failures

### Common Causes:
1. **VPN instability** — Check VPN gateway health metrics
2. **DNS cache** — Stale cache entries can cause intermittent issues
3. **Subnet exhaustion** — /28 subnet may run out of IPs under heavy load
4. **Single endpoint** — No failover configured

### Recommended Actions:
1. Set up DNS failover with a second inbound endpoint in another region
2. Monitor VPN/ExpressRoute health via Azure Monitor
3. Check DNS resolver metrics for query volume and errors
4. Consider upgrading to larger subnets (/27 or /26)
5. Flush DNS caches: \`Clear-DnsClientCache\` / \`ipconfig /flushdns\``,

      "slow-resolution": `## Troubleshooting: Slow DNS Resolution

### Common Causes:
1. **Network latency** — High VPN/ER round-trip time
2. **DNS recursion** — Multiple hops in resolution chain
3. **Overloaded DNS server** — On-prem DNS server under heavy load

### Recommended Actions:
1. Check network latency between Azure and on-prem (should be < 30ms)
2. Reduce TTL values for frequently changing records
3. Enable DNS metrics in Azure Monitor to track query performance
4. Consider deploying resolver in a region closer to on-prem
5. Use \`Measure-Command { Resolve-DnsName ... }\` to benchmark resolution time`,

      general: `## Hybrid DNS Troubleshooting — General Guide

### Quick Diagnostic Steps:
1. **From Azure VM:**
   \`\`\`
   nslookup <onprem-record> 168.63.129.16
   \`\`\`
2. **From On-Prem:**
   \`\`\`
   nslookup <azure-private-record> <onprem-dns-ip>
   \`\`\`
3. **Check Azure resources:**
   \`\`\`
   az dns-resolver show --name <resolver> --resource-group <rg>
   az dns-resolver inbound-endpoint list --dns-resolver-name <resolver> --resource-group <rg>
   \`\`\`

### Common Issues & Fixes:
| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| NXDOMAIN | Missing VNet link | Add VNet link to zone/ruleset |
| Timeout | VPN/ER down | Check network connectivity |
| SERVFAIL | DNS server unreachable | Verify IP and port 53 access |
| Wrong IP | Stale cache | Flush DNS cache |`,
    };

    return {
      content: [{ type: "text", text: guides[params.issue] }],
    };
  }
);

// ─────────────────────────────────────────────────────────
// TOOL: get_hybrid_dns_info
// ─────────────────────────────────────────────────────────

server.tool(
  "get_hybrid_dns_info",
  "Get detailed information about Azure DNS Private Resolver hybrid DNS concepts, best practices, or architecture",
  {
    topic: z
      .enum(["overview", "bestPractices", "architecture"])
      .describe("The topic to get information about"),
  },
  async (params) => {
    const info = HYBRID_DNS_KNOWLEDGE[params.topic];
    return {
      content: [
        {
          type: "text",
          text: `# ${info.title}\n\n${info.content}`,
        },
      ],
    };
  }
);

// ─────────────────────────────────────────────────────────
// Bicep/PS/CLI generators (shared with web app)
// ─────────────────────────────────────────────────────────

function generateBicep(c) {
  return `targetScope = 'resourceGroup'
param location string = '${c.location}'
param vnetName string = '${c.azureVnetName}'
param vnetAddressPrefix string = '${c.azureVnetCidr}'
param inboundSubnetPrefix string = '${c.resolverSubnetCidr}'
param outboundSubnetPrefix string = '${c.outboundSubnetCidr}'
param resolverName string = '${c.resolverName}'
param privateZoneName string = '${c.privateZoneName}'
param onPremDnsIp string = '${c.onpremDnsIp}'
param onPremDomain string = '${c.onpremDomain}'

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: { addressPrefixes: [vnetAddressPrefix] }
    subnets: [
      { name: 'snet-dns-inbound', properties: { addressPrefix: inboundSubnetPrefix, delegations: [{ name: 'dns', properties: { serviceName: 'Microsoft.Network/dnsResolvers' } }] } }
      { name: 'snet-dns-outbound', properties: { addressPrefix: outboundSubnetPrefix, delegations: [{ name: 'dns', properties: { serviceName: 'Microsoft.Network/dnsResolvers' } }] } }
    ]
  }
}

resource dnsResolver 'Microsoft.Network/dnsResolvers@2022-07-01' = {
  name: resolverName
  location: location
  properties: { virtualNetwork: { id: vnet.id } }
}

resource inboundEndpoint 'Microsoft.Network/dnsResolvers/inboundEndpoints@2022-07-01' = {
  parent: dnsResolver
  name: 'inbound-endpoint'
  location: location
  properties: { ipConfigurations: [{ subnet: { id: vnet.properties.subnets[0].id }, privateIpAllocationMethod: 'Dynamic' }] }
}

resource outboundEndpoint 'Microsoft.Network/dnsResolvers/outboundEndpoints@2022-07-01' = {
  parent: dnsResolver
  name: 'outbound-endpoint'
  location: location
  properties: { subnet: { id: vnet.properties.subnets[1].id } }
}

resource ruleset 'Microsoft.Network/dnsForwardingRulesets@2022-07-01' = {
  name: '\${resolverName}-ruleset'
  location: location
  properties: { dnsResolverOutboundEndpoints: [{ id: outboundEndpoint.id }] }
}

resource rule 'Microsoft.Network/dnsForwardingRulesets/forwardingRules@2022-07-01' = {
  parent: ruleset
  name: 'rule-onprem'
  properties: { domainName: '\${onPremDomain}.', targetDnsServers: [{ ipAddress: onPremDnsIp, port: 53 }], forwardingRuleState: 'Enabled' }
}

resource rulesetLink 'Microsoft.Network/dnsForwardingRulesets/virtualNetworkLinks@2022-07-01' = {
  parent: ruleset
  name: '\${vnetName}-link'
  properties: { virtualNetwork: { id: vnet.id } }
}

resource zone 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: privateZoneName
  location: 'global'
}

resource zoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = {
  parent: zone
  name: '\${vnetName}-link'
  location: 'global'
  properties: { virtualNetwork: { id: vnet.id }, registrationEnabled: false }
}

output inboundIp string = inboundEndpoint.properties.ipConfigurations[0].privateIpAddress`;
}

function generatePowerShell(c) {
  return `$rg = "${c.resourceGroup}"; $loc = "${c.location}"
$vnetName = "${c.azureVnetName}"; $resolver = "${c.resolverName}"
New-AzResourceGroup -Name $rg -Location $loc
$inSub = New-AzVirtualNetworkSubnetConfig -Name snet-dns-inbound -AddressPrefix "${c.resolverSubnetCidr}" -Delegation (New-AzDelegation -Name dns -ServiceName Microsoft.Network/dnsResolvers)
$outSub = New-AzVirtualNetworkSubnetConfig -Name snet-dns-outbound -AddressPrefix "${c.outboundSubnetCidr}" -Delegation (New-AzDelegation -Name dns -ServiceName Microsoft.Network/dnsResolvers)
$vnet = New-AzVirtualNetwork -Name $vnetName -ResourceGroupName $rg -Location $loc -AddressPrefix "${c.azureVnetCidr}" -Subnet $inSub,$outSub
$r = New-AzDnsResolver -Name $resolver -ResourceGroupName $rg -Location $loc -VirtualNetworkId $vnet.Id
$inEp = New-AzDnsResolverInboundEndpoint -DnsResolverName $resolver -Name inbound-endpoint -ResourceGroupName $rg -Location $loc -IPConfiguration (New-AzDnsResolverIPConfigurationObject -PrivateIPAllocationMethod Dynamic -SubnetId $vnet.Subnets[0].Id)
$outEp = New-AzDnsResolverOutboundEndpoint -DnsResolverName $resolver -Name outbound-endpoint -ResourceGroupName $rg -Location $loc -SubnetId $vnet.Subnets[1].Id
$rs = New-AzDnsForwardingRuleset -Name "$resolver-ruleset" -ResourceGroupName $rg -Location $loc -DnsResolverOutboundEndpoint @(@{Id=$outEp.Id})
New-AzDnsForwardingRulesetForwardingRule -DnsForwardingRulesetName "$resolver-ruleset" -Name rule-onprem -ResourceGroupName $rg -DomainName "${c.onpremDomain}." -TargetDnsServer (New-AzDnsForwardingRulesetTargetDnsServerObject -IPAddress "${c.onpremDnsIp}" -Port 53) -ForwardingRuleState Enabled
New-AzDnsForwardingRulesetVirtualNetworkLink -DnsForwardingRulesetName "$resolver-ruleset" -Name "$vnetName-link" -ResourceGroupName $rg -VirtualNetworkId $vnet.Id
$zone = New-AzPrivateDnsZone -Name "${c.privateZoneName}" -ResourceGroupName $rg
New-AzPrivateDnsVirtualNetworkLink -ZoneName "${c.privateZoneName}" -Name "$vnetName-link" -ResourceGroupName $rg -VirtualNetworkId $vnet.Id
Write-Host "Inbound EP IP:" $inEp.IPConfigurations[0].PrivateIPAddress`;
}

function generateAzCli(c) {
  return `#!/bin/bash
RG="${c.resourceGroup}"; LOC="${c.location}"; VNET="${c.azureVnetName}"; RES="${c.resolverName}"
az group create -n $RG -l $LOC
az network vnet create -n $VNET -g $RG -l $LOC --address-prefix ${c.azureVnetCidr}
az network vnet subnet create -n snet-dns-inbound --vnet-name $VNET -g $RG --address-prefix ${c.resolverSubnetCidr} --delegations Microsoft.Network/dnsResolvers
az network vnet subnet create -n snet-dns-outbound --vnet-name $VNET -g $RG --address-prefix ${c.outboundSubnetCidr} --delegations Microsoft.Network/dnsResolvers
az dns-resolver create -n $RES -g $RG -l $LOC --id $(az network vnet show -n $VNET -g $RG --query id -o tsv)
IN_SUB=$(az network vnet subnet show -n snet-dns-inbound --vnet-name $VNET -g $RG --query id -o tsv)
az dns-resolver inbound-endpoint create --dns-resolver-name $RES -n inbound-endpoint -g $RG -l $LOC --ip-configurations "[{private-ip-allocation-method:Dynamic,subnet:{id:$IN_SUB}}]"
OUT_SUB=$(az network vnet subnet show -n snet-dns-outbound --vnet-name $VNET -g $RG --query id -o tsv)
az dns-resolver outbound-endpoint create --dns-resolver-name $RES -n outbound-endpoint -g $RG -l $LOC --id $OUT_SUB
OUT_EP=$(az dns-resolver outbound-endpoint show --dns-resolver-name $RES -n outbound-endpoint -g $RG --query id -o tsv)
az dns-resolver forwarding-ruleset create -n $RES-ruleset -g $RG -l $LOC --outbound-endpoints "[{id:$OUT_EP}]"
az dns-resolver forwarding-rule create --ruleset-name $RES-ruleset -n rule-onprem -g $RG --domain-name "${c.onpremDomain}." --target-dns-servers "[{ip-address:${c.onpremDnsIp},port:53}]" --forwarding-rule-state Enabled
VNET_ID=$(az network vnet show -n $VNET -g $RG --query id -o tsv)
az dns-resolver forwarding-ruleset vnet-link create --ruleset-name $RES-ruleset -n $VNET-link -g $RG --id $VNET_ID
az network private-dns zone create -n ${c.privateZoneName} -g $RG
az network private-dns link vnet create --zone-name ${c.privateZoneName} -n $VNET-link -g $RG --virtual-network $VNET_ID --registration-enabled false
echo "Done! Get inbound IP: az dns-resolver inbound-endpoint show --dns-resolver-name $RES -n inbound-endpoint -g $RG --query ipConfigurations[0].privateIpAddress -o tsv"`;
}

// ─────────────────────────────────────────────────────────
// Start the server
// ─────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Hybrid DNS Architect MCP Server running on stdio");
}

main().catch(console.error);
