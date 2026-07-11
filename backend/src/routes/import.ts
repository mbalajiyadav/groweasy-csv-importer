import { Router, Request, Response, NextFunction } from "express";
import { batchRows } from "../services/batcher.js";
import { mapBatchWithRetry } from "../services/aiClient.js";
import { validateCRMRecord } from "../services/validator.js";
import { runWithConcurrencyLimit } from "../services/concurrency.js";
import { CRMRecord, SkippedRecord } from "../types/crm.js";

const router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({
        error: "Malformed request payload. 'rows' array is required in request body.",
      });
    }

    if (rows.length === 0) {
      return res.status(400).json({
        error: "The 'rows' array is empty. Provide at least one CSV row object to map.",
      });
    }

    const concurrencyLimit = parseInt(process.env.API_CONCURRENCY_LIMIT || "3", 10);
    const batchSize = 20;

    // Split rows into batches of ~15-20 rows
    const batches = batchRows(rows, batchSize);

    console.log(`[ROUTER] Starting CSV import execution: processing ${rows.length} rows split into ${batches.length} batches (concurrency limit: ${concurrencyLimit})`);

    const imported: CRMRecord[] = [];
    const skipped: SkippedRecord[] = [];

    // Run mapping on batches concurrently via our Promise Pool
    const batchResults = await runWithConcurrencyLimit(
      batches,
      concurrencyLimit,
      async (batch, index) => {
        return await mapBatchWithRetry(batch, index);
      }
    );

    // Consolidate batch results
    batchResults.forEach((batchResult, batchIndex) => {
      const batch = batches[batchIndex];

      // Perform post-AI validation checks on successfully mapped rows
      batchResult.imported.forEach((record) => {
        const validation = validateCRMRecord(record);
        if (validation.isValid) {
          imported.push(record);
        } else {
          // Find original row matching validation failure
          const originalRowMatch = batch.find((r) => {
            const emailKey = Object.keys(r).find((k) => /email|mail|e-mail/i.test(k));
            const phoneKey = Object.keys(r).find((k) => /phone|mobile|tel|contact/i.test(k));
            return (
              (emailKey && r[emailKey] === record.email) ||
              (phoneKey && r[phoneKey] === record.mobile_without_country_code)
            );
          }) || batch[0] || {};

          skipped.push({
            originalRow: originalRowMatch,
            reason: validation.reason || "Validation check failed on AI fields.",
          });
        }
      });

      skipped.push(...batchResult.skipped);
    });

    console.log(`[ROUTER] Mapped request successfully finished. Total imported: ${imported.length}, Total skipped: ${skipped.length}`);

    return res.status(200).json({
      imported,
      skipped,
      totalImported: imported.length,
      totalSkipped: skipped.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
