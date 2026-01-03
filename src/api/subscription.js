// src/api/subscription.js
import useSWR from 'swr';
import { useMemo } from 'react';

const API_BASE =
  import.meta?.env?.VITE_API_COMIDIN ||
  'https://api.comidin.com.ar';

function getToken() {
  const direct =
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('idToken');
  if (direct) return direct;

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.includes('CognitoIdentityServiceProvider') && key.endsWith('.idToken')) {
      const val = localStorage.getItem(key);
      if (val) return val;
    }
  }
  return null;
}

const fetcher = async (url) => {
  const token = getToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error || body?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return res.json();
};

/**
 * Devuelve beneficios efectivos por comercio
 * GET /api/subscriptions/commerce/:commerceId/benefits
 */
export async function fetchBenefitsByCommerceId(commerceId) {
  const token = getToken();

  if (commerceId == null) {
    throw new Error('commerceId requerido en fetchBenefitsByCommerceId');
  }

  const res = await fetch(
    `${API_BASE}/api/subscriptions/commerce/${commerceId}/benefits`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error || body?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return res.json();
}

/**
 * Hook para obtener todas las suscripciones (admin)
 * GET /subscriptions
 */
export function useGetAllSubscriptions() {
  const URL = `${API_BASE}/subscriptions`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      subscriptions: data || [],
      subscriptionsLoading: isLoading,
      subscriptionsError: error,
      subscriptionsValidating: isValidating,
      subscriptionsEmpty: !isLoading && (!data || data.length === 0),
      subscriptionsMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

/**
 * Hook para obtener suscripciones por plan (admin)
 * GET /subscriptions/plan/:planId
 */
export function useGetSubscriptionsByPlan(planId) {
  const URL = planId ? `${API_BASE}/subscriptions/plan/${planId}` : null;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      subscriptions: data || [],
      subscriptionsLoading: isLoading,
      subscriptionsError: error,
      subscriptionsValidating: isValidating,
      subscriptionsEmpty: !isLoading && (!data || data.length === 0),
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}
