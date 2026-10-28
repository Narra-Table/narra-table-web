import { describe, expect, it } from 'vitest';
import { nextPinnedIds, sortSpacesByPin } from './pinnedSpaces';

describe('nextPinnedIds', () => {
  it('puts a newly pinned space first', () => {
    expect(nextPinnedIds(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('removes a space that is already pinned', () => {
    expect(nextPinnedIds(['b', 'a'], 'b')).toEqual(['a']);
  });
});

describe('sortSpacesByPin', () => {
  const spaces = [{ spaceId: 'a' }, { spaceId: 'b' }, { spaceId: 'c' }];

  it('keeps the original order when nothing is pinned', () => {
    expect(sortSpacesByPin(spaces, []).map((space) => space.spaceId)).toEqual(['a', 'b', 'c']);
  });

  it('lifts pinned spaces to the front in pin order', () => {
    expect(sortSpacesByPin(spaces, ['c', 'a']).map((space) => space.spaceId)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });
});
