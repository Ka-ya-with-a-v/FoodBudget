const BASE = ""; // Use relative URL - Vite proxy will handle routing to backend

// 从 localStorage 获取 JWT token
// function getAuthToken() {
//   return localStorage.getItem('token'); // 根据你的成功代码，token 存储在 'token' 键中
// }

// ===== Generic Request Helper =====
async function request(path, { method = "GET", body = null, params = null } = {}) {
  let url = `${BASE}${path}`;
  if (params && Object.keys(params).length) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }

  const headers = {
    "Content-Type": "application/json",
  };

  // 🔐 添加 JWT Token 认证
  // const token = getAuthToken();
  // if (token) {
  //   headers["Authorization"] = `Bearer ${token}`;
  // }

  const opts = {
    method,
    headers,
  };

  if (body != null) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    // 提供更详细的错误信息
    let errorMessage = data?.message || `HTTP ${res.status}`;
    // if (res.status === 401) {
    //   errorMessage = "Unauthorized - 请检查是否已登录或token是否有效";
    // } else if (res.status === 403) {
    //   errorMessage = "Forbidden - 没有访问权限";
    // }
    
    const err = new Error(errorMessage);
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}

// ===== Wrapper helpers =====
async function getJSON(path, params = null) {
  return request(path, { method: "GET", params });
}

async function postJSON(path, body, params = null) {
  return request(path, { method: "POST", body, params });
}

async function putJSON(path, body, params = null) {
  return request(path, { method: "PUT", body, params });
}

async function deleteJSON(path, params = null) {
  return request(path, { method: "DELETE", params });
}

// ===== 认证相关 API =====
export async function login(credentials) {
  return postJSON("/api/auth/login", credentials);
}

export async function register(userData) {
  return postJSON("/api/auth/register", userData);
}

export async function getCurrentUser() {
  return getJSON("/api/auth/me");
}

// ===== 业务功能 API =====

// ✅ Save user address
export async function apiSaveAddress(address) {
  return postJSON("/api/addresses/save", address);
}

// ✅ Find cheaper hawker stall alternatives
export async function findCheaperAlternatives(address, baseDishName, radiusKm = 3) {
  return postJSON("/hawker-stalls/nearby", { address, baseDishName }, { radiusKm });
}

// ===== Token 管理工具函数 =====
// export function isLoggedIn() {
//   return !!getAuthToken();
// }

// export function logout() {
//   localStorage.removeItem('token');
//   // 可以添加重定向到登录页的逻辑
//   window.location.href = '/login';
// }

// ===== 请求拦截器（可选） =====
// 可以在这里添加全局的请求拦截逻辑
// export function setupAuthInterceptor() {
//   // 检查 token 是否过期等
//   const token = getAuthToken();
//   if (token) {
//     // 可以在这里添加 token 自动刷新逻辑
//     console.log('用户已登录，token 存在');
//   }
// }