import { CRMRecord } from "../types/crm.js";

const VALID_STATUSES = ["GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE"];
const VALID_SOURCES = ["leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots", ""];

/**
 * Attempts to parse/coerce messy date formats into a clean ISO 8601 string.
 * Supports MM/DD/YYYY, DD/MM/YYYY, numeric timestamps, and general date strings.
 */
function tryCoerceDate(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;

  const trimmed = raw.trim();
  
  // 1. Direct JS Date parse check
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }

  // 2. Numeric timestamp check (e.g. "1719878400000")
  if (/^\d+$/.test(trimmed)) {
    const dNum = new Date(parseInt(trimmed, 10));
    if (!isNaN(dNum.getTime())) {
      return dNum.toISOString();
    }
  }

  // 3. DD/MM/YYYY or MM/DD/YYYY slash/dash custom parser
  const cleanRaw = trimmed.replace(/\s+/g, "");
  const matchParts = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(cleanRaw);
  if (matchParts) {
    const [, first, second, year] = matchParts;
    // Try YYYY-MM-DD
    const d1 = new Date(`${year}-${second}-${first}`);
    if (!isNaN(d1.getTime())) {
      return d1.toISOString();
    }
    // Try YYYY-DD-MM
    const d2 = new Date(`${year}-${first}-${second}`);
    if (!isNaN(d2.getTime())) {
      return d2.toISOString();
    }
  }

  return null;
}

/**
 * Validates a mapped CRMRecord against constraints.
 * Mutates and coerces record fields (like created_at) when possible.
 */
export function validateCRMRecord(record: CRMRecord): { isValid: boolean; reason?: string } {
  // Validate presence of email or mobile
  if (!record.email && !record.mobile_without_country_code) {
    return { isValid: false, reason: "validation: both email and mobile fields are empty" };
  }

  // Validate crm_status
  if (!VALID_STATUSES.includes(record.crm_status)) {
    return { isValid: false, reason: `validation: invalid crm_status '${record.crm_status}'` };
  }

  // Validate data_source
  if (!VALID_SOURCES.includes(record.data_source)) {
    return { isValid: false, reason: `validation: invalid data_source '${record.data_source}'` };
  }

  // Attempt date coercion
  const coercedDate = tryCoerceDate(record.created_at);
  if (coercedDate) {
    record.created_at = coercedDate;
  } else {
    return { isValid: false, reason: `validation: invalid created_at date syntax '${record.created_at}'` };
  }

  return { isValid: true };
}
