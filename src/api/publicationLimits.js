// src/api/publicationLimits.js

const API_BASE =
  import.meta?.env?.VITE_API_COMIDIN ||
  'https://api.comidin.com.ar';

function getToken() {
  const direct =
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('idToken');
  if (direct) return direct;

  // Evitar for..of / iterators: usamos Array.from + find
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
 * GET /api/subscriptions/commerce/:commerceId/benefits
 */
export async function fetchBenefitsByCommerceId(commerceId) {
  return fetchJson(`${API_BASE}/api/subscriptions/commerce/${commerceId}/benefits`);
}

/**
 * Intenta obtener publicaciones por comercio sin loops.
 * Lanza todas las requests candidatas en paralelo y toma la primera que devuelva un array.
 *
 * ⚠️ Ideal: reemplazar candidates por el endpoint real único de tu backend.
 */
async function fetchPublicationsByCommerceId(commerceId) {
  const candidates = [
    `${API_BASE}/publication/commerce/${commerceId}`,
    `${API_BASE}/api/publication/commerce/${commerceId}`,
    `${API_BASE}/publications/commerce/${commerceId}`,
    `${API_BASE}/api/publications/commerce/${commerceId}`,
    `${API_BASE}/publication?commerceId=${commerceId}`,
    `${API_BASE}/api/publication?commerceId=${commerceId}`,
  ];

  const settled = await Promise.allSettled(candidates.map((url) => fetchJson(url)));

  const normalizeToArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.rows)) return data.rows;
    return null;
  };

  const firstOk = settled
    .map((r) => (r.status === 'fulfilled' ? normalizeToArray(r.value) : null))
    .find((arr) => Array.isArray(arr));

  if (firstOk) return firstOk;

  // si todas fallaron, devolvemos el primer error “útil”
  const firstErr = settled.find((r) => r.status === 'rejected');
  if (firstErr && firstErr.reason) throw firstErr.reason;

  throw new Error('No se pudo obtener el listado de publicaciones del comercio');
}

function isActiveAndNotExpired(pub, now) {
  const active = String(pub?.is_active || '').toLowerCase() === 'active';

  const expRaw = pub?.expiration_date || pub?.expirationDate || pub?.expires_at || null;
  if (!expRaw) return active;

  const exp = new Date(expRaw);
  if (Number.isNaN(exp.getTime())) return active;

  return active && exp.getTime() > now.getTime();
}

/**
 * Valida límite antes de crear.
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
      reason: `Superaste el máximo de publicaciones activas permitidas para tu suscripción (${activeCount}/${max}).`,
      maxPublications: Number(max),
      activeCount,
    };
  }

  return { allowed: true, maxPublications: Number(max), activeCount };
}
