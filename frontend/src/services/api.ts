const RAW_BACKEND = (import.meta as any).env?.REACT_APP_BACKEND_URL || '';
const API_BASE = `${RAW_BACKEND.replace(/\/$/, '')}/api`;

const ACCESS_KEY = 'rba_access_token';
const REFRESH_KEY = 'rba_refresh_token';

export const setTokens = (access?: string | null, refresh?: string | null) => {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);

const deviceLabel = () =>
  (typeof navigator !== 'undefined' ? navigator.userAgent : 'web').slice(0, 60);

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function request<T = any>(path: string, { method = 'GET', body, auth = false }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Network error. Check your connection and try again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || 'Something went wrong. Please try again.';
    throw new Error(typeof detail === 'string' ? detail : 'Request failed.');
  }
  return data as T;
}

export interface AuthResponse {
  user: any;
  access_token: string;
  refresh_token: string;
}

export interface OtpResponse {
  message: string;
  email: string;
  expires_in: number;
  email_delivery: boolean;
  dev_otp?: string;
}

const persist = (res: AuthResponse) => {
  setTokens(res.access_token, res.refresh_token);
  return res;
};

export const authApi = {
  requestOtp: (payload: { name: string; email: string; password: string; phone?: string; country_code?: string }) =>
    request<OtpResponse>('/auth/register/request-otp', { method: 'POST', body: payload }),

  resendOtp: (email: string) =>
    request<OtpResponse>('/auth/register/resend-otp', { method: 'POST', body: { email } }),

  verify: (payload: { email: string; code: string }) =>
    request<AuthResponse>('/auth/register/verify', {
      method: 'POST',
      body: { ...payload, device: deviceLabel() },
    }).then(persist),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { ...payload, device: deviceLabel() },
    }).then(persist),

  forgotPassword: (email: string) =>
    request<OtpResponse>('/auth/forgot-password', { method: 'POST', body: { email } }),

  resetPassword: (payload: { email: string; code: string; new_password: string }) =>
    request('/auth/reset-password', { method: 'POST', body: payload }),

  googleSession: (session_id: string) =>
    request<AuthResponse>('/auth/google/session', {
      method: 'POST',
      body: { session_id, device: deviceLabel() },
    }).then(persist),
};
