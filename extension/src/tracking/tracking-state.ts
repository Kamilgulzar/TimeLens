import { readStore, writeStore, type StoreShape } from "../storage/store.js";

/**
 * Serialized access to the persisted TimeLens store.
 *
 * Chrome's service worker can be woken by several events at once (tab switch +
 * idle change + alarm). Every tracker mutation is routed through `runExclusive`
 * so read-modify-write cycles never interleave and the in-memory cache never
 * goes stale.
 */

let cache: StoreShape | null = null;
let chain: Promise<unknown> = Promise.resolve();

export function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn);
  chain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export async function getState(): Promise<StoreShape> {
  if (!cache) {
    cache = await readStore();
  }
  return cache;
}

/** Mutate the store and persist it. Pass a no-op mutator to persist as-is. */
export async function updateState(
  mutator: (store: StoreShape) => void = () => {}
): Promise<StoreShape> {
  const store = await getState();
  mutator(store);
  await writeStore(store);
  return store;
}