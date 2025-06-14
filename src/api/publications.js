import useSWR from 'swr';
import { useMemo } from 'react';
export const VITE_API_COMIDIN = import.meta.env.VITE_API_COMIDIN;
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetPublications(commerceId) {
  const URL = commerceId
    ? `${VITE_API_COMIDIN}/publication/commerce/${commerceId}`
    : '${VITE_API_COMIDIN}/publication';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);
  console.log(data);

  const memoizedValue = useMemo(
    () => ({
      publications: data || [],
      publicationsLoading: isLoading,
      publicationsError: error,
      publicationsValidating: isValidating,
      publicationsEmpty: !isLoading && !data,
    }),
    [data, error, isLoading, isValidating]
  );
  console.log(memoizedValue);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetPublication(publicationId) {
  const URL = publicationId ? `${VITE_API_COMIDIN}/publication/${publicationId}` : '';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      publication: data,
      publicationLoading: isLoading,
      publicationError: error,
      publicationValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  console.log(memoizedValue);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useSearchPublications(query) {
  const URL = query ? [endpoints.product.search, { params: { query } }] : '';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, {
    keepPreviousData: true,
  });

  const memoizedValue = useMemo(
    () => ({
      searchResults: data?.results || [],
      searchLoading: isLoading,
      searchError: error,
      searchValidating: isValidating,
      searchEmpty: !isLoading && !data?.results.length,
    }),
    [data?.results, error, isLoading, isValidating]
  );

  return memoizedValue;
}
