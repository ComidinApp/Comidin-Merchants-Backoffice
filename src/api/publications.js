// src/api/publication.js

import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const { VITE_API_COMIDIN } = import.meta.env;

// ----------------------------------------------------------------------
// HOOK: Obtener todas las publicaciones (global o por comercio)
// ----------------------------------------------------------------------

export function useGetPublications(commerceId) {
  const URL = commerceId
    ? `${VITE_API_COMIDIN}/publication/commerce/${commerceId}`
    : `${VITE_API_COMIDIN}/publication`;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

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

  return memoizedValue;
}

// ----------------------------------------------------------------------
// HOOK: Obtener una publicación por ID
// ----------------------------------------------------------------------

export function useGetPublication(publicationId) {
  const URL = publicationId ? `${VITE_API_COMIDIN}/publication/${publicationId}` : null;

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

  return memoizedValue;
}

// ----------------------------------------------------------------------
// HOOK: Buscar publicaciones (si se usa)
// ----------------------------------------------------------------------

export function useSearchPublications(query) {
  const URL = query ? [endpoints.product.search, { params: { query } }] : null;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, {
    keepPreviousData: true,
  });

  const memoizedValue = useMemo(
    () => ({
      searchResults: data?.results || [],
      searchLoading: isLoading,
      searchError: error,
      searchValidating: isValidating,
      searchEmpty: !isLoading && !data?.results?.length,
    }),
    [data?.results, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// ACCIÓN: Eliminar una publicación por ID (llama al backend)
// ----------------------------------------------------------------------

export async function deletePublication(id) {
  if (!id && id !== 0) {
    throw new Error('ID de publicación inválido');
  }

  const url = `${VITE_API_COMIDIN}/publication/${id}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const rawText = await response.text();

  if (!response.ok) {
    console.error('Error al eliminar publicación. Respuesta del backend:', rawText);
    throw new Error(
      `Error al eliminar la publicación (status ${response.status}): ${rawText || 'Sin detalles'}`
    );
  }

  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch {
    return {};
  }
}
