/** @vitest-environment jsdom */
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  matchesMediaQuery,
  MEDIA_QUERIES,
  useMediaQuery,
  VIEWPORT_BREAKPOINTS,
} from './responsive';

let matches = false;
const listeners = new Set<EventListener>();

beforeEach(() => {
  matches = false;
  listeners.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: EventListener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: EventListener) => listeners.delete(listener),
      dispatchEvent: () => true,
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('responsive queries', () => {
  it('aligns mobile, tablet, and desktop ranges without gaps', () => {
    expect(VIEWPORT_BREAKPOINTS).toEqual({ tablet: 640, desktop: 1024 });
    expect(MEDIA_QUERIES.mobile).toBe('(max-width: 639px)');
    expect(MEDIA_QUERIES.tablet).toBe('(min-width: 640px) and (max-width: 1023px)');
    expect(MEDIA_QUERIES.desktop).toBe('(min-width: 1024px)');
    expect(MEDIA_QUERIES.compact).toBe('(max-width: 1023px)');
  });

  it('supports synchronous checks and reactive updates by query name', () => {
    expect(matchesMediaQuery('desktop')).toBe(false);
    matches = true;
    expect(matchesMediaQuery('desktop')).toBe(true);

    function Probe() {
      return <output>{useMediaQuery('compact') ? 'compact' : 'desktop'}</output>;
    }

    const view = render(<Probe />);
    expect(screen.getByText('compact')).toBeDefined();

    matches = false;
    act(() => listeners.forEach((listener) => listener(new Event('change'))));
    expect(screen.getByText('desktop')).toBeDefined();
    view.unmount();
    expect(listeners.size).toBe(0);
  });
});
