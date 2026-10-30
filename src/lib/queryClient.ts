import { QueryClient } from '@tanstack/react-query';
import type { SessionScope } from './sessionExpiry';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export function clearSessionQueries(scope: SessionScope): void {
  queryClient.removeQueries({
    predicate: (query) => (query.queryKey[0] === 'admin') === (scope === 'admin'),
  });
}
