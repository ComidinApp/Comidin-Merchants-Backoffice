// Usa la URL base del front que ya tenés en env (fallback prod)
const API_BASE =
  import.meta?.env?.VITE_API_COMIDIN ||
  'https://api.comidin.com.ar';

// (Opcional) buscar un token si existiera — no es necesario para testing si tu backend permite público
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

// Igual que en PricingCard: obtenemos commerceId del usuario logueado si no nos lo pasan
function getCommerceIdFromAuth() {
  try {
    const raw = localStorage.getItem('authUser') || localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      const roleId = parsed?.user?.role_id ?? parsed?.role_id ?? parsed?.user?.role?.id;
      if (Number(roleId) === 1) return null; // admin → no forzar
      const commerceId =
        parsed?.user?.commerce?.id ??
        parsed?.user?.commerce_id ??
        parsed?.commerce?.id ??
        parsed?.commerce_id ??
        null;
      return Number.isFinite(Number(commerceId)) ? Number(commerceId) : null;
    }
  } catch {
    // ignoramos parse errors
  }
  return null;
}

/**
 * Pide el overview de analytics.
 * - Si NO sos admin, se manda commerceId (del auth) por query automáticamente.
 * - Si sos admin, podés no enviarlo (o pasarlo explícitamente).
 *
 * @param {string} period 'last30d' | 'prev_month'
 * @param {number|undefined|null} commerceIdParam
 * @returns {Promise<any>}
 */
export async function fetchOverview(period = 'last30d', commerceIdParam) {
  const token = getToken();
  const commerceId = commerceIdParam ?? getCommerceIdFromAuth();

  const qs = new URLSearchParams({ period });
  if (commerceId != null) qs.set('commerceId', String(commerceId));

  const res = await fetch(`${API_BASE}/api/analytics/overview?${qs.toString()}`, {
    // Para testing no es necesario, pero lo dejo por compatibilidad futura
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}
