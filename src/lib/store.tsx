
"use client";

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { Document, Folder, DocuFlowState } from './types';
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { 
  collection, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  doc, 
  orderBy 
} from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

interface FlowPDFContextType {
  state: DocuFlowState;
  addFolder: (name: string, parentId: string | null) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  addDocument: (docData: Omit<Document, 'id'>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  setCurrentFolder: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

const FlowPDFContext = createContext<FlowPDFContextType | undefined>(undefined);

export function FlowPDFProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();
  
  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const foldersQuery = useMemo(() => 
    user ? query(collection(db, 'folders'), where('userId', '==', user.uid), orderBy('createdAt', 'asc')) : null
  , [db, user]);
  
  const { data: foldersData } = useCollection<Folder>(foldersQuery);

  const docsQuery = useMemo(() => 
    user ? query(collection(db, 'documents'), where('userId', '==', user.uid), orderBy('uploadDate', 'desc')) : null
  , [db, user]);
  
  const { data: documentsData } = useCollection<Document>(docsQuery);

  const state: DocuFlowState = useMemo(() => ({
    folders: foldersData || [],
    documents: documentsData || [],
    currentFolderId,
    searchQuery,
  }), [foldersData, documentsData, currentFolderId, searchQuery]);

  const addFolder = useCallback(async (name: string, parentId: string | null) => {
    if (!user) return;
    const folderData = {
      name: name.trim(),
      parentId,
      userId: user.uid,
      createdAt: new Date().toISOString()
    };

    addDoc(collection(db, 'folders'), folderData)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'folders',
          operation: 'create',
          requestResourceData: folderData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  }, [db, user]);

  const deleteFolder = useCallback(async (id: string) => {
    if (!user) return;
    
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
        deleteDoc(doc(db, 'documents', d.id))
          .catch(async () => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: `documents/${d.id}`,
              operation: 'delete'
            }));
          });
      });

      deleteDoc(doc(db, 'folders', fId))
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `folders/${fId}`,
            operation: 'delete'
          }));
        });
    });
    
    if (currentFolderId && folderIdsToDelete.includes(currentFolderId)) {
      setCurrentFolderId(null);
    }
  }, [db, user, state.folders, state.documents, currentFolderId]);

  const addDocument = useCallback(async (docData: Omit<Document, 'id'>) => {
    if (!user) return;
    const finalDocData = {
      ...docData,
      userId: user.uid,
      uploadDate: new Date().toISOString()
    };

    addDoc(collection(db, 'documents'), finalDocData)
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'documents',
          operation: 'create',
          requestResourceData: finalDocData,
        }));
      });
  }, [db, user]);

  const deleteDocument = useCallback(async (id: string) => {
    if (!user) return;
    deleteDoc(doc(db, 'documents', id))
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `documents/${id}`,
          operation: 'delete'
        }));
      });
  }, [db, user]);

  const value = useMemo(() => ({
    state,
    addFolder,
    deleteFolder,
    addDocument,
    deleteDocument,
    setCurrentFolder: setCurrentFolderId,
    setSearchQuery
  }), [state, addFolder, deleteFolder, addDocument, deleteDocument, setCurrentFolderId, setSearchQuery]);

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
