
export interface Document {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  size: string;
  uploadDate: string;
  type: 'pdf';
  tags: string[];
  keywords: string[];
  folderId: string | null;
  userId?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  userId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'upload_success' | 'info';
  createdAt: string;
  read: boolean;
}

export interface DocuFlowState {
  folders: Folder[];
  documents: Document[];
  currentFolderId: string | null;
  searchQuery: string;
}
