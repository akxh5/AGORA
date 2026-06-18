import React from 'react';

interface StepDetail {
  status: "pending" | "processing" | "completed";
  data?: any;
  payments?: any[];
  outputs?: any;
  schemas?: any;
  updates?: any[];
  report?: any;
}

interface TaskProgressProps {
  currentStep: string;
  steps: Record<string, StepDetail>;
  taskId?: string;
  status: "idle" | "processing" | "completed" | "failed";
}

const STEPS_ORDER = [
  "Decompose Task",
  "Discover Agents",
  "Filter by Reputation",
  "Send x402 Payment",
  "Receive Output",
  "Validate Schema",
  "Update Reputation",
  "Final Report"
];

export default function TaskProgress({ currentStep, steps, taskId, status }: TaskProgressProps) {
  if (status === "idle") {
    return (
      <div className="bg-[#ffffff] border-3 border-black shadow-[6px_6px_0px_#000000] p-8 text-center rounded-none space-y-4">
        <p className="font-mono font-bold text-lg text-black uppercase tracking-wider">
          NO ACTIVE TASK
        </p>
        <p className="text-sm font-mono text-black font-semibold uppercase">
          Submit a DeFi request above to start the multi-agent system.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#ffffff] border-3 border-black shadow-[6px_6px_0px_#000000] p-6 rounded-none flex flex-col space-y-6">
      <div className="border-b-4 border-black pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-mono font-bold uppercase tracking-wider text-black">
            AUTONOMOUS EXECUTION FLOW
          </h2>
          {taskId && (
            <div className="mt-1">
              <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 border border-black uppercase font-bold">
                [ID: {taskId}]
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center shrink-0">
          {status === "processing" && (
            <span className="text-xs text-black font-mono font-bold bg-[#ffaa00] px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] animate-pulse uppercase">
              ORCHESTRATOR RUNNING
            </span>
          )}
          {status === "completed" && (
            <span className="text-xs text-black font-mono font-bold bg-[#00c853] px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] uppercase">
              ✓ COMPLETE
            </span>
          )}
          {status === "failed" && (
            <span className="text-xs text-black font-mono font-bold bg-[#e84142] px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] uppercase">
              ✕ FAILED
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {STEPS_ORDER.map((stepName, idx) => {
          const step = steps[stepName] || { status: "pending" };
          const isActive = currentStep === stepName && status === "processing";
          const stepNumStr = String(idx + 1).padStart(2, '0');

          let statusBadge = (
            <span className="px-2 py-0.5 bg-white border border-black text-black font-mono font-bold text-[10px] uppercase shrink-0">
              PENDING
            </span>
          );
          if (step.status === "completed") {
            statusBadge = (
              <span className="px-2 py-0.5 bg-[#00c853] border border-black text-black font-mono font-bold text-[10px] uppercase shrink-0">
                ✓ DONE
              </span>
            );
          } else if (step.status === "processing" || isActive) {
            statusBadge = (
              <span className="px-2 py-0.5 bg-[#ffaa00] border border-black text-black font-mono font-bold text-[10px] uppercase shrink-0 animate-pulse">
                ACTIVE
              </span>
            );
          }

          return (
            <div key={stepName} className="space-y-2.5">
              {/* Step Row Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="bg-black text-white border border-black font-mono font-bold text-xs w-8 h-8 shrink-0 flex items-center justify-center rounded-none">
                    {stepNumStr}
                  </span>
                  <span className="font-mono font-bold text-sm uppercase tracking-wider text-black">
                    {stepName}
                  </span>
                </div>
                {statusBadge}
              </div>

              {/* Step Expanded Detail */}
              {step.status === "completed" && (
                <div className="ml-[44px] border-l-4 border-black pl-4 py-0.5 text-xs font-mono font-normal text-black/85 space-y-2">
                  {stepName === "Decompose Task" && step.data && (
                    <ul className="space-y-1.5 list-none">
                      {step.data.map((st: any, i: number) => (
                        <li key={i} className="leading-relaxed">
                          <span className="text-[#0057ff] font-bold">[{st.role.toUpperCase()}]:</span> {st.description}
                        </li>
                      ))}
                    </ul>
                  )}

                  {stepName === "Discover Agents" && step.data && (
                    <div className="space-y-1.5">
                      <div>Found {step.data.length} registered AI agents:</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {step.data.map((a: any) => (
                          <span key={a.agentId} className="px-2 py-0.5 bg-white text-black font-mono border border-black font-bold text-[10px] uppercase shadow-[1.5px_1.5px_0px_#000000]">
                            {a.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {stepName === "Filter by Reputation" && step.data && (
                    <div className="space-y-1.5">
                      <div>Filter score &ge; 85:</div>
                      <div className="space-y-1 mt-1">
                        {Object.keys(step.data).map((role) => (
                          <div key={role}>
                            <span className="text-[#0057ff] font-bold">[{role.toUpperCase()}]: </span>
                            {step.data[role].name} (Score: <span className="font-bold text-[#00c853]">{step.data[role].reputationScore}%</span>)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stepName === "Send x402 Payment" && step.payments && (
                    <div className="space-y-1">
                      {step.payments.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-black">
                          <span>⚡ Paid {p.agentName}</span>
                          <span className="text-[#00c853] font-bold">{p.amount} ✓</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {stepName === "Receive Output" && step.outputs && (
                    <div className="text-[#00c853] font-bold">
                      ✓ Gathered and parsed 3 specialist agent payloads.
                    </div>
                  )}

                  {stepName === "Validate Schema" && step.schemas && (
                    <div className="space-y-1.5">
                      {Object.keys(step.schemas).map((role) => (
                        <div key={role} className="flex justify-between items-center">
                          <span>{role.toUpperCase()} output schema:</span>
                          <span className="px-1.5 py-0.5 bg-[#00c853] border border-black text-black font-mono font-bold text-[10px] uppercase shadow-[1px_1px_0px_#000000]">
                            ZOD VALIDATED ✓
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {stepName === "Update Reputation" && step.updates && (
                    <div className="space-y-2">
                      {step.updates.map((u: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <span>{u.agentName}:</span>
                          <span className="inline-flex items-center gap-1.5 font-mono">
                            <span className="border border-black px-1.5 py-0.5 bg-white text-black font-bold text-[10px]">
                              {u.oldScore}
                            </span>
                            <span className="text-black font-bold">→</span>
                            <span className="border border-black px-1.5 py-0.5 bg-[#00c853] text-black font-bold text-[10px]">
                              {u.newScore}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {stepName === "Final Report" && (
                    <div className="text-[#00c853] font-bold">
                      ✓ Report compiled and delivered.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
