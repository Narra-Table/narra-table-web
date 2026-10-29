import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { clearAdminSession } from './adminSession';
import { clearAuth } from './authSession';
import { HttpError } from './httpError';

function handleUnauthorized(error: unknown) {
  if (!(error instanceof HttpError) || error.status !== 401) return;

  if (error.authScope === 'admin') {
    clearAdminSession();
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'admin' });
    window.location.replace('/admin/login');
    return;
  }

  if (error.authScope === 'user') {
    clearAuth();
    queryClient.clear();
    window.location.replace('/login');
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
