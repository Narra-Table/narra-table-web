import { describe, expect, it } from 'vitest';
import { shortTitle } from './utils';

describe('shortTitle', () => {
  it('keeps emoji and combining marks intact', () => {
    expect(shortTitle('👨‍👩‍👧‍👦地图')).toBe('👨‍👩‍👧‍👦地');
    expect(shortTitle('e\u0301quipe')).toBe('e\u0301q');
  });

  it('returns short titles unchanged', () => {
    expect(shortTitle('聊天')).toBe('聊天');
  });
});
