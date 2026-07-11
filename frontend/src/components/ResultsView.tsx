"use client";

import React, { useState } from "react";

interface CRMRecord {
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
  originalRow: Record<string, any>;
  reason: string;
}

interface ResultsViewProps {
  imported: CRMRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  onReset: () => void;
}

export default function ResultsView({
  imported,
  skipped,
  totalImported,
  totalSkipped,
  onReset,
}: ResultsViewProps) {
  const [openSkipIdx, setOpenSkipIdx] = useState<number | null>(null);
  const totalRows = totalImported + totalSkipped;

  const toggleSkipRow = (idx: number) => {
    setOpenSkipIdx(openSkipIdx === idx ? null : idx);
  };

  return (
    <div className="w-full space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-brand-secondary font-bold">
            STEP 4 / RUN COMPLETED
          </span>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-brand-text mt-0.5">
            AI Mapping Results Ledger
          </h2>
          <p className="font-sans text-xs text-brand-text/60 mt-1">
            Data processing complete. Messy source columns have been mapped and validated against standard CRM constraints.
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-brand-primary text-brand-bg font-sans text-xs font-semibold hover:bg-brand-secondary transition-colors rounded-sm cursor-pointer select-none shrink-0"
        >
          Import New Leads List
        </button>
      </div>

      {/* Summary Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-brand-border/20 p-4 bg-brand-bg rounded-sm font-mono">
        <div className="flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-brand-border/10 pb-3 sm:pb-0">
          <span className="text-[10px] text-brand-text/50 uppercase tracking-wider">Total Rows Processed</span>
          <span className="text-2xl font-bold text-brand-text mt-1">{totalRows}</span>
        </div>
        <div className="flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-brand-border/10 pb-3 sm:pb-0 sm:pl-4">
          <span className="text-[10px] text-brand-text/50 uppercase tracking-wider">Successfully Aligned</span>
          <span className="text-2xl font-bold text-brand-primary mt-1">+{totalImported}</span>
        </div>
        <div className="flex flex-col justify-center sm:pl-4">
          <span className="text-[10px] text-brand-text/50 uppercase tracking-wider">Skipped / Excluded</span>
          <span className="text-2xl font-bold text-brand-text mt-1">{totalSkipped}</span>
        </div>
      </div>

      {/* Target CRM Records Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-medium text-brand-text">Mapped CRM Records ({totalImported})</h3>
          <span className="font-mono text-[9px] text-brand-text/50 uppercase tracking-wider">TARGET_SCHEMA: STANDARD_CRM</span>
        </div>

        {totalImported === 0 ? (
          <div className="w-full border border-brand-border/15 p-6 text-center bg-brand-bg rounded-sm font-sans text-xs text-brand-text/60">
            [NOTICE] No lead records were successfully mapped to the CRM schema fields in this spreadsheet.
          </div>
        ) : (
          <div className="w-full border border-brand-border/20 overflow-hidden rounded-sm bg-brand-bg">
            <div className="overflow-auto max-h-[440px] w-full">
              <table className="w-full border-collapse text-left font-mono text-[10px] text-brand-text/90">
                <thead className="sticky top-0 bg-brand-bg z-10 border-b border-brand-border/30">
                  <tr className="bg-brand-secondary/5 text-brand-text">
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">Created At</th>
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">Name</th>
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">Email</th>
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">Phone</th>
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">Company</th>
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">City</th>
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">State</th>
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">Country</th>
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">Owner</th>
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">Status</th>
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">Source</th>
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">Possession</th>
                    <th className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">Notes / Overflow details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/10">
                  {imported.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-brand-secondary/5 odd:bg-brand-bg even:bg-brand-border/2">
                      <td className="p-2.5 border-r border-brand-border/20 truncate max-w-[100px]" title={rec.created_at}>
                        {rec.created_at ? new Date(rec.created_at).toLocaleString() : ""}
                      </td>
                      <td className="p-2.5 border-r border-brand-border/20 font-bold truncate max-w-[120px]" title={rec.name}>
                        {rec.name}
                      </td>
                      <td className="p-2.5 border-r border-brand-border/20 truncate max-w-[140px]" title={rec.email}>
                        {rec.email || "-"}
                      </td>
                      <td className="p-2.5 border-r border-brand-border/20 whitespace-nowrap">
                        {rec.country_code ? `${rec.country_code} ${rec.mobile_without_country_code}` : rec.mobile_without_country_code || "-"}
                      </td>
                      <td className="p-2.5 border-r border-brand-border/20 truncate max-w-[120px]" title={rec.company}>
                        {rec.company || "-"}
                      </td>
                      <td className="p-2.5 border-r border-brand-border/20 truncate max-w-[100px]" title={rec.city}>
                        {rec.city || "-"}
                      </td>
                      <td className="p-2.5 border-r border-brand-border/20 truncate max-w-[100px]" title={rec.state}>
                        {rec.state || "-"}
                      </td>
                      <td className="p-2.5 border-r border-brand-border/20 truncate max-w-[100px]" title={rec.country}>
                        {rec.country || "-"}
                      </td>
                      <td className="p-2.5 border-r border-brand-border/20 truncate max-w-[100px]" title={rec.lead_owner}>
                        {rec.lead_owner || "-"}
                      </td>
                      <td className="p-2.5 border-r border-brand-border/20 font-bold whitespace-nowrap">
                        <span className="px-1.5 py-0.5 border border-brand-border/30 bg-brand-secondary/10 rounded-sm">
                          {rec.crm_status}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-brand-border/20 truncate max-w-[100px]" title={rec.data_source}>
                        {rec.data_source || "-"}
                      </td>
                      <td className="p-2.5 border-r border-brand-border/20 truncate max-w-[100px]" title={rec.possession_time}>
                        {rec.possession_time || "-"}
                      </td>
                      <td className="p-2.5 border-r border-brand-border/20 truncate max-w-[200px]" title={rec.crm_note}>
                        {rec.crm_note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Skipped Records logs view */}
      {totalSkipped > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif text-lg font-medium text-brand-text">Skipped Leads Logs ({totalSkipped})</h3>
          <div className="border border-brand-border/20 rounded-sm bg-brand-bg divide-y divide-brand-border/15">
            {skipped.map((skip, idx) => {
              const isOpen = openSkipIdx === idx;
              return (
                <div key={idx} className="flex flex-col font-sans text-xs">
                  {/* Summary Bar */}
                  <button
                    onClick={() => toggleSkipRow(idx)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-brand-secondary/5 transition-colors focus:outline-none cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 select-none min-w-0">
                      <span className="font-mono text-[9px] font-bold text-brand-text/60 uppercase tracking-wider bg-brand-secondary/15 px-1.5 py-0.5 border border-brand-border/25 shrink-0">
                        [SKIPPED]
                      </span>
                      <span className="font-serif font-medium text-brand-text truncate pr-2">
                        {skip.originalRow["Lead Name"] || skip.originalRow["full_name"] || skip.originalRow["Lead Full Name"] || "Unnamed Row Record"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0 min-w-0">
                      <span className="font-mono text-[10px] text-brand-secondary font-bold truncate max-w-[150px] sm:max-w-none">
                        {skip.reason}
                      </span>
                      <span className="text-brand-text/40">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {/* Expanded Original Row Content */}
                  {isOpen && (
                    <div className="p-4 bg-brand-secondary/5 border-t border-brand-border/15 font-mono text-[10px] text-brand-text/80 space-y-2 select-all overflow-x-auto max-w-full">
                      <div className="font-bold text-brand-text/60 border-b border-brand-border/10 pb-1.5 mb-2">
                        ORIGINAL_ROW_DETAILS:
                      </div>
                      <pre className="whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(skip.originalRow, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
