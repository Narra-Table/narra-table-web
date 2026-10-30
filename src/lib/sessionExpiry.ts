export type SessionScope = 'user' | 'admin';

type SessionExpiryListener = (scope: SessionScope) => void;

const listeners = new Set<SessionExpiryListener>();

export function notifySessionExpired(scope: SessionScope): void {
  for (const listener of listeners) listener(scope);
}

export function subscribeSessionExpiry(listener: SessionExpiryListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
