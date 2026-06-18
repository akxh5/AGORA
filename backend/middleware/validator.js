import { z } from 'zod';

export const ResearchOutputSchema = z.object({
  protocols: z.array(z.object({
    name: z.string(),
    tvl: z.string(),
    apy: z.string(),
    chain: z.string()
  })),
  timestamp: z.string(),
  agentId: z.string()
});

export const RiskOutputSchema = z.object({
  riskAssessments: z.array(z.object({
    protocol: z.string(),
    riskScore: z.number(),
    factors: z.array(z.string())
  })),
  overallRisk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  agentId: z.string()
});

export const YieldOutputSchema = z.object({
  topOpportunities: z.array(z.object({
    protocol: z.string(),
    netAPY: z.string(),
    recommendation: z.string()
  })),
  summary: z.string(),
  agentId: z.string()
});
