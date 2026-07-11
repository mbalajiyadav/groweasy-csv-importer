/**
 * Simple Promise Pool helper
 * Executes async tasks with limited concurrency.
 */
export async function runWithConcurrencyLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];
      results[index] = await fn(item, index);
    }
  }

  const workers: Promise<void>[] = [];
  const activeLimit = Math.min(limit, items.length);
  for (let i = 0; i < activeLimit; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}
