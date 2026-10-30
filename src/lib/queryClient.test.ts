import { afterEach, describe, expect, it } from 'vitest';
import { clearSessionQueries, queryClient } from './queryClient';

afterEach(() => queryClient.clear());

describe('query client session cache', () => {
  it('clears player queries without removing administrator queries', () => {
    queryClient.setQueryData(['/api/me'], { username: 'player' });
    queryClient.setQueryData(['admin', 'dashboard'], { userCount: 1 });

    clearSessionQueries('user');

    expect(queryClient.getQueryData(['/api/me'])).toBeUndefined();
    expect(queryClient.getQueryData(['admin', 'dashboard'])).toEqual({ userCount: 1 });
  });

  it('clears administrator queries without removing player queries', () => {
    queryClient.setQueryData(['/api/me'], { username: 'player' });
    queryClient.setQueryData(['admin', 'dashboard'], { userCount: 1 });

    clearSessionQueries('admin');

    expect(queryClient.getQueryData(['/api/me'])).toEqual({ username: 'player' });
    expect(queryClient.getQueryData(['admin', 'dashboard'])).toBeUndefined();
  });
});
