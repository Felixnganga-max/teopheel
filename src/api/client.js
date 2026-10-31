// Axios instance + token handling.
// The access token lives in memory only (never localStorage). The refresh token is an httpOnly cookie
// set by the backend, so a page reload silently re-authenticates through /auth/refresh.
import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'https://lpg-gnxf.vercel.app/api';

let accessToken = null;
let onAuthFail = null;
export const setAccessToken = (t) => { accessToken = t; };
export const getAccessToken = () => accessToken;
export const setAuthFailHandler = (fn) => { onAuthFail = fn; };

export class ApiError extends Error {
  constructor(message, status = 0, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors; // [{ field, message }] on validation failures
  }
}

function toApiError(err) {
  if (err.response) {
    const d = err.response.data || {};
    const first = d.errors?.[0];
    return new ApiError(first ? first.message : d.message || 'Request failed', err.response.status, d.errors);
  }
  if (err.code === 'ECONNABORTED') return new ApiError('Request timed out. Try again.');
  return new ApiError('Cannot reach the server. Check your connection.');
}

const client = axios.create({ baseURL: API_URL, withCredentials: true, timeout: 20000 });

client.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

// One refresh at a time, shared by every caller
let refreshing = null;
export function refreshSession() {
  if (!refreshing) {
    refreshing = axios
      .post(`${API_URL}/auth/refresh`, null, { withCredentials: true, timeout: 20000 })
      .then((r) => {
        accessToken = r.data.data.accessToken;
        return r.data.data; // { accessToken, user }
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthCall = original?.url?.startsWith('/auth/');
    if (err.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        await refreshSession();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return client(original);
      } catch {
        accessToken = null;
        onAuthFail?.();
      }
    }
    return Promise.reject(toApiError(err));
  }
);

// Drop undefined / empty values so query strings and bodies stay clean
export const clean = (obj = {}) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''));

// Every helper resolves to the backend body: { success, data, total?, page?, limit?, message? }
export const api = {
  get: (url, params) => client.get(url, { params: clean(params) }).then((r) => r.data),
  post: (url, body, config) => client.post(url, body, config).then((r) => r.data),
  put: (url, body, config) => client.put(url, body, config).then((r) => r.data),
  patch: (url, body, config) => client.patch(url, body, config).then((r) => r.data),
  delete: (url) => client.delete(url).then((r) => r.data),
  blob: (url) => client.get(url, { responseType: 'blob' }).then((r) => r.data),
};

export default client;
