import { BASE_URL } from './api';

const parseResponse = async (res) => {
  if (res.ok) {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    }
    return null;
  }

  let message = 'Authentication request failed';
  try {
    const data = await res.json();
    if (data?.message) {
      message = data.message;
    }
  } catch (_) {
    try {
      const text = await res.text();
      if (text) {
        message = text;
      }
    } catch (__) {
      // ignore
    }
  }
  throw new Error(message);
};

export const authApi = {
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return parseResponse(res);
  },

  signup: async ({ email, password, displayName, theme = 'system' }) => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, theme }),
    });
    return parseResponse(res);
  },

  logout: async (token) => {
    if (!token) {
      return;
    }
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
    });
  },
};

