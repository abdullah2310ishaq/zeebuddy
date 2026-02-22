const API_BASE = '/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { success: false, error: json.error || 'Request failed', ...json };
  }
  return { success: true, data: json.data ?? json, ...json };
}

export async function apiUpload<T = { url: string; publicId: string }>(
  path: string,
  formData: FormData
): Promise<{ success: boolean; data?: T; error?: string; code?: string }> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: formData, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = json.error || json.message || 'Upload failed';
    if (process.env.NODE_ENV === 'development') {
      console.error('[apiUpload]', res.status, errMsg, json.code);
    }
    return { success: false, error: errMsg, code: json.code, ...json };
  }
  return { success: true, data: json.data ?? json, ...json };
}

export function setAdminToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
}

export function clearAdminToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}
