const API = window.__KADO_API__ || 'https://api.kado.care';

async function apiFetch(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}
