import React, { useState, useEffect } from 'react';
import { getExplorerAddressUrl, truncateAddress } from '../lib/contracts';

interface Agent {
  agentId: string;
  name: string;
  skills: string[];
  reputationScore: number;
  jobsCompleted: number;
  totalEarned: string;
  walletAddress: string;
}

interface AgentMarketplaceProps {
  agents: Agent[];
  isLoading: boolean;
}

export default function AgentMarketplace({ agents, isLoading }: AgentMarketplaceProps) {
  const [activeAgentName, setActiveAgentName] = useState<string | null>(null);

  // Poll window.paymentsFeed to check which agent is currently active/being paid
  useEffect(() => {
    const checkActiveAgent = () => {
      if (typeof window !== 'undefined') {
        const feed = (window as any).paymentsFeed || [];
        const requiredPayment = feed.find((p: any) => p.status === 'required');
        if (requiredPayment) {
          setActiveAgentName(requiredPayment.agentName);
        } else {
          setActiveAgentName(null);
        }
      }
    };

    checkActiveAgent();
    const timer = setInterval(checkActiveAgent, 250);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between border-b-4 border-black pb-3">
        <h2 className="text-2xl font-mono font-bold uppercase tracking-wider text-black">
          ERC-8004 AGENT REGISTRY
        </h2>
        <span className="text-xs font-mono font-bold px-3 py-1 bg-[#ffe500] text-black border-2 border-black shadow-[2px_2px_0px_#000000] uppercase tracking-wider">
          AVALANCHE FUJI
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="h-64 bg-white border-3 border-black shadow-[6px_6px_0px_#000000] animate-pulse rounded-none" 
            />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 text-black font-mono border-3 border-black bg-white shadow-[6px_6px_0px_#000000] font-bold uppercase">
          No registered agents found. Ensure scripts/register-agents.js was run.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {agents.map((agent) => {
            const isResearch = agent.name.toLowerCase().includes('research');
            const isRisk = agent.name.toLowerCase().includes('risk');
            const isYield = agent.name.toLowerCase().includes('yield');

            // Set different card background colors based on agent type
            let cardBg = '#ffffff';
            if (isResearch) cardBg = '#fff4e0';
            else if (isRisk) cardBg = '#e8f4ff';
            else if (isYield) cardBg = '#f0ffe8';

            // Check if this agent is active/being paid
            const isActive = activeAgentName === agent.name;

            // Reputation color
            let repColor = 'bg-[#00c853]'; // Success green
            if (agent.reputationScore < 75) {
              repColor = 'bg-[#e84142]'; // Red
            } else if (agent.reputationScore >= 75 && agent.reputationScore <= 90) {
              repColor = 'bg-[#ffaa00]'; // Amber
            }

            return (
              <div 
                key={agent.agentId} 
                className={`border-3 p-6 flex flex-col justify-between transition-all rounded-none ${
                  isActive 
                    ? 'border-[#e84142] shadow-[6px_6px_0px_#e84142]' 
                    : 'border-black shadow-[6px_6px_0px_#000000]'
                }`}
                style={{ backgroundColor: cardBg }}
              >
                <div>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div>
                      <h3 className="font-sans font-bold text-xl text-black leading-tight">
                        {agent.name}
                      </h3>
                      <a 
                        href={getExplorerAddressUrl(agent.walletAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#0057ff] font-mono hover:underline inline-block mt-1 font-bold"
                      >
                        {truncateAddress(agent.walletAddress)}
                      </a>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-black text-white rounded-none border border-black uppercase shrink-0">
                      [ID: {agent.agentId}]
                    </span>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {agent.skills.map((skill) => (
                      <span 
                        key={skill} 
                        className="text-[10px] px-2.5 py-1 bg-white border-2 border-black text-black font-mono font-bold uppercase shadow-[2px_2px_0px_#000000]"
                      >
                        [{skill.toUpperCase()}]
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Reputation */}
                  <div className="border-t-2 border-black pt-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                        REPUTATION SCORE
                      </span>
                      <span className="text-4xl font-mono font-bold text-black">
                        {agent.reputationScore}%
                      </span>
                    </div>
                    {/* Reputation Bar */}
                    <div className="w-full bg-white h-3.5 border border-black rounded-none relative overflow-hidden">
                      <div 
                        className={`h-full border-r border-black ${repColor} transition-all duration-1000 ease-out`}
                        style={{ width: `${agent.reputationScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Footer */}
                  <div className="border-t border-black/20 pt-3 flex justify-between items-center text-xs font-mono font-bold text-black uppercase">
                    <span>JOBS: {agent.jobsCompleted}</span>
                    <span>EARNED: {agent.totalEarned}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
