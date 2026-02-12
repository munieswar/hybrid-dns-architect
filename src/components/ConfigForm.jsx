import React from 'react';

const FIELDS = [
  { section: 'Azure Configuration', fields: [
    { key: 'resourceGroup', label: 'Resource Group', placeholder: 'rg-hybrid-dns' },
    { key: 'location', label: 'Location', placeholder: 'eastus' },
    { key: 'azureVnetName', label: 'VNet Name', placeholder: 'myHubVnet' },
    { key: 'azureVnetCidr', label: 'VNet CIDR', placeholder: '10.10.0.0/16' },
    { key: 'resolverSubnetCidr', label: 'Inbound Subnet CIDR', placeholder: '10.10.0.0/28' },
    { key: 'outboundSubnetCidr', label: 'Outbound Subnet CIDR', placeholder: '10.10.0.16/28' },
    { key: 'inboundEndpointIp', label: 'Inbound Endpoint IP', placeholder: '10.10.0.4' },
    { key: 'resolverName', label: 'Resolver Name', placeholder: 'myPrivateResolver' },
    { key: 'privateZoneName', label: 'Private Zone', placeholder: 'azure.contoso.com' },
  ]},
  { section: 'On-Premises Configuration', fields: [
    { key: 'onpremDomain', label: 'On-Prem Domain', placeholder: 'contoso.com' },
    { key: 'onpremDnsIp', label: 'On-Prem DNS IP', placeholder: '10.100.0.2' },
    { key: 'onpremNetworkCidr', label: 'On-Prem CIDR', placeholder: '10.100.0.0/16' },
  ]},
  { section: 'Connectivity', fields: [
    { key: 'connectionType', label: 'Connection Type', type: 'select', options: [
      { value: 'vpn', label: 'VPN Gateway' },
      { value: 'expressroute', label: 'ExpressRoute' },
    ]},
  ]},
];

export default function ConfigForm({ config, updateConfig }) {
  return (
    <div className="glass rounded-2xl p-4 space-y-4 h-fit sticky top-20">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-azure-500 animate-pulse" />
        Configuration
      </h2>

      {FIELDS.map(section => (
        <div key={section.section}>
          <h3 className="text-xs font-medium text-gray-500 mb-2 mt-3">{section.section}</h3>
          <div className="space-y-2">
            {section.fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={config[field.key]}
                    onChange={e => updateConfig(field.key, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-azure-500 focus:outline-none transition-colors"
                  >
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-gray-900">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={config[field.key]}
                    onChange={e => updateConfig(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-azure-500 focus:outline-none transition-colors"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
