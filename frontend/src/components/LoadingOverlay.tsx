"use client";

import React, { useState, useEffect } from "react";

export type LoadingPhase = "uploading" | "mapping" | "finalizing";

interface LoadingOverlayProps {
  phase: LoadingPhase;
}

const PHASES_METADATA = {
  uploading: {
    title: "Uploading CSV records",
    description: "Streaming row payloads to internal mapping endpoint...",
    baseProgress: 10,
    maxProgress: 40,
    logs: [
      "[SYS] Initializing CSV import pipeline...",
      "[SYS] Serializing parsed row records...",
      "[OK] Payload compiled successfully.",
      "[BUSY] Streaming payload to Node.js Express server...",
    ],
  },
  mapping: {
    title: "AI mapping in progress",
    description: "Invoking Gemini model to map heterogeneous columns to target schema...",
    baseProgress: 40,
    maxProgress: 85,
    logs: [
      "[OK] Express backend received CSV payload.",
      "[SYS] Instantiating Google Gemini API session...",
      "[SYS] Analyzing source columns & establishing model context...",
      "[BUSY] Resolving ambiguous CRM fields using business heuristics...",
    ],
  },
  finalizing: {
    title: "Finalizing data ledger",
    description: "Validating CRM output schema structures and resolving skips...",
    baseProgress: 85,
    maxProgress: 98,
    logs: [
      "[OK] Gemini AI mapping response generated.",
      "[SYS] Validating CRM statuses: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE...",
      "[SYS] Verifying email & mobile number integrity...",
      "[BUSY] Separating imported vs skipped arrays...",
    ],
  },
};

export default function LoadingOverlay({ phase }: LoadingOverlayProps) {
  const meta = PHASES_METADATA[phase] || PHASES_METADATA.uploading;
  const [progress, setProgress] = useState(meta.baseProgress);

  // Reset to phase base progress upon transition
  useEffect(() => {
    setProgress(meta.baseProgress);
  }, [phase, meta.baseProgress]);

  // Smoothly increment progress bar dynamically over time
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < meta.maxProgress) {
          // Increment slower as we near the max cap of the current phase
          const increment = Math.max(0.1, (meta.maxProgress - prev) * 0.04);
          return Math.min(meta.maxProgress, prev + increment);
        }
        return prev;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [meta.maxProgress]);

  return (
    <div className="w-full max-w-xl border border-brand-border/20 bg-brand-bg p-6 rounded-sm space-y-6">
      {/* Title & Phase details */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-serif text-lg font-medium text-brand-text flex items-center gap-2">
            <span className="w-2 h-2 bg-brand-primary inline-block animate-pulse" />
            {meta.title}
          </h3>
          <p className="font-sans text-xs text-brand-text/60 mt-1">{meta.description}</p>
        </div>
        <span className="font-mono text-xs font-bold text-brand-primary shrink-0 select-none">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full border border-brand-border/15 h-2 bg-brand-bg p-[1px] rounded-none">
        <div
          className="h-full bg-brand-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Monospace Logs Box */}
      <div className="bg-brand-secondary/5 border border-brand-border/25 p-4 font-mono text-[10px] text-brand-text/80 space-y-1 rounded-none select-none max-h-[140px] overflow-y-auto">
        {meta.logs.map((log, idx) => (
          <p key={idx} className="leading-relaxed">
            {log}
          </p>
        ))}
        <p className="text-brand-secondary flex items-center">
          <span>&gt; Processing current phase...</span>
          <span className="w-1 h-3 bg-brand-secondary ml-1 animate-pulse" />
        </p>
      </div>
    </div>
  );
}
