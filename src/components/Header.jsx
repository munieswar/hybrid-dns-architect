import React from 'react';

export default function Header() {
  return (
    <header className="border-b border-white/10 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-azure-500 to-purple-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-azure-500/25">
            ⬡
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-azure-400 to-purple-400 bg-clip-text text-transparent">
              Hybrid DNS Architect
            </h1>
            <p className="text-xs text-gray-500">Azure DNS Private Resolver Visualizer & Config Generator</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://learn.microsoft.com/en-us/azure/dns/private-resolver-hybrid-dns"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-azure-400 transition-colors flex items-center gap-1"
          >
            📖 Azure Docs
          </a>
          <span className="text-xs px-2 py-1 rounded-full bg-azure-900/50 text-azure-300 border border-azure-700/50">
            MCP Enabled
          </span>
        </div>
      </div>
    </header>
  );
}
