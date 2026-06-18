const API_BASE = 'http://localhost:5000/api';

interface DownloadOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
}

/**
 * Helper to download PDF documents from the backend.
 * Uses credentials: 'include' for JWT cookies and handles binary streams and error states.
 */
export async function downloadPdf(
  endpoint: string,
  filename: string,
  options: DownloadOptions = {}
): Promise<void> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    method: options.method || 'GET',
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = 'Error al descargar el PDF';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Fallback if error is not JSON
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
