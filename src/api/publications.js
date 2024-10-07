import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetPublications(commerceId) {
  const URL = commerceId
    ? `http://localhost:3000/publication/commerce/${commerceId}`
    : 'http://localhost:3000/publication';

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

export function useGetPublication(productId) {
  const URL = productId ? [endpoints.product.details, { params: { productId } }] : '';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      publication: data?.product,
      publicationLoading: isLoading,
      publicationError: error,
      publicationValidating: isValidating,
    }),
    [data?.product, error, isLoading, isValidating]
  );

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
