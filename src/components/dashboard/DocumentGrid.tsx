
"use client";

import React from 'react';
import { useFlowPDF } from '@/lib/store';
import { FileText, MoreVertical, Trash2, Eye, ExternalLink } from 'lucide-react';
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
import Image from 'next/image';

export function DocumentGrid() {
  const { state, deleteDocument } = useFlowPDF();
  const [viewingDoc, setViewingDoc] = React.useState<string | null>(null);

  const filteredDocs = state.documents.filter(doc => {
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
            <div className="aspect-[4/5] bg-slate-100/50 relative group-hover:bg-slate-200/50 transition-colors overflow-hidden border-b flex items-center justify-center p-6">
              
              {/* PDF Preview: Styled as a physical Paper */}
              <div className="w-full h-full bg-white shadow-lg rounded-sm border border-border/40 relative overflow-hidden transform transition-all group-hover:scale-[1.02] group-hover:-translate-y-1 flex flex-col">
                
                {/* Visual Header of the Paper */}
                <div className="h-4 w-full bg-slate-50 border-b border-slate-100 flex items-center px-2 gap-1">
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                </div>

                {/* Simulated Content/Thumbnail */}
                <div className="flex-1 relative">
                  <Image 
                    src={doc.thumbnailUrl || `https://picsum.photos/seed/${doc.id}/300/400`}
                    alt={doc.name}
                    width={300}
                    height={400}
                    className="object-cover opacity-80 mix-blend-multiply grayscale-[20%] group-hover:opacity-100 transition-opacity w-full h-full"
                    data-ai-hint="document paper"
                  />
                  
                  {/* Subtle Text Lines Overlay (Simulated Preview Effect) */}
                  <div className="absolute inset-0 p-4 space-y-3 opacity-40 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <div className="h-2 w-3/4 bg-slate-200 rounded-full" />
                    <div className="h-2 w-1/2 bg-slate-200 rounded-full" />
                    <div className="h-2 w-full bg-slate-100 rounded-full" />
                    <div className="h-2 w-2/3 bg-slate-100 rounded-full" />
                  </div>
                </div>

                {/* Paper Texture and Lighting */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-white/10 pointer-events-none" />
                
                {/* Corner Fold Visual */}
                <div className="absolute top-0 right-0 w-6 h-6 bg-white/60 backdrop-blur-sm border-l border-b border-black/5 rounded-bl-sm flex items-center justify-center pointer-events-none">
                   <div className="w-0 h-0 border-t-[10px] border-t-slate-200 border-r-[10px] border-r-transparent" />
                </div>
              </div>

              {/* Actions Overlay */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/95 backdrop-blur-sm shadow-md hover:bg-white border-none">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 shadow-xl">
                    <DropdownMenuItem onClick={() => setViewingDoc(doc.id)}>
                      <Eye className="w-4 h-4 mr-2" /> Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(doc.url, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" /> Abrir Original
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteDocument(doc.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="p-4 bg-white relative">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-sm truncate flex-1 text-foreground/90 leading-tight" title={doc.name}>{doc.name}</h3>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3 font-semibold">
                <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">PDF</span>
                <span>•</span>
                <span>{doc.size}</span>
                <span>•</span>
                <span>{format(new Date(doc.uploadDate), 'dd/MM/yyyy')}</span>
              </div>
              
              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[9px] px-2 py-0 bg-accent/5 text-accent border-none font-bold uppercase tracking-widest">
                      {tag}
                    </Badge>
                  ))}
                  {doc.tags.length > 2 && (
                    <span className="text-[9px] font-bold text-muted-foreground/60">+{doc.tags.length - 2}</span>
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
