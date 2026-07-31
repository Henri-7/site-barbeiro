const apiUrl = import.meta.env.VITE_API_URL || '/api';
const accessTokenKey = 'barbearia_admin_access_token';
const refreshTokenKey = 'barbearia_admin_refresh_token';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: { code: string; message: string; details?: unknown };
};

export function getAdminAccessToken() {
  return localStorage.getItem(accessTokenKey) || '';
}

export function getAdminRefreshToken() {
  return localStorage.getItem(refreshTokenKey) || '';
}

export function setAdminTokens(accessToken = '', refreshToken = '') {
  if (accessToken) localStorage.setItem(accessTokenKey, accessToken);
  if (refreshToken) localStorage.setItem(refreshTokenKey, refreshToken);
}

export function clearAdminTokens() {
  localStorage.removeItem(accessTokenKey);
  localStorage.removeItem(refreshTokenKey);
}

async function parsePayload<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      data: null as T,
      error: {
        code: 'INVALID_RESPONSE',
        message: 'Resposta invalida do servidor.'
      }
    };
  }
}

async function refreshAccessToken() {
  const refreshToken = getAdminRefreshToken();
  if (!refreshToken) return '';

  const response = await fetch(`${apiUrl}/admin/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const payload = await parsePayload<{ accessToken: string; refreshToken?: string }>(response);

  if (!response.ok || !payload.success || !payload.data?.accessToken) {
    clearAdminTokens();
    return '';
  }

  setAdminTokens(payload.data.accessToken, payload.data.refreshToken || refreshToken);
  return payload.data.accessToken;
}

export async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const request = async (token: string) => fetch(`${apiUrl}/admin${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers
    }
  });

  let response = await request(getAdminAccessToken());
  if (response.status === 401) {
    const nextToken = await refreshAccessToken();
    if (nextToken) response = await request(nextToken);
  }

  const payload = await parsePayload<T>(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message || 'Nao foi possivel concluir a operacao.');
  }
  return payload.data;
}

export async function adminPublicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}/admin${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });
  const payload = await parsePayload<T>(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message || 'Nao foi possivel concluir a operacao.');
  }
  return payload.data;
}

export function exportCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const headers = Object.keys(rows[0] || {});
  const csv = [
    headers.join(';'),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(';'))
  ].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
