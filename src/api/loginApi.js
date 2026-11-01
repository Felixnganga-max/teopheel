import { api, refreshSession, setAccessToken, setRefreshToken, getRefreshToken } from './client';
import { useMutation } from './hooks';

export async function loginRequest(email, password) {
  const body = await api.post('/auth/login', { email, password });
  setAccessToken(body.data.accessToken);
  setRefreshToken(body.data.refreshToken);
  return body; // data: { accessToken, user }
}

export const refreshRequest = () => refreshSession(); // resolves { accessToken, user }

export async function logoutRequest() {
  try { await api.post('/auth/logout', { refreshToken: getRefreshToken() || undefined }); } finally { setAccessToken(null); setRefreshToken(null); }
}

export const meRequest = () => api.get('/auth/me');

export const changePasswordRequest = (currentPassword, newPassword) =>
  api.post('/auth/change-password', { currentPassword, newPassword });

export const useLogin = () => useMutation(loginRequest);
export const useLogout = () => useMutation(logoutRequest);
export const useChangePassword = () => useMutation(changePasswordRequest);
