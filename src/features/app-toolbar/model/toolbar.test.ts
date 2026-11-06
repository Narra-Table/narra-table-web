import { describe, expect, it } from 'vitest';
import { resolveAppToolbarMode } from './toolbar';

describe('resolveAppToolbarMode', () => {
  it('selects the route fallback', () => {
    expect(resolveAppToolbarMode('/')).toBe('home');
    expect(resolveAppToolbarMode('/spaces/space-1')).toBe('chat');
    expect(resolveAppToolbarMode('/message')).toBe('chat');
    expect(resolveAppToolbarMode('/login')).toBe('hidden');
  });
});
