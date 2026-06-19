
"use client";

import React from 'react';
import { useDocuFlow } from '@/lib/store';
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
  const { state, deleteDocument } = useDocuFlow();
  const [viewingDoc, setViewingDoc] = React.useState<string | null>(null);

  const filteredDocs = state.documents.filter(doc => {
    const inFolder = doc.folderId === state.currentFolderId;
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
        <p className="text-lg font-medium">No documents found</p>
        <p className="text-sm">Upload a new PDF to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {filteredDocs.map((doc) => (
        <Card key={doc.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-[4/3] bg-muted flex items-center justify-center relative group-hover:bg-muted/50 transition-colors">
              <FileText className="w-16 h-16 text-primary/40" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8 bg-background shadow-sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setViewingDoc(doc.id)}>
                      <Eye className="w-4 h-4 mr-2" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteDocument(doc.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-sm truncate mb-1 text-foreground" title={doc.name}>{doc.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <span>{doc.size}</span>
                <span>•</span>
                <span>{format(new Date(doc.uploadDate), 'MMM d, yyyy')}</span>
              </div>
              
              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {doc.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-none">
                      {tag}
                    </Badge>
                  ))}
                  {doc.tags.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{doc.tags.length - 3}</span>
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
