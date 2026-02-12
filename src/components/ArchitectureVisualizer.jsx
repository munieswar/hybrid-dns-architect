import React, { useState, useEffect } from 'react';

// Animated packet dot component
function AnimatedPacket({ path, color, delay = 0, duration = 3 }) {
  return (
    <circle r="4" fill={color} opacity="0.9">
      <animateMotion
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={path}
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
      />
      <animate
        attributeName="r"
        values="3;5;3"
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
      />
    </circle>
  );
}

// Glowing connection line
function ConnectionLine({ x1, y1, x2, y2, color = '#3b82f6', dashed = false, label }) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth="2"
        strokeDasharray={dashed ? '6 4' : 'none'}
        opacity="0.4"
      />
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth="1"
        opacity="0.8"
        filter="url(#glow)"
      />
      {label && (
        <text x={midX} y={midY - 8} textAnchor="middle" fill={color} fontSize="10" opacity="0.7">
          {label}
        </text>
      )}
    </g>
  );
}

// Resource box component
function ResourceBox({ x, y, width, height, title, subtitle, icon, color, glowColor, onClick, highlighted }) {
  return (
    <g
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      className="transition-all duration-300"
    >
      {/* Glow effect */}
      {highlighted && (
        <rect
          x={x - 4} y={y - 4}
          width={width + 8} height={height + 8}
          rx="14" fill="none" stroke={glowColor || color} strokeWidth="2"
          opacity="0.5"
        >
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Background */}
      <rect
        x={x} y={y} width={width} height={height} rx="10"
        fill={`${color}15`} stroke={color} strokeWidth="1.5" opacity="0.9"
      />

      {/* Icon */}
      <text x={x + 14} y={y + height / 2 + 1} fontSize="18" dominantBaseline="middle">
        {icon}
      </text>

      {/* Title */}
      <text x={x + 38} y={y + height / 2 - 5} fill="white" fontSize="12" fontWeight="600">
        {title}
      </text>

      {/* Subtitle */}
      {subtitle && (
        <text x={x + 38} y={y + height / 2 + 10} fill={color} fontSize="10" opacity="0.8">
          {subtitle}
        </text>
      )}
    </g>
  );
}

// Zone boundary
function ZoneBoundary({ x, y, width, height, label, color, bgColor }) {
  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height} rx="16"
        fill={bgColor || `${color}08`}
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="8 4"
        opacity="0.6"
      />
      <rect
        x={x + 12} y={y - 10}
        width={label.length * 8 + 16} height="20"
        rx="6" fill="#111827" stroke={color} strokeWidth="1"
      />
      <text x={x + 20} y={y + 4} fill={color} fontSize="11" fontWeight="600">
        {label}
      </text>
    </g>
  );
}

export default function ArchitectureVisualizer({ config }) {
  const [activeFlow, setActiveFlow] = useState(null); // 'azure-to-onprem' | 'onprem-to-azure' | null
  const [hoveredComponent, setHoveredComponent] = useState(null);

  // Layout constants
  const svgWidth = 900;
  const svgHeight = 560;

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Hybrid DNS Architecture
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFlow(activeFlow === 'azure-to-onprem' ? null : 'azure-to-onprem')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFlow === 'azure-to-onprem'
                ? 'bg-azure-600 text-white shadow-lg shadow-azure-600/25'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            🔵 Azure → On-Prem
          </button>
          <button
            onClick={() => setActiveFlow(activeFlow === 'onprem-to-azure' ? null : 'onprem-to-azure')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFlow === 'onprem-to-azure'
                ? 'bg-onprem-600 text-white shadow-lg shadow-onprem-600/25'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            🟢 On-Prem → Azure
          </button>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: '560px' }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="vpnGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        {/* ===== AZURE ZONE ===== */}
        <ZoneBoundary
          x={20} y={30} width={420} height={500}
          label="☁️ Azure Cloud" color="#3b82f6" bgColor="rgba(59,130,246,0.03)"
        />

        {/* Virtual Network boundary */}
        <ZoneBoundary
          x={40} y={70} width={380} height={200}
          label={`VNet: ${config.azureVnetName} (${config.azureVnetCidr})`}
          color="#60a5fa"
        />

        {/* DNS Private Resolver */}
        <ResourceBox
          x={60} y={110} width={160} height={55}
          title="DNS Private Resolver"
          subtitle={config.resolverName}
          icon="🛡️" color="#a855f7" glowColor="#a855f7"
          highlighted={activeFlow !== null}
        />

        {/* Inbound Endpoint */}
        <ResourceBox
          x={240} y={95} width={160} height={45}
          title="Inbound Endpoint"
          subtitle={config.inboundEndpointIp}
          icon="📥" color="#3b82f6"
          highlighted={activeFlow === 'onprem-to-azure'}
        />

        {/* Outbound Endpoint */}
        <ResourceBox
          x={240} y={155} width={160} height={45}
          title="Outbound Endpoint"
          subtitle={config.outboundSubnetCidr}
          icon="📤" color="#f59e0b"
          highlighted={activeFlow === 'azure-to-onprem'}
        />

        {/* Forwarding Ruleset */}
        <ResourceBox
          x={60} y={210} width={160} height={45}
          title="Forwarding Ruleset"
          subtitle={`→ ${config.onpremDomain}`}
          icon="📋" color="#f59e0b"
          highlighted={activeFlow === 'azure-to-onprem'}
        />

        {/* Azure DNS */}
        <ResourceBox
          x={60} y={310} width={170} height={50}
          title="Azure DNS"
          subtitle="168.63.129.16"
          icon="🌐" color="#3b82f6"
          highlighted={activeFlow === 'azure-to-onprem'}
        />

        {/* Private DNS Zone */}
        <ResourceBox
          x={250} y={310} width={170} height={50}
          title="Private DNS Zone"
          subtitle={config.privateZoneName}
          icon="🔒" color="#8b5cf6"
          highlighted={activeFlow === 'onprem-to-azure'}
        />

        {/* Azure VM */}
        <ResourceBox
          x={120} y={400} width={160} height={50}
          title="Azure VM"
          subtitle="DNS Client"
          icon="🖥️" color="#06b6d4"
          highlighted={activeFlow === 'azure-to-onprem'}
        />

        {/* ===== VPN / EXPRESSROUTE ===== */}
        {/* Connection tunnel */}
        <rect x={440} y={170} width={30} height={200} rx="6"
          fill="url(#vpnGradient)" opacity="0.15"
        />
        <text x={455} y={165} textAnchor="middle" fill="#a855f7" fontSize="10" fontWeight="600">
          {config.connectionType === 'vpn' ? 'VPN' : 'ER'}
        </text>
        <text x={455} y={270} textAnchor="middle" fill="white" fontSize="20" opacity="0.5"
          style={{ writingMode: 'tb' }}
        >
          ⋮⋮⋮
        </text>

        {/* ===== ON-PREMISES ZONE ===== */}
        <ZoneBoundary
          x={480} y={30} width={400} height={500}
          label="🏢 On-Premises" color="#22c55e" bgColor="rgba(34,197,94,0.03)"
        />

        {/* On-prem Network */}
        <ZoneBoundary
          x={500} y={70} width={360} height={200}
          label={`Network: ${config.onpremNetworkCidr}`}
          color="#4ade80"
        />

        {/* On-prem DNS Server */}
        <ResourceBox
          x={530} y={110} width={170} height={55}
          title="DNS Server"
          subtitle={config.onpremDnsIp}
          icon="🖧" color="#22c55e"
          highlighted={activeFlow !== null}
        />

        {/* Conditional Forwarder */}
        <ResourceBox
          x={530} y={195} width={170} height={45}
          title="Conditional Forwarder"
          subtitle={`${config.privateZoneName} → ${config.inboundEndpointIp}`}
          icon="↪️" color="#4ade80"
          highlighted={activeFlow === 'onprem-to-azure'}
        />

        {/* On-prem resources */}
        <ResourceBox
          x={720} y={110} width={130} height={55}
          title="AD / DNS Zone"
          subtitle={config.onpremDomain}
          icon="📁" color="#15803d"
        />

        {/* On-prem Clients */}
        <ResourceBox
          x={580} y={400} width={160} height={50}
          title="On-Prem Client"
          subtitle="DNS Client"
          icon="💻" color="#34d399"
          highlighted={activeFlow === 'onprem-to-azure'}
        />

        {/* ===== CONNECTION LINES ===== */}

        {/* Azure VM → Azure DNS */}
        <ConnectionLine x1={200} y1={400} x2={145} y2={360} color="#06b6d4" />

        {/* Azure DNS → Resolver */}
        <ConnectionLine x1={145} y1={310} x2={140} y2={165} color="#3b82f6" />

        {/* Resolver → Inbound Endpoint */}
        <ConnectionLine x1={220} y1={127} x2={240} y2={117} color="#a855f7" />

        {/* Resolver → Outbound Endpoint */}
        <ConnectionLine x1={220} y1={145} x2={240} y2={170} color="#a855f7" />

        {/* Outbound → Forwarding Ruleset */}
        <ConnectionLine x1={300} y1={200} x2={220} y2={215} color="#f59e0b" dashed />

        {/* VPN/ER connections */}
        <ConnectionLine x1={400} y1={177} x2={440} y2={220} color="#a855f7" dashed />
        <ConnectionLine x1={470} y1={260} x2={530} y2={137} color="#a855f7" dashed />

        {/* Inbound Endpoint ↔ Private DNS Zone */}
        <ConnectionLine x1={320} y1={140} x2={335} y2={310} color="#8b5cf6" dashed />

        {/* On-prem DNS → Conditional Forwarder */}
        <ConnectionLine x1={615} y1={165} x2={615} y2={195} color="#4ade80" />

        {/* On-prem DNS → AD Zone */}
        <ConnectionLine x1={700} y1={137} x2={720} y2={137} color="#15803d" />

        {/* On-prem Client → DNS Server */}
        <ConnectionLine x1={660} y1={400} x2={615} y2={165} color="#34d399" />

        {/* ===== ANIMATED FLOW PACKETS ===== */}

        {activeFlow === 'azure-to-onprem' && (
          <>
            {/* Azure VM → DNS → Resolver → Outbound → VPN → On-prem DNS */}
            <AnimatedPacket
              path="M 200,425 L 145,335 L 140,140 L 300,177 L 440,240 L 530,137"
              color="#3b82f6" delay={0} duration={4}
            />
            <AnimatedPacket
              path="M 200,425 L 145,335 L 140,140 L 300,177 L 440,240 L 530,137"
              color="#60a5fa" delay={1.3} duration={4}
            />
            <AnimatedPacket
              path="M 200,425 L 145,335 L 140,140 L 300,177 L 440,240 L 530,137"
              color="#93c5fd" delay={2.6} duration={4}
            />
          </>
        )}

        {activeFlow === 'onprem-to-azure' && (
          <>
            {/* On-prem Client → DNS → Conditional Forwarder → VPN → Inbound → Private Zone */}
            <AnimatedPacket
              path="M 660,425 L 615,165 L 615,217 L 470,240 L 440,220 L 320,117 L 335,335"
              color="#22c55e" delay={0} duration={4}
            />
            <AnimatedPacket
              path="M 660,425 L 615,165 L 615,217 L 470,240 L 440,220 L 320,117 L 335,335"
              color="#4ade80" delay={1.3} duration={4}
            />
            <AnimatedPacket
              path="M 660,425 L 615,165 L 615,217 L 470,240 L 440,220 L 320,117 L 335,335"
              color="#86efac" delay={2.6} duration={4}
            />
          </>
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-azure-500" /> Azure Cloud
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-onprem-500" /> On-Premises
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-500" /> DNS Private Resolver
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" /> Forwarding Rules
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-cyan-500" /> Clients
        </span>
      </div>
    </div>
  );
}
