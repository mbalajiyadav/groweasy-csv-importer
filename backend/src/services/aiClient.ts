import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { CRMRecord, SkippedRecord } from "../types/crm.js";

interface BatchMappingResult {
  imported: CRMRecord[];
  skipped: SkippedRecord[];
}

const CRM_FIELDS_DESC = `
- created_at: Parseable ISO 8601 date string or timestamp. If the raw date is missing or empty, use the current timestamp: "${new Date().toISOString()}".
- name: Contact person's full name. If empty, write "Unknown Lead".
- email: Contact person's primary email. Keep only the first valid email. Append any extra emails found in this row to crm_note.
- country_code: The phone country code (e.g., +1, +91). Extract from the raw phone if present.
- mobile_without_country_code: Clean mobile number without country code, spaces, or formatting characters. Keep only the first phone. Append any extra numbers found to crm_note.
- company: Company name or employer.
- city: City location.
- state: State/province.
- country: Country location.
- lead_owner: Lead owner, campaign manager or sales representative.
- crm_status: MUST be one of these exact values: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE.
- crm_note: Mapped notes. ALWAYS append any overflow emails, alternate phones, campaigns, or unmapped raw headers from this row here to preserve all details.
- data_source: MUST be one of these exact values: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. If uncertain, leave it blank (empty string). Do not guess.
- possession_time: Preferred occupancy timeframe or possession details.
- description: Lead descriptions, remarks or message notes.
`;

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    records: {
      type: SchemaType.ARRAY,
      description: "Successfully mapped CRM records",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          rowIndex: { type: SchemaType.INTEGER, description: "0-indexed line number matching the row in the input array" },
          created_at: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING },
          country_code: { type: SchemaType.STRING },
          mobile_without_country_code: { type: SchemaType.STRING },
          company: { type: SchemaType.STRING },
          city: { type: SchemaType.STRING },
          state: { type: SchemaType.STRING },
          country: { type: SchemaType.STRING },
          lead_owner: { type: SchemaType.STRING },
          crm_status: { type: SchemaType.STRING, description: "Must be: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, or SALE_DONE" },
          crm_note: { type: SchemaType.STRING },
          data_source: { type: SchemaType.STRING, description: "Must be: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots, or empty string" },
          possession_time: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING }
        },
        required: [
          "rowIndex", "created_at", "name", "email", "country_code", "mobile_without_country_code",
          "company", "city", "state", "country", "lead_owner", "crm_status",
          "crm_note", "data_source", "possession_time", "description"
        ]
      }
    },
    skipped: {
      type: SchemaType.ARRAY,
      description: "Indices of rows that had neither email nor mobile/phone and were skipped",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          rowIndex: { type: SchemaType.INTEGER, description: "0-indexed line number in the input list matching the skipped row" },
          reason: { type: SchemaType.STRING, description: "Detailed description of the skipping logic" }
        },
        required: ["rowIndex", "reason"]
      }
    }
  },
  required: ["records", "skipped"]
};

/**
 * Call Gemini model to map a batch of raw CSV rows.
 */
async function callGeminiModel(rows: Record<string, any>[]): Promise<BatchMappingResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the backend environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use gemini-2.0-flash as required
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    }
  });

  const prompt = `You are a data ops assistant. Your task is to map messy, raw CSV row records into a structured CRM schema.

CRM Target Schema Description:
${CRM_FIELDS_DESC}

EXCLUSION RULE:
- If a row has NEITHER an email NOR a mobile number, it MUST be reported in the 'skipped' array with the rowIndex (0-indexed position in the input array) and the reason ("No email or mobile number identifiers detected"). Do NOT include it in the 'records' array.

FEW-SHOT WORKED EXAMPLE:
---
Input Batch (1 row):
[
  {
    "Lead Full Name": "Johnathan Smith Jr.",
    "e-mail": "john.smith@domain.com, alt.john@domain.com",
    "Phone No.": "+91 98765 43210 / +91 99999 88888",
    "Company Name": "Smith & Partners",
    "Enquiry Date": "2026-03-12 14:30:22",
    "Status Code": "sale close success",
    "Source Campaign": "Meridian Tower Ads",
    "Possession Req": "6 months",
    "Raw Notes": "Spoke to customer. Interested in 3BHK."
  }
]

Expected Output JSON:
{
  "records": [
    {
      "rowIndex": 0,
      "created_at": "2026-03-12T14:30:22.000Z",
      "name": "Johnathan Smith Jr.",
      "email": "john.smith@domain.com",
      "country_code": "+91",
      "mobile_without_country_code": "9876543210",
      "company": "Smith & Partners",
      "city": "",
      "state": "",
      "country": "India",
      "lead_owner": "AI Auto-Mapper",
      "crm_status": "SALE_DONE",
      "crm_note": "alt.john@domain.com | Alt Phone: +91 99999 88888 | Raw Notes: Spoke to customer. Interested in 3BHK.",
      "data_source": "meridian_tower",
      "possession_time": "6 months",
      "description": ""
    }
  ],
  "skipped": []
}
---

Now process this batch of raw CSV rows. Make sure to assign the correct rowIndex matching its index in the array:
${JSON.stringify(rows, null, 2)}
`;

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  const parsed = JSON.parse(text);

  const imported: CRMRecord[] = [];
  const skipped: SkippedRecord[] = [];

  // Parse mapped records
  if (Array.isArray(parsed.records)) {
    parsed.records.forEach((rec: any) => {
      const { rowIndex, ...crmFields } = rec;
      imported.push(crmFields as CRMRecord);
    });
  }

  // Parse skipped records by indexing back to originalRow
  if (Array.isArray(parsed.skipped)) {
    parsed.skipped.forEach((skip: any) => {
      const idx = skip.rowIndex;
      const originalRow = (idx >= 0 && idx < rows.length) ? rows[idx] : {};
      skipped.push({
        originalRow,
        reason: skip.reason || "Row skipped during AI parsing constraints.",
      });
    });
  }

  return { imported, skipped };
}

/**
 * Execute Gemini CSV mapping with retry capabilities.
 * If a batch fails twice, marks all rows inside it as skipped.
 */
export async function mapBatchWithRetry(
  rows: Record<string, any>[],
  batchIndex: number
): Promise<BatchMappingResult> {
  let attempt = 1;
  while (attempt <= 2) {
    try {
      console.log(`[AI CLIENT] [BATCH ${batchIndex + 1}] Processing attempt ${attempt}/2...`);
      const startTime = Date.now();
      const result = await callGeminiModel(rows);
      const elapsed = Date.now() - startTime;
      console.log(`[AI CLIENT] [BATCH ${batchIndex + 1}] Success in ${elapsed}ms. Mapped ${result.imported.length} records, skipped ${result.skipped.length}.`);
      return result;
    } catch (err: any) {
      console.warn(`[AI CLIENT] [BATCH ${batchIndex + 1}] Attempt ${attempt}/2 failed. Error: ${err.message}`);
      attempt++;
      if (attempt <= 2) {
        console.log(`[AI CLIENT] [BATCH ${batchIndex + 1}] Retrying mapping...`);
      }
    }
  }

  // If both attempts fail: skip all rows in this batch
  console.error(`[AI CLIENT] [BATCH ${batchIndex + 1}] AI mapping failed after retry limits. Skipping all ${rows.length} rows.`);
  return {
    imported: [],
    skipped: rows.map((row) => ({
      originalRow: row,
      reason: "AI processing failed after retry",
    })),
  };
}
