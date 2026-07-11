"use client";

import React from "react";

interface CSVPreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
  onConfirm: () => void;
  onClear: () => void;
}

export default function CSVPreviewTable({
  headers,
  rows,
  fileName,
  onConfirm,
  onClear,
}: CSVPreviewTableProps) {
  const previewRows = rows.slice(0, 10);
  const totalCount = rows.length;
  const isEmpty = rows.length === 0;

  return (
    <div className="w-full space-y-6">
      {/* Header Metadata Details */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-brand-secondary font-bold">
            STEP 2 / PREVIEW REGISTER
          </span>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-brand-text mt-0.5">
            Verify Raw Spreadsheet Records
          </h2>
          <p className="font-mono text-[10px] text-brand-text/50 mt-1">
            FILE_REF: <span className="text-brand-text/80 font-bold">{fileName}</span> ({totalCount} rows identified)
          </p>
        </div>

        {/* Actions bar */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onClear}
            className="px-3.5 py-1.5 border border-brand-border/20 text-brand-text hover:border-brand-secondary hover:bg-brand-secondary/5 font-sans text-xs transition-colors rounded-sm cursor-pointer select-none"
          >
            Clear / Re-upload
          </button>
          {!isEmpty && (
            <button
              onClick={onConfirm}
              className="px-3.5 py-1.5 bg-brand-primary text-brand-bg font-sans text-xs font-semibold hover:bg-brand-secondary transition-colors rounded-sm cursor-pointer select-none"
            >
              Execute AI Mapping
            </button>
          )}
        </div>
      </div>

      {/* Info notice bar */}
      <div className="p-3 border border-brand-border/10 bg-brand-border/5 rounded-sm">
        <p className="font-sans text-[11px] text-brand-text/70 leading-relaxed">
          <span className="font-semibold text-brand-secondary uppercase font-mono mr-1.5">[NOTICE]</span>
          Examines raw columns before AI mapping alignments. Confirm that columns with contact details (e.g. email or mobile contacts) are present.
        </p>
      </div>

      {isEmpty ? (
        /* Empty CSV State Card */
        <div className="w-full border border-brand-border/20 p-8 flex flex-col items-center justify-center text-center bg-brand-bg rounded-sm min-h-[220px]">
          <svg
            className="w-8 h-8 text-brand-secondary shrink-0 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="font-serif text-lg font-medium text-brand-text">Empty Spreadsheet Detected</h3>
          <p className="font-sans text-xs text-brand-text/60 mt-1 max-w-sm leading-relaxed">
            The CSV file was successfully parsed but contains zero records. Please choose another spreadsheet document containing contact lines.
          </p>
          <button
            onClick={onClear}
            className="mt-4 px-3.5 py-1.5 border border-brand-border/20 text-brand-text hover:border-brand-secondary hover:bg-brand-secondary/5 font-sans text-xs transition-colors rounded-sm cursor-pointer select-none"
          >
            Choose Another File
          </button>
        </div>
      ) : (
        /* Scrolling Ledger data table wrapper */
        <div className="w-full border border-brand-border/20 overflow-hidden rounded-sm bg-brand-bg">
          <div className="overflow-auto max-h-[420px] w-full">
            <table className="w-full border-collapse text-left font-mono text-[11px] text-brand-text/90">
              <thead className="sticky top-0 bg-brand-bg z-10 border-b border-brand-border/30">
                <tr className="bg-brand-secondary/5 text-brand-text">
                  <th className="p-3 border-r border-brand-border/20 font-bold w-12 text-center">#</th>
                  {headers.map((hdr, idx) => (
                    <th
                      key={idx}
                      className="p-3 border-r border-brand-border/20 font-bold truncate max-w-[160px] select-all"
                      title={hdr}
                    >
                      {hdr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/10">
                {previewRows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="hover:bg-brand-secondary/5 odd:bg-brand-bg even:bg-brand-border/2"
                  >
                    <td className="p-3 border-r border-brand-border/20 text-center font-bold text-brand-text/50">
                      {rowIdx + 1}
                    </td>
                    {headers.map((hdr, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="p-3 border-r border-brand-border/20 truncate max-w-[160px]"
                        title={row[hdr] || ""}
                      >
                        {row[hdr] !== undefined ? String(row[hdr]) : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-brand-border/20 font-mono text-[10px] text-brand-text/50 flex justify-between bg-brand-bg">
            <span>
              Showing preview of top {previewRows.length} of {totalCount} records.
            </span>
            <span className="font-bold">
              [FORMAT: COMMA_SEPARATED_CSV]
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
