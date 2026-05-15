
const BASE = '/api'; 

async function request(path, { method = "GET", body = null, params = null } = {}) {
  let url = `${BASE}${path}`;
  if (params && Object.keys(params).length) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }

  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      
    },
  };

  if (body != null) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

  if (!res.ok) {
    const err = new Error(data && data.message ? data.message : `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}

// POST wrapper
export async function postJSON(path, body, params = null) {
  return request(path, { method: "POST", body, params });
}

// GET wrapper
export async function getJSON(path, params = null) {
  return request(path, { method: "GET", params });
}


export async function generatePlan(plannerRequest, authUserId = null) {
  const params = {};
  if (authUserId) params.authUserId = authUserId;
  return postJSON("/plan", plannerRequest, params);
}


export async function browseAlternatives(planId, dayIndex, mealIndex, limit = 10, authUserId = null) {
  const params = { dayIndex, mealIndex, limit };
  if (authUserId) params.authUserId = authUserId;
  return getJSON(`/plan/${planId}/browse`, params);
}


export async function swapMeal(planId, swapRequest) {
  return postJSON(`/plan/${planId}/swap`, swapRequest);
}
