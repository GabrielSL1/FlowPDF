
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
  sharedWith?: string[];
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  userId?: string;
  isPublic?: boolean;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'upload_success' | 'info';
  createdAt: string;
  read: boolean;
}

export type OriginFilter = 'all' | 'mine' | 'shared' | 'public';
export type DateFilter = 'all' | 'today' | '7d' | '30d' | 'custom';

export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface DocuFlowState {
  folders: Folder[];
  documents: Document[];
  members: Member[];
  currentFolderId: string | null;
  searchQuery: string;
  originFilter: OriginFilter;
  dateFilter: DateFilter;
  customDateRange: DateRange;
}
