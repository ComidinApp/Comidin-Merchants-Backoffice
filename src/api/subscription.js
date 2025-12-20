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

async function fetchJson(url, token) {
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // Intentamos leer body siempre
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = body?.error || body?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

/**
 * Devuelve beneficios efectivos por comercio.
 * Prueba:
 *  - /api/subscription/...
 *  - /subscription/...
 */
export async function fetchBenefitsByCommerceId(commerceId) {
  const token = getToken();

  if (commerceId == null) {
    throw new Error('commerceId requerido en fetchBenefitsByCommerceId');
  }

  const urlApi = `${API_BASE}/api/subscription/commerce/${commerceId}/benefits`;
  const urlNoApi = `${API_BASE}/subscription/commerce/${commerceId}/benefits`;

  try {
    return await fetchJson(urlApi, token);
  } catch (e) {
    // Si es 404, probamos la ruta sin /api
    if (e?.status === 404) {
      return fetchJson(urlNoApi, token);
    }
    throw e;
  }
}
