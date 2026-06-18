import { FileSystemNode, PortalSession } from '../types';

const API_BASE = (import.meta.env.VITE_PORTAL_API_BASE || '/api/retronode').replace(/\/$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  // Handle empty responses
  const data = text ? JSON.parse(text) : null;

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }

  return data as T;
}

export const portalApi = {
  session: () => request<{ ok: true; session: PortalSession }>('/session.php'),
  list: () => request<{ ok: true; root: FileSystemNode }>('/list.php'),
  createFolder: (parentId: string, name: string) =>
    request<{ ok: true; root: FileSystemNode }>('/folders.php', {
      method: 'POST',
      body: JSON.stringify({ parentId, name }),
    }),
  upload: (parentId: string, files: File[]) => {
    const formData = new FormData();
    formData.append('parentId', parentId);
    files.forEach((file) => formData.append('files[]', file));
    return request<{ ok: true; root: FileSystemNode }>('/upload.php', { method: 'POST', body: formData });
  },
  remove: (id: string) =>
    request<{ ok: true; root: FileSystemNode }>('/delete.php', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  downloadUrl: (id: string) => `${API_BASE}/download.php?id=${encodeURIComponent(id)}`,
};
