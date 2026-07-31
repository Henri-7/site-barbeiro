const apiUrl = import.meta.env.VITE_API_URL || '/api';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    },
    ...init
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    const error = new Error(payload.error?.message || 'Não foi possível completar a operação.');
    Object.assign(error, { details: payload.error?.details, code: payload.error?.code });
    throw error;
  }

  return payload.data;
}
