"use client";

import React from "react";

interface StepTrackerProps {
  currentStep: number; // 1: Upload, 2: Preview, 3: Confirm, 4: Result
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const STEPS = [
  { number: 1, label: "Upload" },
  { number: 2, label: "Preview" },
  { number: 3, label: "Confirm" },
  { number: 4, label: "Result" },
];

export default function StepTracker({
  currentStep,
  darkMode,
  onToggleDarkMode,
}: StepTrackerProps) {
  return (
    <header className="w-full border-b border-brand-border/15 bg-brand-bg px-6 py-4 flex items-center justify-between">
      {/* Product Logo / Title */}
      <div className="flex items-center space-x-2">
        <span className="w-2.5 h-2.5 bg-brand-primary inline-block" />
        <h1 className="font-serif text-lg font-bold tracking-tight text-brand-text">
          GrowEasy <span className="font-mono text-xs font-normal opacity-50 ml-1.5">csv_importer</span>
        </h1>
      </div>

      {/* Controls & Nav */}
      <div className="flex items-center space-x-4 sm:space-x-6">
        {/* Step Progress Tracker - Hidden on tiny screens to avoid squishing */}
        <nav aria-label="Progress Tracker" className="hidden sm:block">
          <ol className="flex items-center space-x-4 md:space-x-8 text-xs font-mono tracking-wider uppercase">
            {STEPS.map((step) => {
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;

              return (
                <li
                  key={step.number}
                  className={`relative pb-1 flex items-center space-x-1.5 transition-colors duration-200 ${
                    isActive
                      ? "text-brand-primary font-bold"
                      : isCompleted
                      ? "text-brand-text/80"
                      : "text-brand-text/40"
                  }`}
                >
                  <span>{step.number}.</span>
                  <span>{step.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-primary" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Mobile mini counter */}
        <div className="sm:hidden font-mono text-xs text-brand-text/50">
          STEP <span className="text-brand-primary font-bold">{currentStep}</span>/4
        </div>

        <div className="h-4 border-l border-brand-border/15 w-[1px]" />

        {/* Dark Mode Icon Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 border border-brand-border/20 hover:border-brand-secondary hover:bg-brand-secondary/10 transition-colors text-brand-text rounded-sm focus:outline-none flex items-center justify-center cursor-pointer select-none shrink-0"
          aria-label="Toggle theme"
          title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
        >
          {darkMode ? (
            // Sun icon
            <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ) : (
            // Moon icon
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
