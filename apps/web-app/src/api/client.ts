const API_BASE = 'http://localhost:5000/api';

interface ApiError {
  message: string;
  status: number;
}

class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = 'Error en la solicitud';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If we can't parse error JSON, use default message
    }
    throw new ApiClientError(errorMessage, response.status);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function apiUpload(endpoint: string, file: File, folder = 'general'): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE}${endpoint}?folder=${folder}`;

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'Error al subir archivo';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Use default error message
    }
    throw new ApiClientError(errorMessage, response.status);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }),
};

export { ApiClientError };
export type { ApiError };
