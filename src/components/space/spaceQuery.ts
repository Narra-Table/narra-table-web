import { queryOptions, useQuery } from '@tanstack/react-query';
import { spaceApi } from './spaceApi';

export const spacesQueryOptions = queryOptions({
  queryKey: ['spaces'],
  queryFn: spaceApi.list,
});

export const useSpacesQuery = () => useQuery(spacesQueryOptions);
