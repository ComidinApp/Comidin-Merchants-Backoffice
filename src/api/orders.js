import useSWR from 'swr';
import { useMemo } from 'react';
export const VITE_API_COMIDIN = import.meta.env.VITE_API_COMIDIN;
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetOrders(commerceId) {
  const URL = commerceId
    ? `${VITE_API_COMIDIN}/order/commerce/${commerceId}`
    : `${VITE_API_COMIDIN}/order`;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);
  console.log(data);

  const memoizedValue = useMemo(
    () => ({
      orders: data || [],
      ordersLoading: isLoading,
      ordersError: error,
      ordersValidating: isValidating,
      ordersEmpty: !isLoading && !data,
    }),
    [data, error, isLoading, isValidating]
  );
  console.log(memoizedValue);

  return memoizedValue;
}

// ---------------------------------------------------------------------- CAMBIAR

export function useGetOrder(orderId) {
  const URL = orderId ? `${VITE_API_COMIDIN}/order/${orderId}` : '';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      order: data,
      orderLoading: isLoading,
      orderError: error,
      orderValidating: isValidating,
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
