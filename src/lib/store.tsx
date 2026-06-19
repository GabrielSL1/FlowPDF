
"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Document, Folder, DocuFlowState } from './types';

interface FlowPDFContextType {
  state: DocuFlowState;
  addFolder: (name: string, parentId: string | null) => void;
  deleteFolder: (id: string) => void;
  addDocument: (doc: Document) => void;
  deleteDocument: (id: string) => void;
  setCurrentFolder: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

const INITIAL_FOLDERS: Folder[] = [
  { id: '1', name: 'Financeiro', parentId: null, createdAt: new Date().toISOString() },
  { id: '2', name: 'Jurídico', parentId: null, createdAt: new Date().toISOString() },
  { id: '3', name: 'Faturas', parentId: '1', createdAt: new Date().toISOString() },
];

const INITIAL_DOCS: Document[] = [
  {
    id: 'd1',
    name: 'Relatório Anual 2023.pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    size: '2.4 MB',
    uploadDate: new Date().toISOString(),
    type: 'pdf',
    tags: ['Financeiro', 'Anual'],
    keywords: ['relatório', 'receita', 'crescimento'],
    folderId: '1',
  },
  {
    id: 'd2',
    name: 'Contrato de Prestação de Serviço.pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    size: '1.1 MB',
    uploadDate: new Date().toISOString(),
    type: 'pdf',
    tags: ['Jurídico', 'Contrato'],
    keywords: ['serviço', 'termos'],
    folderId: '2',
  }
];

const FlowPDFContext = createContext<FlowPDFContextType | undefined>(undefined);

export function FlowPDFProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DocuFlowState>({
    folders: INITIAL_FOLDERS,
    documents: INITIAL_DOCS,
    currentFolderId: null,
    searchQuery: '',
  });

  const addFolder = useCallback((name: string, parentId: string | null) => {
    setState(prev => {
      const newFolder: Folder = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        name,
        parentId,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        folders: [...prev.folders, newFolder]
      };
    });
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setState(prev => {
      // Coletar todos os IDs de pastas que devem ser removidas (recursivamente)
      const getChildIds = (parentId: string): string[] => {
        const children = prev.folders.filter(f => f.parentId === parentId);
        let ids = children.map(c => c.id);
        children.forEach(c => {
          ids = [...ids, ...getChildIds(c.id)];
        });
        return ids;
      };

      const idsToRemove = [id, ...getChildIds(id)];

      return {
        ...prev,
        folders: prev.folders.filter(f => !idsToRemove.includes(f.id)),
        documents: prev.documents.filter(d => !d.folderId || !idsToRemove.includes(d.folderId)),
        currentFolderId: (prev.currentFolderId && idsToRemove.includes(prev.currentFolderId)) ? null : prev.currentFolderId
      };
    });
  }, []);

  const addDocument = useCallback((doc: Document) => {
    setState(prev => ({ ...prev, documents: [...prev.documents, doc] }));
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== id),
    }));
  }, []);

  const setCurrentFolder = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, currentFolderId: id }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const value = useMemo(() => ({
    state,
    addFolder,
    deleteFolder,
    addDocument,
    deleteDocument,
    setCurrentFolder,
    setSearchQuery
  }), [state, addFolder, deleteFolder, addDocument, deleteDocument, setCurrentFolder, setSearchQuery]);

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
