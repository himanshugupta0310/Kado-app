const API = window.__KADO_API__ || "https://api.kado.care";

function getToken() {
  return localStorage.getItem("kado_doctor_token");
}
function setToken(t) {
  localStorage.setItem("kado_doctor_token", t);
}
function clearToken() {
  localStorage.removeItem("kado_doctor_token");
}

function authHeaders(extra = {}) {
  const token = getToken();
  const h = { ...extra };
  if (token) h["Authorization"] = "Bearer " + token;
  return h;
}

async function apiFetch(path) {
  const res = await fetch(API + path, { headers: authHeaders() });
  if (!res.ok) throw new Error("API error: " + res.status);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiPatch(path, body) {
  const res = await fetch(API + path, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return res.json();
}
