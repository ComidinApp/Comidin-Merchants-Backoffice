// src/api/subscription.js

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
