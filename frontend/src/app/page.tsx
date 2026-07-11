"use client";

import React, { useState, useEffect, useRef } from "react";
import StepTracker from "@/components/StepTracker";
import UploadZone from "@/components/UploadZone";
import CSVPreviewTable from "@/components/CSVPreviewTable";
import LoadingOverlay, { LoadingPhase } from "@/components/LoadingOverlay";
import ResultsView from "@/components/ResultsView";

interface ImportedRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

interface SkippedRecord {
  originalRow: Record<string, string>;
  reason: string;
}

interface ImportResults {
  imported: ImportedRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
}

// Client-side mapping generator to enable developer previews without running the Express server
function mockMapCSVRows(rows: Record<string, string>[]): ImportResults {
  const imported: ImportedRecord[] = [];
  const skipped: SkippedRecord[] = [];

  rows.forEach((row) => {
    // Detect keys for email and phone using regex
    const emailKey = Object.keys(row).find((k) => /email|mail|e-mail/i.test(k));
    const phoneKey = Object.keys(row).find((k) => /phone|mobile|tel|contact/i.test(k));
    const nameKey = Object.keys(row).find((k) => /name|fullname|first|last/i.test(k));
    const companyKey = Object.keys(row).find((k) => /company|org|business/i.test(k));
    const cityKey = Object.keys(row).find((k) => /city/i.test(k));
    const stateKey = Object.keys(row).find((k) => /state|province/i.test(k));
    const countryKey = Object.keys(row).find((k) => /country/i.test(k));
    const statusKey = Object.keys(row).find((k) => /status|crm/i.test(k));
    const sourceKey = Object.keys(row).find((k) => /source|origin/i.test(k));
    const descKey = Object.keys(row).find((k) => /description|notes|remark/i.test(k));

    const emailVal = emailKey ? row[emailKey]?.trim() : "";
    const phoneVal = phoneKey ? row[phoneKey]?.trim() : "";
    const nameVal = nameKey ? row[nameKey]?.trim() : "Unknown Lead";
    const companyVal = companyKey ? row[companyKey]?.trim() : "";
    const cityVal = cityKey ? row[cityKey]?.trim() : "";
    const stateVal = stateKey ? row[stateKey]?.trim() : "";
    const countryVal = countryKey ? row[countryKey]?.trim() : "";
    const descVal = descKey ? row[descKey]?.trim() : "";

    // Validation: skip records lacking BOTH email and mobile number identifiers
    if (!emailVal && !phoneVal) {
      skipped.push({
        originalRow: row,
        reason: "No email address or phone number identifier detected in row records.",
      });
      return;
    }

    // Split phone numbers into code and number blocks
    let countryCode = "";
    let mobileNum = phoneVal;
    if (phoneVal) {
      const cleaned = phoneVal.replace(/[^0-9+]/g, "");
      if (cleaned.startsWith("+")) {
        countryCode = cleaned.slice(0, 3);
        mobileNum = cleaned.slice(3);
      } else if (cleaned.length > 10) {
        countryCode = "+" + cleaned.slice(0, cleaned.length - 10);
        mobileNum = cleaned.slice(cleaned.length - 10);
      } else {
        countryCode = "+1";
        mobileNum = cleaned;
      }
    }

    // Resolve status enum
    const rawStatus = statusKey ? row[statusKey]?.toUpperCase().trim() : "";
    let crmStatus = "GOOD_LEAD_FOLLOW_UP";
    if (rawStatus.includes("DID_NOT_CONNECT") || rawStatus.includes("NO_CONNECT")) {
      crmStatus = "DID_NOT_CONNECT";
    } else if (rawStatus.includes("BAD") || rawStatus.includes("SPAM")) {
      crmStatus = "BAD_LEAD";
    } else if (rawStatus.includes("DONE") || rawStatus.includes("SALE") || rawStatus.includes("CLOSE")) {
      crmStatus = "SALE_DONE";
    }

    // Resolve data source enum
    const rawSource = sourceKey ? row[sourceKey]?.toLowerCase().trim() : "";
    let dataSource = "";
    if (rawSource.includes("leads_on_demand")) dataSource = "leads_on_demand";
    else if (rawSource.includes("meridian_tower")) dataSource = "meridian_tower";
    else if (rawSource.includes("eden_park")) dataSource = "eden_park";
    else if (rawSource.includes("varah_swamy")) dataSource = "varah_swamy";
    else if (rawSource.includes("sarjapur_plots")) dataSource = "sarjapur_plots";

    // Gather extra columns to push into crm_note
    const mappedKeys = [emailKey, phoneKey, nameKey, companyKey, cityKey, stateKey, countryKey, statusKey, sourceKey, descKey].filter(Boolean) as string[];
    const extraFields: string[] = [];
    Object.entries(row).forEach(([k, v]) => {
      if (!mappedKeys.includes(k) && v) {
        extraFields.push(`${k}: ${v}`);
      }
    });
    let crmNote = extraFields.join(" | ");

    imported.push({
      created_at: new Date().toISOString(),
      name: nameVal,
      email: emailVal,
      country_code: countryCode,
      mobile_without_country_code: mobileNum,
      company: companyVal,
      city: cityVal,
      state: stateVal,
      country: countryVal,
      lead_owner: "AI Auto-Mapper",
      crm_status: crmStatus,
      crm_note: crmNote || "Imported via developer mapping simulation.",
      data_source: dataSource,
      possession_time: "Immediate",
      description: descVal || "Raw row data compiled locally.",
    });
  });

  return {
    imported,
    skipped,
    totalImported: imported.length,
    totalSkipped: skipped.length,
  };
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [csvData, setCsvData] = useState<{
    headers: string[];
    rows: Record<string, string>[];
    fileName: string;
  } | null>(null);

  // API Call state
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [results, setResults] = useState<ImportResults | null>(null);
  
  // Developer switch to bypass offline error states
  const [useMockAPI, setUseMockAPI] = useState<boolean>(true);

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // References to handle async loading states cleanly
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  const handleDataParsed = (data: {
    headers: string[];
    rows: Record<string, string>[];
    fileName: string;
  }) => {
    setCsvData(data);
    setCurrentStep(2);
  };

  const handleClear = () => {
    setCsvData(null);
    setResults(null);
    setApiError(null);
    setLoadingPhase(null);
    setCurrentStep(1);
  };

  const handleConfirmImport = async () => {
    if (!csvData) return;

    setApiError(null);
    setCurrentStep(3);
    setLoadingPhase("uploading");

    let apiResponse: ImportResults | null = null;
    let errorOccurred: string | null = null;

    // Trigger API request in background
    const apiCallPromise = (async () => {
      if (useMockAPI) {
        // Simulate API latency
        await new Promise((resolve) => setTimeout(resolve, 3500));
        return mockMapCSVRows(csvData.rows);
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiUrl}/api/import`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rows: csvData.rows }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status} request failure.`);
        }

        return await res.json();
      } catch (err: any) {
        throw new Error(err.message || "Network request failed. Express endpoint is offline.");
      }
    })();

    // Phase Simulation Timeline
    try {
      // 1. Uploading Phase (runs for ~1.2s)
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (currentStepRef.current !== 3) return; // check for aborts

      // 2. AI Mapping Phase (runs for ~1.6s)
      setLoadingPhase("mapping");
      await new Promise((resolve) => setTimeout(resolve, 1600));
      if (currentStepRef.current !== 3) return;

      // 3. Finalizing Phase (runs for ~1.0s)
      setLoadingPhase("finalizing");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (currentStepRef.current !== 3) return;

      // Wait for fetch completion if it's taking longer
      const data = await apiCallPromise;
      
      setResults(data);
      setLoadingPhase(null);
      setCurrentStep(4);
    } catch (err: any) {
      setApiError(err.message || "An unknown mapping error occurred.");
      setLoadingPhase(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-text">
      {/* Step Progress Tracker Top Bar */}
      <StepTracker
        currentStep={currentStep}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Dev Mode Banner (fits terminal/ledger theme) */}
      {(currentStep === 1 || currentStep === 2) && (
        <div className="w-full border-b border-brand-border/15 px-6 py-2 flex items-center justify-between text-[10px] font-mono text-brand-text/65 bg-brand-bg select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-brand-primary inline-block" />
            <span>MOCK ENDPOINT SIMULATOR</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useMockAPI}
              onChange={(e) => setUseMockAPI(e.target.checked)}
              className="accent-brand-primary w-3.5 h-3.5 border-brand-border/30 focus:ring-0 focus:ring-offset-0 bg-brand-bg"
            />
            <span>Mock API Response (Offline Mode)</span>
          </label>
        </div>
      )}

      {/* Primary Working Layout */}
      <main className="flex-1 w-full max-w-7xl px-6 py-8 md:py-12 flex flex-col items-start justify-start">
        {currentStep === 1 && (
          <UploadZone onDataParsed={handleDataParsed} />
        )}

        {currentStep === 2 && csvData && (
          <CSVPreviewTable
            headers={csvData.headers}
            rows={csvData.rows}
            fileName={csvData.fileName}
            onConfirm={handleConfirmImport}
            onClear={handleClear}
          />
        )}

        {currentStep === 3 && loadingPhase && (
          <LoadingOverlay phase={loadingPhase} />
        )}

        {/* Step 3 Error State */}
        {currentStep === 3 && apiError && (
          <div className="w-full max-w-xl space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-medium tracking-tight text-brand-text flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-brand-border inline-block" />
                Connection Error
              </h2>
              <p className="font-sans text-xs text-brand-text/60 mt-1">
                The mapping request encountered a system validation error or network failure.
              </p>
            </div>

            <div className="border border-brand-border/40 bg-brand-secondary/5 p-4 rounded-sm font-mono text-[11px] space-y-2 text-brand-text">
              <div className="flex justify-between items-center opacity-85 text-brand-secondary font-bold">
                <span>[ERROR] MAPPING_API_UNREACHABLE</span>
                <span>OFFLINE</span>
              </div>
              <p className="leading-relaxed font-semibold">
                &gt; {apiError}
              </p>
              <p className="text-[10px] opacity-75 font-sans leading-relaxed pt-1.5 border-t border-brand-border/20">
                Tip: If the API endpoint is not running, toggling "Mock API Response" in Step 1/2 will allow you to bypass server connection checks.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-brand-primary border border-brand-primary text-xs font-sans font-medium tracking-wide uppercase text-brand-text font-semibold hover:bg-brand-secondary hover:text-brand-bg hover:border-brand-secondary transition-colors rounded-sm"
              >
                Retry Request
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 border border-brand-border/30 text-xs font-sans font-medium tracking-wide uppercase hover:border-brand-border hover:bg-brand-secondary/10 transition-colors rounded-sm text-brand-text bg-transparent"
              >
                Cancel and Restart
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && results && (
          <ResultsView
            imported={results.imported}
            skipped={results.skipped}
            totalImported={results.totalImported}
            totalSkipped={results.totalSkipped}
            onReset={handleClear}
          />
        )}
      </main>
    </div>
  );
}
