import useSWR from 'swr';
import axios from 'axios';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
const { VITE_API_COMIDIN } = import.meta.env;

// Instancia para operaciones directas al backend (DELETE, POST, etc.)
const axiosInstance = axios.create({
  baseURL: VITE_API_COMIDIN,
});

// ----------------------------------------------------------------------

export function useGetProductss() {
  const URL = endpoints.product.list;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      products: data?.products || [],
      productsLoading: isLoading,
      productsError: error,
      productsValidating: isValidating,
      productsEmpty: !isLoading && !data?.products.length,
    }),
    [data?.products, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetProducts(commerceId) {
  const URL = commerceId
    ? `${VITE_API_COMIDIN}/product/commerce/${commerceId}`
    : `${VITE_API_COMIDIN}/product`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      products: data || [],
      productsLoading: isLoading,
      productsError: error,
      productsValidating: isValidating,
      productsEmpty: !isLoading && !data,
      mutateProducts: mutate, // 👈 importante para refrescar cache
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetProduct(productId) {
  const URL = `${VITE_API_COMIDIN}/product/${productId}`;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      product: data || null,
      productLoading: isLoading,
      productError: error,
      productValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
  console.log(memoizedValue);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useSearchProducts(query) {
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

// ----------------------------------------------------------------------
// 🔥 NUEVO: funciones para borrar productos
// ----------------------------------------------------------------------

export async function deleteProduct(id) {
  // Backend: DELETE /product/:id
  const res = await axiosInstance.delete(`/product/${id}`);
  return res.data;
}

export async function deleteProducts(ids) {
  // Borramos todos en paralelo
  const promises = ids.map((id) => axiosInstance.delete(`/product/${id}`));
  await Promise.all(promises);
}
