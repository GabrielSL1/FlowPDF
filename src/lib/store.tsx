
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

  // Carrega pastas do usuário em tempo real do Firestore
  const foldersQuery = useMemo(() => 
    user ? query(collection(db, 'folders'), where('userId', '==', user.uid), orderBy('createdAt', 'asc')) : null
  , [db, user]);
  
  const { data: foldersData } = useCollection<Folder>(foldersQuery);

  // Carrega documentos do usuário em tempo real do Firestore
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
    try {
      await addDoc(collection(db, 'folders'), {
        name: name.trim(),
        parentId,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao criar pasta no Firestore:", error);
      throw error;
    }
  }, [db, user]);

  const deleteFolder = useCallback(async (id: string) => {
    if (!user) return;
    
    // Lógica recursiva para encontrar todos os IDs de subpastas para deletar
    const findFolderIds = (parentId: string, allFolders: Folder[]): string[] => {
      let ids = [parentId];
      const children = allFolders.filter(f => f.parentId === parentId);
      children.forEach(child => {
        ids = [...ids, ...findFolderIds(child.id, allFolders)];
      });
      return ids;
    };

    const folderIdsToDelete = findFolderIds(id, state.folders);

    try {
      // Deleta todos os documentos associados a essas pastas
      for (const fId of folderIdsToDelete) {
        const docsInFolder = state.documents.filter(d => d.folderId === fId);
        for (const d of docsInFolder) {
          await deleteDoc(doc(db, 'documents', d.id));
        }
        // Deleta a pasta
        await deleteDoc(doc(db, 'folders', fId));
      }
      
      // Se a pasta atual for uma das deletadas, volta para a raiz
      if (currentFolderId && folderIdsToDelete.includes(currentFolderId)) {
        setCurrentFolderId(null);
      }
    } catch (error) {
      console.error("Erro na exclusão recursiva:", error);
    }
  }, [db, user, state.folders, state.documents, currentFolderId]);

  const addDocument = useCallback(async (docData: Omit<Document, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'documents'), {
        ...docData,
        userId: user.uid,
        uploadDate: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao salvar documento no Firestore:", error);
    }
  }, [db, user]);

  const deleteDocument = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (error) {
      console.error("Erro ao deletar documento no Firestore:", error);
    }
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
