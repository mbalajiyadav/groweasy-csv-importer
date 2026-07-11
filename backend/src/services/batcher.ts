/**
 * Splits an array of records into batches of size ~15-20
 */
export function batchRows<T>(rows: T[], batchSize: number = 20): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }
  return batches;
}
