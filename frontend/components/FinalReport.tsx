import React from 'react';

interface ProtocolYield {
  name: string;
  tvl: string;
  apy: string;
  chain: string;
}

interface RiskAssessment {
  protocol: string;
  riskScore: number;
  factors: string[];
}

interface TopOpportunity {
  protocol: string;
  netAPY: string;
  recommendation: string;
}

interface FinalReportData {
  timestamp: string;
  prompt: string;
  research: {
    protocols: ProtocolYield[];
    timestamp: string;
    agentId: string;
  };
  risk: {
    riskAssessments: RiskAssessment[];
    overallRisk: "LOW" | "MEDIUM" | "HIGH";
    agentId: string;
  };
  yield: {
    topOpportunities: TopOpportunity[];
    summary: string;
    agentId: string;
  };
  summary: string;
}

interface FinalReportProps {
  report: FinalReportData | null;
}

export default function FinalReport({ report }: FinalReportProps) {
  if (!report) return null;

  return (
    <div className="w-full space-y-8">
      {/* Header Section */}
      <div className="border-b-4 border-black pb-3">
        <h2 className="text-2xl font-mono font-bold uppercase tracking-wider text-black">
          ▣ COMPILED RISK-ADJUSTED YIELD REPORT
        </h2>
        <p className="text-[11px] text-black/60 font-mono font-bold mt-1 uppercase">
          COMPILED AT: {new Date(report.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Executive Summary Card */}
      <div className="bg-white border-3 border-black border-l-[6px] border-l-[#e84142] shadow-[6px_6px_0px_#000000] p-6 rounded-none">
        <h3 className="text-xs font-mono font-bold text-[#e84142] uppercase tracking-wider mb-2">
          EXECUTIVE SUMMARY
        </h3>
        <p className="text-black text-base leading-relaxed font-sans">{report.summary}</p>
      </div>

      {/* 3 Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MAX APY Card */}
        <div className="bg-white border-3 border-black shadow-[4px_4px_0px_#000000] p-5 rounded-none flex flex-col justify-between">
          <span className="text-4xl font-mono font-bold text-[#00c853] block">12.8%</span>
          <span className="text-xs font-mono font-bold text-black uppercase tracking-wider mt-2 block">
            MAX APY OPPORTUNITY
          </span>
        </div>

        {/* RISK PROFILE Card */}
        <div className="bg-white border-3 border-black shadow-[4px_4px_0px_#000000] p-5 rounded-none flex flex-col justify-between">
          <span className="text-4xl font-mono font-bold text-[#ffaa00] block">
            {report.risk.overallRisk}
          </span>
          <span className="text-xs font-mono font-bold text-black uppercase tracking-wider mt-2 block">
            OVERALL RISK PROFILE
          </span>
        </div>

        {/* PROTOCOLS Card */}
        <div className="bg-white border-3 border-black shadow-[4px_4px_0px_#000000] p-5 rounded-none flex flex-col justify-between">
          <span className="text-4xl font-mono font-bold text-[#0057ff] block">3 PROTOCOLS</span>
          <span className="text-xs font-mono font-bold text-black uppercase tracking-wider mt-2 block">
            OPTIMIZED ALLOCATIONS
          </span>
        </div>
      </div>

      {/* Protocol Allocation breakdown */}
      <div className="space-y-4">
        <h3 className="text-base font-mono font-bold text-black uppercase tracking-wider mb-3">
          ▣ ALLOCATION BREAKDOWN & STRATEGY
        </h3>
        <div className="grid grid-cols-1 gap-6">
          {report.yield.topOpportunities.map((opportunity, idx) => {
            const riskData = report.risk.riskAssessments.find(r => r.protocol === opportunity.protocol);
            const researchData = report.research.protocols.find(r => r.name === opportunity.protocol);
            
            // Background palette rotation
            const backgrounds = ['bg-[#fff4e0]', 'bg-[#e8f4ff]', 'bg-[#f0ffe8]', 'bg-[#fff0f0]'];
            const cardBg = backgrounds[idx % backgrounds.length];

            // Risk Score color style
            let riskColor = 'text-[#00c853]';
            if (riskData) {
              if (riskData.riskScore > 40) riskColor = 'text-[#e84142]';
              else if (riskData.riskScore > 20) riskColor = 'text-[#ffaa00]';
            }

            return (
              <div 
                key={opportunity.protocol}
                className={`${cardBg} border-3 border-black p-6 shadow-[6px_6px_0px_#000000] rounded-none space-y-4`}
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b-2 border-black/20 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-sans font-bold text-2xl text-black">{opportunity.protocol}</span>
                    <span className="bg-[#ffe500] border border-black text-black font-mono font-bold text-[10px] px-2 py-0.5 uppercase rounded-none shadow-[1.5px_1.5px_0px_#000000]">
                      {researchData?.chain || "AVALANCHE"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm font-mono font-bold text-black uppercase">
                    <span>
                      NET APY: <span className="text-3xl text-[#00c853] ml-1">{opportunity.netAPY}</span>
                    </span>
                    {riskData && (
                      <span className="flex items-center">
                        RISK: <span className={`text-2xl ${riskColor} ml-1`}>{riskData.riskScore}/100</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-1">
                    <span className="block text-xs font-mono font-bold text-black uppercase tracking-wider">
                      RECOMMENDATION
                    </span>
                    <p className="text-black font-sans leading-relaxed">{opportunity.recommendation}</p>
                  </div>
                  {riskData && (
                    <div className="space-y-1">
                      <span className="block text-xs font-mono font-bold text-black uppercase tracking-wider">
                        KEY RISK FACTORS
                      </span>
                      <ul className="list-none space-y-1 font-mono text-xs text-black">
                        {riskData.factors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span>·</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer bar */}
      <footer className="w-full bg-black text-white font-mono text-center py-5 px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider border-2 border-black rounded-none">
        REPORT COMPILED BY AGORA · SETTLED VIA x402 · IDENTITY VERIFIED VIA ERC-8004 · AVALANCHE FUJI
      </footer>
    </div>
  );
}
