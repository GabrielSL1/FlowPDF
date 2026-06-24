"use client";

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { Document, Folder, Member, DocuFlowState, OriginFilter, DateFilter, DateRange, DocumentStatus } from './types';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import {
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface FlowPDFContextType {
  state: DocuFlowState;
  addFolder: (name: string, parentId: string | null, isPublic?: boolean) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  addDocument: (docData: Omit<Document, 'id'>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  updateDocumentSharing: (id: string, sharedWith: string[]) => Promise<void>;
  updateDocumentStatus: (id: string, status: DocumentStatus | null) => Promise<void>;
  updateFolderSharing: (id: string, sharedWith: string[]) => Promise<void>;
  addMember: (name: string, email: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  setCurrentFolder: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setOriginFilter: (filter: OriginFilter) => void;
  setDateFilter: (filter: DateFilter) => void;
  setCustomDateRange: (range: DateRange) => void;
}

const FlowPDFContext = createContext<FlowPDFContextType | undefined>(undefined);

function dedupeById<T extends { id: string }>(...lists: (T[] | null)[]): T[] {
  const map = new Map<string, T>();
  lists.forEach(list => (list || []).forEach(item => map.set(item.id, item)));
  return Array.from(map.values());
}

const DEFAULT_PUBLIC_FOLDER_ID = 'default-arquivos-importantes';
const DEFAULT_PUBLIC_FOLDER_NAME = 'Arquivos Importantes';

export function FlowPDFProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();

  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [originFilter, setOriginFilter] = React.useState<OriginFilter>('all');
  const [dateFilter, setDateFilter] = React.useState<DateFilter>('all');
  const [customDateRange, setCustomDateRange] = React.useState<DateRange>({ start: null, end: null });

  const ownFoldersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'folders'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: ownFoldersData } = useCollection<Folder>(ownFoldersQuery, 'ownFolders');

  const publicFoldersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'folders'), where('isPublic', '==', true));
  }, [db, user]);
  const { data: publicFoldersData } = useCollection<Folder>(publicFoldersQuery, 'publicFolders');

  const sharedFoldersQuery = useMemoFirebase(() => {
    if (!db || !user?.email) return null;
    return query(collection(db, 'folders'), where('sharedWith', 'array-contains', user.email));
  }, [db, user]);
  const { data: sharedFoldersData } = useCollection<Folder>(sharedFoldersQuery, 'sharedFolders');

  React.useEffect(() => {
    if (!db || !user || publicFoldersData === null) return;
    if (publicFoldersData.length > 0) return;

    setDoc(doc(db, 'folders', DEFAULT_PUBLIC_FOLDER_ID), {
      name: DEFAULT_PUBLIC_FOLDER_NAME,
      parentId: null,
      userId: user.uid,
      isPublic: true,
      createdAt: new Date().toISOString()
    }).catch((err) => {
      console.warn("Falha ao criar pasta pública padrão:", err);
    });
  }, [db, user, publicFoldersData]);

  const folders = useMemo(
    () => dedupeById(ownFoldersData, publicFoldersData, sharedFoldersData).sort((a, b) => a.name.localeCompare(b.name)),
    [ownFoldersData, publicFoldersData, sharedFoldersData]
  );

  const publicFolderIds = useMemo(
    () => folders.filter(f => f.isPublic).map(f => f.id).slice(0, 30),
    [folders]
  );

  const sharedFolderIds = useMemo(
    () => folders.filter(f => !f.isPublic && f.userId !== user?.uid).map(f => f.id).slice(0, 30),
    [folders, user?.uid]
  );

  const ownDocsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'documents'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: ownDocsData } = useCollection<Document>(ownDocsQuery, 'ownDocs');

  const sharedDocsQuery = useMemoFirebase(() => {
    if (!db || !user?.email) return null;
    return query(collection(db, 'documents'), where('sharedWith', 'array-contains', user.email));
  }, [db, user]);
  const { data: sharedDocsData } = useCollection<Document>(sharedDocsQuery, 'sharedDocs');

  const publicFolderDocsQuery = useMemoFirebase(() => {
    if (!db || !user || publicFolderIds.length === 0) return null;
    return query(collection(db, 'documents'), where('folderId', 'in', publicFolderIds));
  }, [db, user, publicFolderIds]);
  const { data: publicFolderDocsData } = useCollection<Document>(publicFolderDocsQuery, 'publicFolderDocs');

  const sharedFolderDocsQuery = useMemoFirebase(() => {
    if (!db || !user || sharedFolderIds.length === 0) return null;
    return query(collection(db, 'documents'), where('folderId', 'in', sharedFolderIds));
  }, [db, user, sharedFolderIds]);
  const { data: sharedFolderDocsData } = useCollection<Document>(sharedFolderDocsQuery, 'sharedFolderDocs');

  const documents = useMemo(
    () => dedupeById(ownDocsData, sharedDocsData, publicFolderDocsData, sharedFolderDocsData)
      .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate)),
    [ownDocsData, sharedDocsData, publicFolderDocsData, sharedFolderDocsData]
  );

  const membersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'members'));
  }, [db, user]);
  const { data: membersData } = useCollection<Member>(membersQuery, 'members');

  const members = useMemo(
    () => (membersData || []).sort((a, b) => a.name.localeCompare(b.name)),
    [membersData]
  );

  const state: DocuFlowState = useMemo(() => ({
    folders,
    documents,
    members,
    currentFolderId,
    searchQuery,
    originFilter,
    dateFilter,
    customDateRange,
  }), [folders, documents, members, currentFolderId, searchQuery, originFilter, dateFilter, customDateRange]);

  const addFolder = useCallback(async (name: string, parentId: string | null, isPublic: boolean = false) => {
    if (!user || !db) return;
    const folderData = {
      name: name.trim(),
      parentId,
      userId: user.uid,
      isPublic,
      createdAt: new Date().toISOString()
    };

    addDoc(collection(db, 'folders'), folderData)
      .catch((err) => {
        console.warn("Firestore Error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'folders',
          operation: 'create',
          requestResourceData: folderData,
        }));
      });
  }, [db, user]);

  const deleteFolder = useCallback(async (id: string) => {
    if (!user || !db) return;

    const findFolderIds = (parentId: string, allFolders: Folder[]): string[] => {
      let ids = [parentId];
      const children = allFolders.filter(f => f.parentId === parentId);
      children.forEach(child => {
        ids = [...ids, ...findFolderIds(child.id, allFolders)];
      });
      return ids;
    };

    const folderIdsToDelete = findFolderIds(id, state.folders);
    const folderIdSet = new Set(folderIdsToDelete);
    const docsToDelete = state.documents.filter(d => d.folderId && folderIdSet.has(d.folderId));

    const refsToDelete = [
      ...docsToDelete.map(d => doc(db, 'documents', d.id)),
      ...folderIdsToDelete.map(fId => doc(db, 'folders', fId)),
    ];

    const FIRESTORE_BATCH_LIMIT = 500;
    try {
      for (let i = 0; i < refsToDelete.length; i += FIRESTORE_BATCH_LIMIT) {
        const batch = writeBatch(db);
        refsToDelete.slice(i, i + FIRESTORE_BATCH_LIMIT).forEach(ref => batch.delete(ref));
        await batch.commit();
      }
    } catch (err) {
      console.warn("Firestore Error:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `folders/${id}`,
        operation: 'delete',
        requestResourceData: undefined,
      }));
      return;
    }

    if (currentFolderId && folderIdsToDelete.includes(currentFolderId)) {
      setCurrentFolderId(null);
    }
  }, [db, user, state.folders, state.documents, currentFolderId]);

  const addDocument = useCallback(async (docData: Omit<Document, 'id'>) => {
    if (!user || !db) return;
    const folder = state.folders.find(f => f.id === docData.folderId);
    const finalDocData = {
      ...docData,
      userId: user.uid,
      uploadDate: new Date().toISOString(),
      // Snapshot da visibilidade/compartilhamento da pasta no momento do
      // upload: a regra de leitura de "documents" não pode consultar a
      // coleção "folders" via get()/exists() — o motor de Security Rules do
      // Firestore nega QUALQUER consulta de lista cuja regra dependa disso,
      // mesmo que nenhum documento realmente combine com a query.
      folderIsPublic: !!folder?.isPublic,
      folderSharedWith: folder?.sharedWith || [],
    };

    return addDoc(collection(db, 'documents'), finalDocData)
      .catch(() => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'documents',
          operation: 'create',
          requestResourceData: finalDocData,
        }));
      });
  }, [db, user, state.folders]);

  const deleteDocument = useCallback(async (id: string) => {
    if (!user || !db) return;
    deleteDoc(doc(db, 'documents', id));
  }, [db, user]);

  const updateDocumentSharing = useCallback(async (id: string, sharedWith: string[]) => {
    if (!user || !db) return;
    await updateDoc(doc(db, 'documents', id), { sharedWith }).catch((err) => {
      console.warn("Firestore Error:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `documents/${id}`,
        operation: 'update',
        requestResourceData: { sharedWith },
      }));
    });
  }, [db, user]);

  const updateFolderSharing = useCallback(async (id: string, sharedWith: string[]) => {
    if (!user || !db) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'folders', id), { sharedWith });
      // Mantém em sincronia o snapshot "folderSharedWith" gravado nos documentos
      // (necessário porque a regra de leitura de "documents" não pode consultar
      // a coleção "folders" via get() em consultas de lista). Só os documentos
      // que o próprio usuário possui podem ser atualizados aqui — os demais
      // (de outros colaboradores na mesma pasta) refletem a mudança apenas no
      // próximo envio/edição deles.
      state.documents
        .filter(d => d.folderId === id && d.userId === user.uid)
        .forEach(d => batch.update(doc(db, 'documents', d.id), { folderSharedWith: sharedWith }));
      await batch.commit();
    } catch (err) {
      console.warn("Firestore Error:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `folders/${id}`,
        operation: 'update',
        requestResourceData: { sharedWith },
      }));
    }
  }, [db, user, state.documents]);

  const updateDocumentStatus = useCallback(async (id: string, status: DocumentStatus | null) => {
    if (!user || !db) return;
    await updateDoc(doc(db, 'documents', id), { status }).catch((err) => {
      console.warn("Firestore Error:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `documents/${id}`,
        operation: 'update',
        requestResourceData: { status },
      }));
    });
  }, [db, user]);

  const addMember = useCallback(async (name: string, email: string) => {
    if (!user || !db) return;
    const memberData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      addedBy: user.uid
    };

    addDoc(collection(db, 'members'), memberData)
      .catch((err) => {
        console.warn("Firestore Error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'members',
          operation: 'create',
          requestResourceData: memberData,
        }));
      });
  }, [db, user]);

  const deleteMember = useCallback(async (id: string) => {
    if (!user || !db) return;
    deleteDoc(doc(db, 'members', id));
  }, [db, user]);

  const value = useMemo(() => ({
    state,
    addFolder,
    deleteFolder,
    addDocument,
    deleteDocument,
    updateDocumentSharing,
    updateDocumentStatus,
    updateFolderSharing,
    addMember,
    deleteMember,
    setCurrentFolder: setCurrentFolderId,
    setSearchQuery,
    setOriginFilter,
    setDateFilter,
    setCustomDateRange
  }), [state, addFolder, deleteFolder, addDocument, deleteDocument, updateDocumentSharing, updateDocumentStatus, updateFolderSharing, addMember, deleteMember, setCurrentFolderId, setSearchQuery, setOriginFilter, setDateFilter, setCustomDateRange]);

  return (
    <FlowPDFContext.Provider value={value}>
      {children}
    </FlowPDFContext.Provider>
  );
}

export function useFlowPDF() {
  const context = useContext(FlowPDFContext);
  if (!context) throw new Error('useFlowPDF deve ser usado dentro de um FlowPDFProvider');
  return context;
}
