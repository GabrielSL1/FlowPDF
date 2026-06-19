
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
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface DocuFlowState {
  folders: Folder[];
  documents: Document[];
  currentFolderId: string | null;
  searchQuery: string;
}
