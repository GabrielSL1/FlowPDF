
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
  serverTimestamp, 
  orderBy 
} from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';

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

  // Carrega pastas do usuário em tempo real
  const foldersQuery = useMemo(() => 
    user ? query(collection(db, 'folders'), where('userId', '==', user.uid), orderBy('createdAt', 'asc')) : null
  , [db, user]);
  
  const { data: foldersData } = useCollection<Folder>(foldersQuery);

  // Carrega documentos do usuário em tempo real
  const docsQuery = useMemo(() => 
    user ? query(collection(db, 'documents'), where('userId', '==', user.uid), orderBy('uploadDate', 'desc')) : null
  , [db, user]);
  
  const { data: documentsData } = useCollection<Document>(docsQuery);

  const addFolder = useCallback(async (name: string, parentId: string | null) => {
    if (!user) return;
    await addDoc(collection(db, 'folders'), {
      name: name.trim(),
      parentId,
      userId: user.uid,
      createdAt: new Date().toISOString()
    });
  }, [db, user]);

  const deleteFolder = useCallback(async (id: string) => {
    if (!user) return;
    // Em uma app de produção, deletaríamos recursivamente as subpastas no Cloud Functions
    // Aqui deletamos a pasta selecionada
    await deleteDoc(doc(db, 'folders', id));
  }, [db, user]);

  const addDocument = useCallback(async (docData: Omit<Document, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, 'documents'), {
      ...docData,
      userId: user.uid,
      uploadDate: new Date().toISOString()
    });
  }, [db, user]);

  const deleteDocument = useCallback(async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'documents', id));
  }, [db, user]);

  const state: DocuFlowState = useMemo(() => ({
    folders: foldersData || [],
    documents: documentsData || [],
    currentFolderId,
    searchQuery,
  }), [foldersData, documentsData, currentFolderId, searchQuery]);

  const value = useMemo(() => ({
    state,
    addFolder,
    deleteFolder,
    addDocument,
    deleteDocument,
    setCurrentFolder: setCurrentFolderId,
    setSearchQuery
  }), [state, addFolder, deleteFolder, addDocument, deleteDocument]);

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
