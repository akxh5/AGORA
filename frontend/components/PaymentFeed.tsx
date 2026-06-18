import React from 'react';
import { getExplorerTxUrl, truncateAddress } from '../lib/contracts';

interface PaymentEvent {
  status: "required" | "confirmed";
  agentName: string;
  amount: string;
  payee: string;
  txHash?: string;
}

interface PaymentFeedProps {
  payments: PaymentEvent[];
}

export default function PaymentFeed({ payments }: PaymentFeedProps) {
  // Reverse the array so the newest payment is on top
  const reversedPayments = [...payments].reverse();

  return (
    <div className="bg-[#ffffff] border-3 border-black shadow-[6px_6px_0px_#000000] p-6 rounded-none h-full flex flex-col space-y-6">
      <div className="border-b-4 border-black pb-3">
        <h2 className="text-2xl font-mono font-bold uppercase tracking-wider text-black">
          ⚡ x402 PAYMENT STREAM
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 max-h-[450px] pr-2 custom-scrollbar flex flex-col">
        {reversedPayments.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-black font-mono text-sm font-bold uppercase py-12">
            No payments sent yet. Submit a task to trigger payments.
          </div>
        ) : (
          reversedPayments.map((p, idx) => {
            // Apply visual stacking shrink effect for older events
            const stackStyle = idx === 0 
              ? 'scale-100 z-30' 
              : idx === 1 
                ? 'scale-[0.97] opacity-90 z-20 origin-top' 
                : 'scale-[0.94] opacity-80 z-10 origin-top';

            if (p.status === "required") {
              return (
                <div 
                  key={idx} 
                  className={`bg-[#ffaa00] p-5 shadow-[6px_6px_0px_#000000] rounded-none animate-march transition-all duration-300 ${stackStyle}`}
                >
                  <div className="text-xs space-y-2">
                    <div className="font-mono font-bold text-lg text-black uppercase tracking-wider">
                      HTTP 402 · PAYMENT REQUIRED
                    </div>
                    <div className="font-mono text-sm text-black font-bold uppercase">
                      → {p.agentName} · {p.amount} · eip155:43113
                    </div>
                    <div className="text-[10px] font-mono text-black font-semibold mt-1">
                      Payee Address: {truncateAddress(p.payee)}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={idx} 
                className={`bg-[#00c853] border-3 border-black p-5 shadow-[6px_6px_0px_#000000] rounded-none animate-slide-bounce transition-all duration-300 flex flex-col gap-3 ${stackStyle}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-lg text-black uppercase tracking-wider">
                    ✓ PAYMENT SETTLED
                  </span>
                  <span className="text-xs font-mono font-bold bg-white text-black px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
                    {p.amount}
                  </span>
                </div>
                
                <div className="font-mono text-xs text-black font-bold uppercase leading-relaxed">
                  Settled x402 payment to {p.agentName}.
                </div>

                {p.txHash && (
                  <div className="flex justify-between items-center border-t border-black/25 pt-2 mt-1 font-mono text-[11px] font-bold text-black uppercase">
                    <span>Payee: {truncateAddress(p.payee)}</span>
                    <a 
                      href={getExplorerTxUrl(p.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-black hover:text-black font-bold"
                    >
                      tx: {p.txHash.substring(0, 10)}... ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
