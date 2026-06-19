
"use client";

import React from 'react';
import { useFlowPDF } from '@/lib/store';
import { FileText, MoreVertical, Trash2, Eye, Download, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { PDFViewerModal } from './PDFViewerModal';

export function DocumentGrid() {
  const { state, deleteDocument } = useFlowPDF();
  const [viewingDoc, setViewingDoc] = React.useState<string | null>(null);

  const filteredDocs = state.documents.filter(doc => {
    // Se estiver no dashboard (currentFolderId === null), mostra todos.
    // Caso contrário, filtra pela pasta.
    const inFolder = state.currentFolderId === null || doc.folderId === state.currentFolderId;
    const matchesSearch = doc.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                        doc.tags.some(tag => tag.toLowerCase().includes(state.searchQuery.toLowerCase()));
    return inFolder && matchesSearch;
  });

  if (filteredDocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <FileText className="w-10 h-10 opacity-20" />
        </div>
        <p className="text-lg font-medium">Nenhum documento encontrado</p>
        <p className="text-sm">Faça upload de um PDF para começar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {filteredDocs.map((doc) => (
        <Card 
          key={doc.id} 
          className="group hover:shadow-xl transition-all duration-300 border-border/50 overflow-hidden cursor-pointer bg-white" 
          onClick={() => setViewingDoc(doc.id)}
        >
          <CardContent className="p-0">
            <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center relative group-hover:bg-muted/50 transition-colors overflow-hidden border-b">
              {/* Document Visual Representation */}
              <div className="w-24 h-32 bg-white shadow-lg rounded-sm border border-border/50 flex flex-col p-2 relative transform transition-transform group-hover:scale-105">
                <div className="absolute top-0 right-0 w-4 h-4 bg-primary/20 border-l border-b border-border/50 rounded-bl-sm" />
                <div className="space-y-1 mt-2">
                  <div className="h-1 w-full bg-muted rounded-full" />
                  <div className="h-1 w-5/6 bg-muted rounded-full" />
                  <div className="h-1 w-full bg-muted rounded-full" />
                  <div className="h-1 w-3/4 bg-muted rounded-full" />
                </div>
                <div className="mt-auto flex justify-center">
                  <FileText className="w-6 h-6 text-primary/30" />
                </div>
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => setViewingDoc(doc.id)}>
                      <Eye className="w-4 h-4 mr-2" /> Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(doc.url, '_blank')}>
                      <Download className="w-4 h-4 mr-2" /> Download
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteDocument(doc.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-sm truncate mb-1 text-foreground" title={doc.name}>{doc.name}</h3>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
                <span className="bg-muted px-1.5 py-0.5 rounded uppercase font-bold">{doc.type}</span>
                <span>•</span>
                <span>{doc.size}</span>
                <span>•</span>
                <span>{format(new Date(doc.uploadDate), 'dd/MM/yyyy')}</span>
              </div>
              
              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {doc.tags.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 bg-primary/5 text-primary border-none font-medium">
                      {tag}
                    </Badge>
                  ))}
                  {doc.tags.length > 2 && (
                    <span className="text-[9px] text-muted-foreground">+{doc.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {viewingDoc && (
        <PDFViewerModal 
          docId={viewingDoc} 
          onClose={() => setViewingDoc(null)} 
        />
      )}
    </div>
  );
}
