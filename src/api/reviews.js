const API_BASE =
  import.meta?.env?.VITE_API_COMIDIN || 'https://api.comidin.com.ar';

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
 * Obtiene las calificaciones/reseñas de un comercio
 * GET /rating/commerce/:commerceId
 *
 * @param {number|string} commerceId
 * @returns {Promise<{
 *   commerceId: number,
 *   averageRating: number,
 *   totalRatings: number,
 *   ratings: Array<{
 *     product_image_url: string,
 *     product_name: string,
 *     rate_order: number,
 *     comment: string
 *   }>
 * }>}
 */
export async function getCommerceRatings(commerceId) {
  const token = getToken();
  const url = `${API_BASE}/rating/commerce/${commerceId}`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = body?.error || body?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = body;
    err.url = url;
    throw err;
  }

  return body;
}