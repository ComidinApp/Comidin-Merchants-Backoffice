// src/api/publicationLimits.js

// IMPORTANTÍSIMO:
// Usamos el mismo base que tu front usa para POST/PUT de publication.
// Si VITE_API_COMIDIN ya viene con "/api", perfecto.
// Si no viene, usamos fallback con "/api" porque en prod te funciona así.
const API_BASE =
  import.meta?.env?.VITE_API_COMIDIN ||
  'https://api.comidin.com.ar/api';

function getToken() {
  const direct =
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('idToken');
  if (direct) return direct;

  // Sin for-loops: Array.from
  const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
  const cognitoKey = keys.find(
    (k) => k && k.includes('CognitoIdentityServiceProvider') && k.endsWith('.idToken')
  );

  if (cognitoKey) {
    const val = localStorage.getItem(cognitoKey);
    if (val) return val;
  }
  return null;
}

async function fetchJson(url) {
  const token = getToken();
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

/**
 * Beneficios efectivos por comercio
 * GET /subscriptions/commerce/:commerceId/benefits
 */
export async function fetchBenefitsByCommerceId(commerceId) {
  return fetchJson(`${API_BASE}/subscriptions/commerce/${commerceId}/benefits`);
}

/**
 * Publicaciones por comercio
 * ✅ Confirmado por tu backend routes/publication.js
 * GET /publication/commerce/:commerceId
 */
async function fetchPublicationsByCommerceId(commerceId) {
  const data = await fetchJson(`${API_BASE}/publication/commerce/${commerceId}`);

  // tu controller normalmente devuelve array directo
  if (Array.isArray(data)) return data;

  // por si alguna vez devolvés {data: []} o {rows: []}
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;

  // si no viene en formato esperado:
  throw new Error('Formato inesperado al listar publicaciones del comercio');
}

/**
 * Regla de "publicación activa" para el cupo:
 * - is_active === 'active'
 * - expiration_date > ahora
 */
function isActiveAndNotExpired(pub, now) {
  const active = String(pub?.is_active || '').toLowerCase() === 'active';

  const expRaw = pub?.expiration_date || pub?.expirationDate || pub?.expires_at || null;
  if (!expRaw) return active;

  const exp = new Date(expRaw);
  if (Number.isNaN(exp.getTime())) return active;

  return active && exp.getTime() > now.getTime();
}

/**
 * Valida límite antes de crear publicación
 * Devuelve { allowed, reason, maxPublications, activeCount }
 */
export async function canCreatePublication({ commerceId }) {
  const cid = Number(commerceId);
  if (!cid) {
    return { allowed: false, reason: 'No se pudo determinar el comercio.' };
  }

  const [benefits, pubs] = await Promise.all([
    fetchBenefitsByCommerceId(cid),
    fetchPublicationsByCommerceId(cid),
  ]);

  const max = benefits?.max_publications ?? 0; // null => ilimitadas
  if (max == null) {
    return { allowed: true, maxPublications: null, activeCount: 0 };
  }

  const now = new Date();
  const activeCount = (pubs || []).filter((p) => isActiveAndNotExpired(p, now)).length;

  if (activeCount >= Number(max)) {
    return {
      allowed: false,
      reason: `Alcanzaste el máximo de publicaciones activas permitidas para tu suscripción (${activeCount}/${max}).`,
      maxPublications: Number(max),
      activeCount,
    };
  }

  return { allowed: true, maxPublications: Number(max), activeCount };
}
