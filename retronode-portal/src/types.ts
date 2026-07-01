export type FileType =
  | 'folder'
  | 'pdf'
  | 'document'
  | 'image'
  | 'audio'
  | 'video'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'unknown';

export interface FileSystemNode {
  id: string;
  name: string;
  type: FileType;
  size: string;
  bytes?: number;
  mime?: string;
  updatedAt: string;
  children?: FileSystemNode[];
  content?: string;
}

export interface PortalSession {
  authenticated: boolean;
  admin: boolean;
  user?: string;
  name?: string;
  email?: string;
}
