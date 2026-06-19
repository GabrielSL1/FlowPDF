
"use client";

import React, { createContext, useContext, useState } from 'react';
import { Document, Folder, DocuFlowState } from './types';

interface DocuFlowContextType {
  state: DocuFlowState;
  addFolder: (name: string, parentId: string | null) => void;
  deleteFolder: (id: string) => void;
  addDocument: (doc: Document) => void;
  deleteDocument: (id: string) => void;
  setCurrentFolder: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

const INITIAL_FOLDERS: Folder[] = [
  { id: '1', name: 'Finance', parentId: null, createdAt: new Date().toISOString() },
  { id: '2', name: 'Legal', parentId: null, createdAt: new Date().toISOString() },
  { id: '3', name: 'Invoices', parentId: '1', createdAt: new Date().toISOString() },
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

const DocuFlowContext = createContext<DocuFlowContextType | undefined>(undefined);

export function DocuFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DocuFlowState>({
    folders: INITIAL_FOLDERS,
    documents: INITIAL_DOCS,
    currentFolderId: null,
    searchQuery: '',
  });

  const addFolder = (name: string, parentId: string | null) => {
    const newFolder: Folder = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      parentId,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, folders: [...prev.folders, newFolder] }));
  };

  const deleteFolder = (id: string) => {
    setState(prev => ({
      ...prev,
      folders: prev.folders.filter(f => f.id !== id),
      documents: prev.documents.filter(d => d.folderId !== id),
    }));
  };

  const addDocument = (doc: Document) => {
    setState(prev => ({ ...prev, documents: [...prev.documents, doc] }));
  };

  const deleteDocument = (id: string) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== id),
    }));
  };

  const setCurrentFolder = (id: string | null) => {
    setState(prev => ({ ...prev, currentFolderId: id }));
  };

  const setSearchQuery = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  return React.createElement(DocuFlowContext.Provider, {
    value: {
      state,
      addFolder,
      deleteFolder,
      addDocument,
      deleteDocument,
      setCurrentFolder,
      setSearchQuery
    }
  }, children);
}

export function useDocuFlow() {
  const context = useContext(DocuFlowContext);
  if (!context) throw new Error('useDocuFlow must be used within a DocuFlowProvider');
  return context;
}
