const RAW_BACKEND = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.REACT_APP_BACKEND_URL || '';
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
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

const deviceLabel = () =>
  (typeof navigator !== 'undefined' ? navigator.userAgent : 'web').slice(0, 60);

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retryOnRefresh?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Session expired');
        const data = await res.json();
        setTokens(data.access_token, data.refresh_token);
        return data.access_token as string;
      })
      .catch(() => {
        clearTokens();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

async function request<T = any>(path: string, { method = 'GET', body, auth = false, retryOnRefresh = true }: RequestOptions = {}): Promise<T> {
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
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new Error('Network error. Check your connection and try again.');
  }

  if (res.status === 401 && auth && retryOnRefresh && path !== '/auth/refresh') {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, { method, body, auth, retryOnRefresh: false });
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

  refresh: () => refreshAccessToken(),

  logout: (refresh_token: string) =>
    request('/auth/logout', { method: 'POST', body: { refresh_token }, auth: true }),

  logoutAll: () => request('/auth/logout-all', { method: 'POST', auth: true }),

  deleteAccount: (password?: string) =>
    request('/auth/me', { method: 'DELETE', body: password ? { password } : {}, auth: true }),

  updateProfile: (payload: { name?: string; profile_aliases?: Record<string, string>; currency?: string }) =>
    request('/auth/me', { method: 'PATCH', body: payload, auth: true }),
};

export interface SyncSnapshot {
  server_time: string;
  full: boolean;
  bank_accounts: any[];
  credit_cards: any[];
  categories: any[];
  transactions: any[];
  budget_targets: any[];
}

export interface SyncPushPayload {
  bank_accounts: any[];
  credit_cards: any[];
  categories: any[];
  transactions: any[];
  budget_targets: any[];
}

export const ledgerApi = {
  pull: (since?: string) =>
    request<SyncSnapshot>(`/sync/pull${since ? `?since=${encodeURIComponent(since)}` : ''}`, { auth: true }),
  push: (payload: SyncPushPayload) => request('/sync/push', { method: 'POST', body: payload, auth: true }),
  reset: () => request('/data/reset', { method: 'POST', auth: true }),
  me: () => request('/auth/me', { auth: true }),
};
