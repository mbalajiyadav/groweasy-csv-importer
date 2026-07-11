"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";

interface UploadZoneProps {
  onDataParsed: (data: {
    headers: string[];
    rows: Record<string, string>[];
    fileName: string;
  }) => void;
}

export default function UploadZone({ onDataParsed }: UploadZoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles, rejectedFiles) => {
      setError(null);

      // Handle rejections
      if (rejectedFiles.length > 0) {
        const fileRejection = rejectedFiles[0];
        if (fileRejection.errors.some((e) => e.code === "file-invalid-type")) {
          setError("Invalid file format. Please provide a comma-separated values file (.csv) containing contact details.");
        } else {
          setError("File import failure. Ensure it is a single valid leads CSV.");
        }
        return;
      }

      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsParsing(true);

      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: "greedy",
        complete: (results) => {
          setIsParsing(false);
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors);
          }
          if (!results.meta.fields || results.meta.fields.length === 0) {
            setError("Import warning: The selected CSV contains no headers or records. Verify rows contain name, email, or mobile fields.");
            return;
          }
          onDataParsed({
            headers: results.meta.fields,
            rows: results.data,
            fileName: file.name,
          });
        },
        error: (err) => {
          setIsParsing(false);
          setError(`Import parse error: ${err.message}`);
        },
      });
    },
  });

  return (
    <div className="w-full max-w-xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-brand-text">Select Leads Spreadsheet</h2>
        <p className="font-sans text-xs text-brand-text/60 mt-1">
          Upload raw lead registers exported from Facebook Ads, Google Ads, Excel, or custom CRM sheets. Mappings will align raw columns to standard fields.
        </p>
      </div>

      {/* Dropzone Drop Area */}
      <div
        {...getRootProps()}
        className={`w-full min-h-[120px] px-6 py-6 border border-brand-border/20 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 rounded-sm bg-brand-bg hover:border-brand-primary ${
          isDragActive ? "border-brand-primary bg-brand-primary/5" : ""
        }`}
      >
        <input {...getInputProps()} />
        
        {isParsing ? (
          <div className="flex items-center space-x-2 font-mono text-xs text-brand-text/70">
            <span className="animate-pulse">Parsing lead contact fields...</span>
          </div>
        ) : (
          <div className="text-center font-sans text-xs text-brand-text/70 space-y-1">
            <p>
              {isDragActive ? (
                <span className="text-brand-primary font-medium">Drop to import...</span>
              ) : (
                <>
                  Drag & drop leads CSV here, or{" "}
                  <span className="text-brand-secondary hover:underline underline-offset-2 font-medium">
                    browse local files
                  </span>
                </>
              )}
            </p>
            <p className="text-[10px] font-mono text-brand-text/40 tracking-wider">
              Maximum spreadsheet size: 50MB (.csv only)
            </p>
          </div>
        )}
      </div>

      {/* Inline Error Message */}
      {error && (
        <div className="mt-3 p-3 border border-brand-border/40 bg-brand-secondary/5 flex items-start space-x-2.5 rounded-sm">
          <svg
            className="w-3.5 h-3.5 text-brand-secondary shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-mono text-xs text-brand-text leading-relaxed font-semibold">
            <span className="text-brand-secondary font-bold mr-1.5">[ERROR]</span>
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
