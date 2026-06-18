'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import AgentMarketplace from '../components/AgentMarketplace';
import TaskProgress from '../components/TaskProgress';
import PaymentFeed from '../components/PaymentFeed';
import FinalReport from '../components/FinalReport';

export default function Home() {
  const [prompt, setPrompt] = useState(
    "Analyze Avalanche DeFi yield opportunities and generate a risk-adjusted report."
  );
  
  // States
  const [agents, setAgents] = useState([]);
  const [isAgentsLoading, setIsAgentsLoading] = useState(true);
  
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [currentStep, setCurrentStep] = useState<string>("");
  const [steps, setSteps] = useState<any>({});
  const [paymentsFeed, setPaymentsFeed] = useState<any[]>([]);
  const [reputationUpdates, setReputationUpdates] = useState<any[]>([]);
  const [finalReport, setFinalReport] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Expose payments feed to window so child components can access it reactively without changing props
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).paymentsFeed = paymentsFeed;
    }
  }, [paymentsFeed]);

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setIsAgentsLoading(true);
      const res = await fetch('http://localhost:3001/agents');
      const data = await res.json();
      setAgents(data);
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setIsAgentsLoading(false);
    }
  };

  // Poll orchestration progress
  useEffect(() => {
    if (!taskId || taskStatus !== "processing") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/task/${taskId}/result`);
        if (res.status === 404) return;
        
        const task = await res.json();
        setCurrentStep(task.currentStep);
        setSteps(task.steps);
        setPaymentsFeed(task.paymentsFeed);
        setReputationUpdates(task.reputationUpdates);
        setFinalReport(task.finalReport);
        setTaskStatus(task.status);
        
        if (task.status === "completed" || task.status === "failed") {
          clearInterval(interval);
          if (task.status === "failed") {
            setErrorMsg(task.error || "An unknown error occurred during execution.");
          }
          // Refresh agents to show new jobs count, earnings and reputation scores!
          fetchAgents();
        }
      } catch (err) {
        console.error("Error polling task:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [taskId, taskStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || taskStatus === "processing") return;

    setErrorMsg(null);
    setTaskId(null);
    setTaskStatus("processing");
    setCurrentStep("");
    setSteps({});
    setPaymentsFeed([]);
    setReputationUpdates([]);
    setFinalReport(null);

    try {
      const res = await fetch('http://localhost:3001/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      if (res.status === 202) {
        setTaskId(data.taskId);
      } else {
        setTaskStatus("idle");
        setErrorMsg(data.error || "Failed to start orchestration.");
      }
    } catch (err) {
      console.error("Error submitting task:", err);
      setTaskStatus("idle");
      setErrorMsg("Failed to connect to the backend server.");
    }
  };

  return (
    <main className="min-h-screen bg-[#fffef0] text-black font-sans pb-16 relative">
      {/* Header Bar */}
      <header className="w-full bg-[#e84142] border-b-3 border-black shadow-[0_4px_0_#000000] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-black uppercase">
            AGORA
          </h1>
          <p className="text-xs font-mono text-black font-semibold mt-0.5 tracking-wider uppercase">
            Autonomous Agent Economy · ERC-8004 · x402 · Avalanche Fuji
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_#000000]">
          <span className="h-2.5 w-2.5 bg-[#00c853] border border-black animate-pulse" />
          <span className="text-xs font-mono font-bold text-black uppercase">LIVE</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-6 pt-12 space-y-12">
        
        {/* Input Section */}
        <section className="bg-white border-3 border-black shadow-[6px_6px_0px_#000000] p-6 rounded-none">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex-1 w-full space-y-2">
              <label htmlFor="prompt" className="text-sm font-bold uppercase tracking-wider text-black font-mono block">
                SUBMIT TASK TO AGENT NETWORK
              </label>
              <textarea
                id="prompt"
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={taskStatus === "processing"}
                className="w-full bg-white border-2 border-black rounded-none p-4 text-sm text-black font-mono focus:border-3 focus:border-black focus:shadow-[3px_3px_0px_#000000] focus:outline-none transition-all"
                placeholder="Enter yield report instruction..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={taskStatus === "processing"}
                className="w-full sm:w-auto px-8 py-4 bg-[#e84142] text-black font-mono font-bold uppercase tracking-wide border-3 border-black shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                EXECUTE TASK →
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="mt-6 bg-[#fff0f0] border-2 border-black p-4 rounded-none flex items-center gap-3 shadow-[3px_3px_0px_#000000]">
              <ShieldAlert className="w-5 h-5 text-[#e84142] shrink-0" />
              <span className="text-sm font-mono text-black font-bold uppercase">{errorMsg}</span>
            </div>
          )}
        </section>

        {/* Agent Registry Cards Section */}
        <section className="w-full">
          <AgentMarketplace agents={agents} isLoading={isAgentsLoading} />
        </section>

        {/* Side-by-Side: Payment Feed (55%) & Step Progress (45%) */}
        <section className="flex flex-col lg:flex-row gap-12 items-stretch">
          <div className="w-full lg:w-[55%] flex flex-col">
            <PaymentFeed payments={paymentsFeed} />
          </div>
          <div className="w-full lg:w-[45%] flex flex-col">
            <TaskProgress 
              currentStep={currentStep} 
              steps={steps} 
              taskId={taskId || undefined} 
              status={taskStatus} 
            />
          </div>
        </section>

        {/* Final Report (Full Width below) */}
        <section className="w-full">
          <FinalReport report={finalReport} />
        </section>

      </div>
    </main>
  );
}
