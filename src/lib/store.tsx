"use client";

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { Document, Folder, Member, DocuFlowState } from './types';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import {
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
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
  addMember: (name: string, email: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  setCurrentFolder: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

const FlowPDFContext = createContext<FlowPDFContextType | undefined>(undefined);

function dedupeById<T extends { id: string }>(...lists: (T[] | null)[]): T[] {
  const map = new Map<string, T>();
  lists.forEach(list => (list || []).forEach(item => map.set(item.id, item)));
  return Array.from(map.values());
}

export function FlowPDFProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();

  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const ownFoldersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'folders'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: ownFoldersData } = useCollection<Folder>(ownFoldersQuery);

  const publicFoldersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'folders'), where('isPublic', '==', true));
  }, [db, user]);
  const { data: publicFoldersData } = useCollection<Folder>(publicFoldersQuery);

  const folders = useMemo(
    () => dedupeById(ownFoldersData, publicFoldersData).sort((a, b) => a.name.localeCompare(b.name)),
    [ownFoldersData, publicFoldersData]
  );

  const publicFolderIds = useMemo(
    () => folders.filter(f => f.isPublic).map(f => f.id).slice(0, 30),
    [folders]
  );

  const ownDocsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'documents'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: ownDocsData } = useCollection<Document>(ownDocsQuery);

  const sharedDocsQuery = useMemoFirebase(() => {
    if (!db || !user?.email) return null;
    return query(collection(db, 'documents'), where('sharedWith', 'array-contains', user.email));
  }, [db, user]);
  const { data: sharedDocsData } = useCollection<Document>(sharedDocsQuery);

  const publicFolderDocsQuery = useMemoFirebase(() => {
    if (!db || !user || publicFolderIds.length === 0) return null;
    return query(collection(db, 'documents'), where('folderId', 'in', publicFolderIds));
  }, [db, user, publicFolderIds]);
  const { data: publicFolderDocsData } = useCollection<Document>(publicFolderDocsQuery);

  const documents = useMemo(
    () => dedupeById(ownDocsData, sharedDocsData, publicFolderDocsData)
      .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate)),
    [ownDocsData, sharedDocsData, publicFolderDocsData]
  );

  const membersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'members'));
  }, [db, user]);
  const { data: membersData } = useCollection<Member>(membersQuery);

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
  }), [folders, documents, members, currentFolderId, searchQuery]);

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

    folderIdsToDelete.forEach(fId => {
      const docsInFolder = state.documents.filter(d => d.folderId === fId);
      docsInFolder.forEach(d => {
        deleteDoc(doc(db, 'documents', d.id));
      });
      deleteDoc(doc(db, 'folders', fId));
    });

    if (currentFolderId && folderIdsToDelete.includes(currentFolderId)) {
      setCurrentFolderId(null);
    }
  }, [db, user, state.folders, state.documents, currentFolderId]);

  const addDocument = useCallback(async (docData: Omit<Document, 'id'>) => {
    if (!user || !db) return;
    const finalDocData = {
      ...docData,
      userId: user.uid,
      uploadDate: new Date().toISOString()
    };

    return addDoc(collection(db, 'documents'), finalDocData)
      .catch(() => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'documents',
          operation: 'create',
          requestResourceData: finalDocData,
        }));
      });
  }, [db, user]);

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

  const addMember = useCallback(async (name: string, email: string) => {
    if (!user || !db) return;
    const memberData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString()
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
    addMember,
    deleteMember,
    setCurrentFolder: setCurrentFolderId,
    setSearchQuery
  }), [state, addFolder, deleteFolder, addDocument, deleteDocument, updateDocumentSharing, addMember, deleteMember, setCurrentFolderId, setSearchQuery]);

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
