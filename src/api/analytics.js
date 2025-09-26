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

export async function fetchOverview(period = 'last30d') {
  const token = getToken(); // si no hay token, el backend devolverá 401
  const res = await fetch(
    `${API_BASE}/api/analytics/overview?period=${encodeURIComponent(period)}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
