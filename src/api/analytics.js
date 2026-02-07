// Usa la URL base del front que ya tenés en env (fallback prod)
const API_BASE =
  import.meta?.env?.VITE_API_COMIDIN ||
  'https://api.comidin.com.ar';

// (Opcional) token — no es necesario para testing si tu backend permite público
function getToken() {
  const direct =
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('idToken');
  if (direct) return direct;

  // patrón de Cognito (por si queda guardado así)
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
 * Pide el overview de analytics.
 * Requiere SIEMPRE commerceId (según tu dominio, incluso para admins).
 *
 * @param {string} period 'last30d' | 'prev_month' | 'custom' etc
 * @param {number} commerceId  // requerido
 * @param {{startDate?: string, endDate?: string}} opts // ✅ NUEVO para custom (YYYY-MM-DD)
 * @returns {Promise<any>}
 */
export async function fetchOverview(period = 'last30d', commerceId, opts = {}) {
  const token = getToken();

  if (commerceId == null) {
    // En tu dominio siempre pertenece a un commerce: lo exigimos para evitar 400 silenciosos
    throw new Error('commerceId requerido en fetchOverview');
  }

  const qs = new URLSearchParams({ period, commerceId: String(commerceId) });

  // ✅ NUEVO: custom range
  if (String(period).toLowerCase() === 'custom') {
    if (opts?.startDate) qs.set('startDate', String(opts.startDate));
    if (opts?.endDate) qs.set('endDate', String(opts.endDate));
  }

  console.debug('[fetchOverview] qs:', qs.toString()); // DEBUG

  const res = await fetch(`${API_BASE}/api/analytics/overview?${qs.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}
