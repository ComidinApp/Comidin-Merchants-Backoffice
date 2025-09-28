// Usa la URL base del front que ya tenés en env
const API_BASE =
  import.meta?.env?.VITE_API_COMIDIN ||
  'https://api.comidin.com.ar';

// Funcióncita para encontrar el JWT (localStorage común + patrón de Cognito)
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

// Lee un posible auth guardado para inferir el commerce del usuario.
// Si es admin (role_id === 1), devolvemos null para NO forzar comercio.
function getCommerceIdFromAuth() {
  try {
    const raw = localStorage.getItem('authUser') || localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      const roleId = parsed?.user?.role_id ?? parsed?.role_id;
      const commerceId = parsed?.user?.commerce?.id ?? parsed?.commerce?.id;
      if (Number(roleId) === 1) return null;
      return Number.isFinite(Number(commerceId)) ? Number(commerceId) : null;
    }
  } catch {
    // ignoramos errores de parseo
  }
  return null;
}

export async function fetchOverview(period = 'last30d', commerceIdParam) {
  const token = getToken();
  const commerceId = commerceIdParam ?? getCommerceIdFromAuth();

  const qs = new URLSearchParams({ period });
  if (commerceId != null) qs.set('commerceId', String(commerceId));

  const res = await fetch(`${API_BASE}/api/analytics/overview?${qs.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
