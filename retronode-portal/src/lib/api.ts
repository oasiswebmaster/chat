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
  upload: (parentId: string, files: File[], onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append('parentId', parentId);
    files.forEach((file) => formData.append('files[]', file));

    return new Promise<{ ok: true; root: FileSystemNode }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/upload.php`);
      xhr.withCredentials = true;

      if (xhr.upload && onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        });
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.ok !== false) {
              resolve(data);
            } else {
              reject(new Error(data.error || 'Upload failed'));
            }
          } catch (e) {
            reject(new Error('Invalid response'));
          }
        } else {
          reject(new Error(`HTTP error: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  },
  rename: (id: string, newName: string) =>
    request<{ ok: true; root: FileSystemNode }>('/rename.php', {
      method: 'POST',
      body: JSON.stringify({ id, newName }),
    }),
  remove: (id: string) =>
    request<{ ok: true; root: FileSystemNode }>('/delete.php', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  restore: (id: string) =>
    request<{ ok: true; root: FileSystemNode }>('/restore.php', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  diskspace: () => request<{ ok: true; diskspace: any }>('/diskspace.php'),
  submitDoc: (name: string, email: string, message: string, file: File) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('message', message);
    formData.append('file', file);
    return request<{ ok: true; message: string }>('/submit_doc.php', { method: 'POST', body: formData });
  },
  getChatTalks: () => request<{ ok: true; talks: any[] }>('/chat.php?action=list_talks'),
  getChatMessages: (talkId: number) => request<{ ok: true; messages: any[] }>(`/chat.php?action=get_messages&talk_id=${talkId}`),
  sendChatMessage: (talkId: number, message: string) =>
    request<{ ok: true; success: boolean }>(`/chat.php?action=send_message&talk_id=${talkId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  createChatTalk: (type: 'private' | 'group', targetIdOrIds: number | number[], groupName?: string) =>
    request<{ ok: true; talk_id: number }>('/chat.php?action=create_talk', {
      method: 'POST',
      body: JSON.stringify({
        type,
        participant_id: typeof targetIdOrIds === 'number' ? targetIdOrIds : undefined,
        participant_ids: Array.isArray(targetIdOrIds) ? targetIdOrIds : undefined,
        name: groupName
      }),
    }),
  getPortalUsers: () => request<{ ok: true; users: any[] }>('/users.php'),
  downloadUrl: (id: string) => `${API_BASE}/download.php?id=${encodeURIComponent(id)}`,
};
