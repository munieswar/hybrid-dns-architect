import React, { useState, useEffect } from 'react';

const SCENARIOS = [
  {
    id: 'azure-to-onprem',
    label: 'Azure VM resolves on-prem domain',
    query: 'testdns.contoso.com',
    direction: 'azure-to-onprem',
  },
  {
    id: 'onprem-to-azure',
    label: 'On-prem client resolves Azure private zone',
    query: 'test.azure.contoso.com',
    direction: 'onprem-to-azure',
  },
];

function buildSteps(config, scenario) {
  if (scenario.direction === 'azure-to-onprem') {
    return [
      {
        id: 1,
        title: 'DNS Query Initiated',
        description: `Azure VM sends DNS query for "${scenario.query}" to Azure DNS (168.63.129.16)`,
        icon: '🖥️',
        color: 'cyan',
        component: 'Azure VM',
      },
      {
        id: 2,
        title: 'Azure DNS Receives Query',
        description: `Azure DNS checks if "${scenario.query}" matches any private zone. No match for "${config.onpremDomain}" — forwards to Private Resolver.`,
        icon: '🌐',
        color: 'blue',
        component: 'Azure DNS',
      },
      {
        id: 3,
        title: 'Outbound Endpoint Activated',
        description: `DNS Private Resolver "${config.resolverName}" uses outbound endpoint to process the query.`,
        icon: '📤',
        color: 'amber',
        component: 'Outbound Endpoint',
      },
      {
        id: 4,
        title: 'Forwarding Ruleset Matched',
        description: `Forwarding rule for "${config.onpremDomain}" matches. Query forwarded to on-premises DNS at ${config.onpremDnsIp}.`,
        icon: '📋',
        color: 'amber',
        component: 'Forwarding Ruleset',
      },
      {
        id: 5,
        title: `${config.connectionType === 'vpn' ? 'VPN' : 'ExpressRoute'} Transit`,
        description: `Query traverses the ${config.connectionType === 'vpn' ? 'VPN tunnel' : 'ExpressRoute circuit'} to the on-premises network.`,
        icon: '🔗',
        color: 'purple',
        component: config.connectionType === 'vpn' ? 'VPN Gateway' : 'ExpressRoute',
      },
      {
        id: 6,
        title: 'On-Premises DNS Resolves',
        description: `On-premises DNS server at ${config.onpremDnsIp} resolves "${scenario.query}" from its local zone "${config.onpremDomain}".`,
        icon: '🖧',
        color: 'green',
        component: 'On-Prem DNS',
      },
      {
        id: 7,
        title: 'Response Returned',
        description: `Answer flows back: On-Prem DNS → ${config.connectionType === 'vpn' ? 'VPN' : 'ER'} → Outbound Endpoint → Azure DNS → Azure VM. Resolution complete! ✅`,
        icon: '✅',
        color: 'green',
        component: 'Complete',
      },
    ];
  }

  // onprem-to-azure
  return [
    {
      id: 1,
      title: 'DNS Query Initiated',
      description: `On-premises client sends DNS query for "${scenario.query}" to local DNS server at ${config.onpremDnsIp}.`,
      icon: '💻',
      color: 'green',
      component: 'On-Prem Client',
    },
    {
      id: 2,
      title: 'Conditional Forwarder Matched',
      description: `DNS server at ${config.onpremDnsIp} has a conditional forwarder for "${config.privateZoneName}". Query forwarded to ${config.inboundEndpointIp}.`,
      icon: '↪️',
      color: 'green',
      component: 'Conditional Forwarder',
    },
    {
      id: 3,
      title: `${config.connectionType === 'vpn' ? 'VPN' : 'ExpressRoute'} Transit`,
      description: `Query traverses the ${config.connectionType === 'vpn' ? 'VPN tunnel' : 'ExpressRoute circuit'} to Azure.`,
      icon: '🔗',
      color: 'purple',
      component: config.connectionType === 'vpn' ? 'VPN Gateway' : 'ExpressRoute',
    },
    {
      id: 4,
      title: 'Inbound Endpoint Receives Query',
      description: `DNS Private Resolver inbound endpoint at ${config.inboundEndpointIp} receives the query for "${scenario.query}".`,
      icon: '📥',
      color: 'blue',
      component: 'Inbound Endpoint',
    },
    {
      id: 5,
      title: 'Private DNS Zone Resolves',
      description: `Azure DNS resolves "${scenario.query}" from private zone "${config.privateZoneName}" linked to VNet "${config.azureVnetName}".`,
      icon: '🔒',
      color: 'purple',
      component: 'Private DNS Zone',
    },
    {
      id: 6,
      title: 'Response Returned',
      description: `Answer flows back: Private Zone → Inbound Endpoint → ${config.connectionType === 'vpn' ? 'VPN' : 'ER'} → On-Prem DNS → Client. Resolution complete! ✅`,
      icon: '✅',
      color: 'green',
      component: 'Complete',
    },
  ];
}

const COLOR_MAP = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', dot: 'bg-cyan-500' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-500' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', dot: 'bg-green-500' },
};

export default function DnsPathTracer({ config }) {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = buildSteps(config, selectedScenario);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return;
    if (activeStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => setActiveStep(prev => prev + 1), 1200);
    return () => clearTimeout(timer);
  }, [isPlaying, activeStep, steps.length]);

  const handlePlay = () => {
    setActiveStep(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setActiveStep(-1);
    setIsPlaying(false);
  };

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">DNS Resolution Path Tracer</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-azure-600 text-white hover:bg-azure-500 disabled:opacity-50 transition-all shadow-lg shadow-azure-600/25"
          >
            ▶ Trace Path
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-400 hover:text-white transition-all"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Scenario selector */}
      <div className="flex gap-3 mb-6">
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => { setSelectedScenario(s); handleReset(); }}
            className={`flex-1 px-4 py-3 rounded-xl text-sm text-left transition-all border ${
              selectedScenario.id === s.id
                ? s.direction === 'azure-to-onprem'
                  ? 'bg-azure-900/30 border-azure-500/30 text-azure-300'
                  : 'bg-onprem-900/30 border-onprem-500/30 text-onprem-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            <div className="font-medium">{s.label}</div>
            <div className="text-xs opacity-70 mt-1 font-mono">{s.query}</div>
          </button>
        ))}
      </div>

      {/* Steps timeline */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const c = COLOR_MAP[step.color];
          const isActive = idx <= activeStep;
          const isCurrent = idx === activeStep;

          return (
            <div
              key={step.id}
              className={`flex gap-4 items-start transition-all duration-500 ${
                isActive ? 'opacity-100' : 'opacity-30'
              }`}
            >
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center w-8 shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all duration-300 ${
                  isCurrent
                    ? `${c.bg} ${c.border} ${c.text} scale-110 shadow-lg`
                    : isActive
                      ? `${c.bg} ${c.border} ${c.text}`
                      : 'bg-white/5 border-white/10 text-gray-600'
                }`}>
                  {step.icon}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-0.5 h-8 transition-all duration-500 ${
                    isActive ? c.dot : 'bg-white/10'
                  }`} style={{ opacity: isActive ? 0.4 : 0.2 }} />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-2 rounded-xl px-4 py-3 transition-all duration-300 ${
                isCurrent ? `${c.bg} border ${c.border}` : ''
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isActive ? c.text : 'text-gray-500'}`}>
                    Step {step.id}: {step.title}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.text} border ${c.border}`}>
                    {step.component}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
