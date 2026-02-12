import React, { useState } from 'react';
import Header from './components/Header.jsx';
import ArchitectureVisualizer from './components/ArchitectureVisualizer.jsx';
import ConfigGenerator from './components/ConfigGenerator.jsx';
import DnsPathTracer from './components/DnsPathTracer.jsx';
import ConfigForm from './components/ConfigForm.jsx';

const TABS = [
  { id: 'visualizer', label: 'Architecture Visualizer', icon: '🏗️' },
  { id: 'tracer', label: 'DNS Path Tracer', icon: '🔍' },
  { id: 'generator', label: 'Config Generator', icon: '⚙️' },
];

const DEFAULT_CONFIG = {
  // Azure side
  azureVnetName: 'myHubVnet',
  azureVnetCidr: '10.10.0.0/16',
  resolverSubnetCidr: '10.10.0.0/28',
  outboundSubnetCidr: '10.10.0.16/28',
  inboundEndpointIp: '10.10.0.4',
  privateZoneName: 'azure.contoso.com',
  resolverName: 'myPrivateResolver',
  resourceGroup: 'rg-hybrid-dns',
  location: 'eastus',

  // On-premises side
  onpremDomain: 'contoso.com',
  onpremDnsIp: '10.100.0.2',
  onpremNetworkCidr: '10.100.0.0/16',

  // Connection
  connectionType: 'vpn', // 'vpn' or 'expressroute'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('visualizer');
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-[1800px] mx-auto w-full">
        {/* Sidebar config panel */}
        <aside className="lg:w-80 shrink-0">
          <ConfigForm config={config} updateConfig={updateConfig} />
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <nav className="flex gap-1 mb-4 glass rounded-xl p-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-azure-600 text-white shadow-lg shadow-azure-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <div className="flex-1 animate-fade-in">
            {activeTab === 'visualizer' && <ArchitectureVisualizer config={config} />}
            {activeTab === 'tracer' && <DnsPathTracer config={config} />}
            {activeTab === 'generator' && <ConfigGenerator config={config} />}
          </div>
        </main>
      </div>
    </div>
  );
}
