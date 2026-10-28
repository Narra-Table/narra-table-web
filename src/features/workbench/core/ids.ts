export type IdFactory = (prefix: string) => string;

let sequence = 0;

/** Default id factory. Inject a deterministic one in tests and restore flows. */
export function createId(prefix = 'id'): string {
  sequence += 1;
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}-${uuid.slice(0, 8)}`;
  return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

/** Deterministic factory for tests and the demo self-check. */
export function createSequentialIdFactory(startAt = 0): IdFactory {
  let next = startAt;
  return (prefix) => {
    next += 1;
    return `${prefix}-${next}`;
  };
}
