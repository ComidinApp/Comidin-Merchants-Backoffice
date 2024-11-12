import useSWR from 'swr';
import { useMemo } from 'react';
import axios from 'axios';
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export async function getCommerceById(id) {
  try {
    const URL = `ttp://localhost:3000/commerce/${id}`;

    const response = await axios.get(URL);
    return response;
  } catch (error) {
    console.error('Error fetching employee:', error);
    throw error;
  }
}

export async function createCommerce(commerce) {
  const URL = `ttp://localhost:3000/commerce`;

  try {
    const response = await axios.post(URL, commerce);
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}

export async function changeCommerceStatus(id, status) {
  console.log(status);
  const URL = `ttp://localhost:3000/commerce/status/${id}`;

  try {
    const response = await axios.put(URL, { status });
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}

export async function activateCommerce(id) {
  const URL = `ttp://localhost:3000/commerce/activate/${id}`;

  try {
    const response = await axios.put(URL);
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function useGetCommercess() {
  const URL = endpoints.commerce.list;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      commerces: data?.commerces || [],
      commercesLoading: isLoading,
      commercesError: error,
      commercesValidating: isValidating,
      commercesEmpty: !isLoading && !data?.commerces.length,
    }),
    [data?.commerces, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetCommerces() {
  const URL = 'ttp://localhost:3000/commerce';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);
  console.log(data);

  const memoizedValue = useMemo(
    () => ({
      commerces: data || [],
      commercesLoading: isLoading,
      commercesError: error,
      commercesValidating: isValidating,
      commercesEmpty: !isLoading && !data,
    }),
    [data, error, isLoading, isValidating]
  );
  console.log(memoizedValue);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetCommerce(commerceId) {
  const URL = `ttp://localhost:3000/prodcommerceuct/${commerceId}`;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      commerce: data || null,
      commerceLoading: isLoading,
      commerceError: error,
      commerceValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
  console.log(memoizedValue);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useSearchCommerces(query) {
  const URL = query ? [endpoints.commerce.search, { params: { query } }] : '';

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
