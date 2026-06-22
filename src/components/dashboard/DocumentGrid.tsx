
"use client";

import React from 'react';
import { useFlowPDF } from '@/lib/store';
import { useUser } from '@/firebase';
import { FileText, MoreVertical, Trash2, Eye, ExternalLink, Share2, Users, Globe, Folder as FolderIcon } from 'lucide-react';
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
import { ShareDocumentDialog } from './ShareDocumentDialog';
import { Document, Folder, OriginFilter, DateFilter, DateRange } from '@/lib/types';

function matchesOrigin(doc: Document, folder: Folder | undefined, originFilter: OriginFilter, userId?: string, userEmail?: string | null) {
  if (originFilter === 'all') return true;
  const isOwner = !!userId && doc.userId === userId;
  const isPublicFolder = !!folder?.isPublic;
  if (originFilter === 'mine') return isOwner;
  if (originFilter === 'public') return isPublicFolder;
  if (originFilter === 'shared') {
    return !isOwner && !!userEmail && (doc.sharedWith?.includes(userEmail) ?? false);
  }
  return true;
}

function matchesDate(doc: Document, dateFilter: DateFilter, customRange: DateRange) {
  if (dateFilter === 'all') return true;
  const uploadDate = new Date(doc.uploadDate);
  const now = new Date();

  if (dateFilter === 'today') {
    return uploadDate.toDateString() === now.toDateString();
  }
  if (dateFilter === '7d' || dateFilter === '30d') {
    const days = dateFilter === '7d' ? 7 : 30;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    return uploadDate >= cutoff;
  }
  if (dateFilter === 'custom') {
    if (customRange.start && uploadDate < new Date(customRange.start)) return false;
    if (customRange.end) {
      const end = new Date(customRange.end);
      end.setHours(23, 59, 59, 999);
      if (uploadDate > end) return false;
    }
    return true;
  }
  return true;
}

export function DocumentGrid() {
  const { state, deleteDocument } = useFlowPDF();
  const { user } = useUser();
  const [viewingDoc, setViewingDoc] = React.useState<string | null>(null);
  const [sharingDocId, setSharingDocId] = React.useState<string | null>(null);

  const hasActiveFilter = state.searchQuery.trim() !== '' || state.originFilter !== 'all' || state.dateFilter !== 'all';

  const filteredDocs = state.documents.filter(doc => {
    const folder = state.folders.find(f => f.id === doc.folderId);
    const inFolder = hasActiveFilter || state.currentFolderId === null || doc.folderId === state.currentFolderId;
    const q = state.searchQuery.toLowerCase();
    const matchesSearch = !q || doc.name.toLowerCase().includes(q) ||
                        doc.tags.some(tag => tag.toLowerCase().includes(q));
    return inFolder
      && matchesSearch
      && matchesOrigin(doc, folder, state.originFilter, user?.uid, user?.email)
      && matchesDate(doc, state.dateFilter, state.customDateRange);
  });

  if (filteredDocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <FileText className="w-10 h-10 opacity-20" />
        </div>
        <p className="text-lg font-medium">Nenhum documento encontrado</p>
        <p className="text-sm">{hasActiveFilter ? 'Tente ajustar a pesquisa ou os filtros' : 'Faça upload de um PDF para começar'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {filteredDocs.map((doc) => {
        const folder = state.folders.find(f => f.id === doc.folderId);
        const isPublicFolder = !!folder?.isPublic;
        const isOwner = !!user && doc.userId === user.uid;
        const canManage = isOwner || isPublicFolder;
        const isShared = !isPublicFolder && (doc.sharedWith?.length ?? 0) > 0;

        return (
        <Card
          key={doc.id}
          className="group hover:shadow-xl transition-all duration-300 border-border/30 overflow-hidden cursor-pointer bg-card text-card-foreground"
          onClick={() => setViewingDoc(doc.id)}
        >
          <CardContent className="p-0">
            <div className="aspect-[4/5] bg-card/60 relative group-hover:bg-card/70 transition-colors overflow-hidden border-b border-sidebar-border/20 flex items-center justify-center p-4">
              {(isPublicFolder || isShared) && (
                <div className="absolute top-3 left-3 z-10">
                  <Badge variant="secondary" className="gap-1 text-[9px] font-bold uppercase tracking-widest bg-popover/90 text-popover-foreground border-none shadow-sm">
                    {isPublicFolder ? <Globe className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                    {isPublicFolder ? 'Pública' : 'Compartilhado'}
                  </Badge>
                </div>
              )}

              <DocumentThumbnail doc={doc} />

              {/* Actions Overlay */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8 bg-popover text-popover-foreground shadow-sm hover:bg-popover/90 border-none">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 shadow-xl bg-popover text-popover-foreground">
                    <DropdownMenuItem onClick={() => setViewingDoc(doc.id)}>
                      <Eye className="w-4 h-4 mr-2" /> Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(doc.url, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" /> Abrir Original
                    </DropdownMenuItem>
                    {isOwner && !isPublicFolder && (
                      <DropdownMenuItem onClick={() => setSharingDocId(doc.id)}>
                        <Share2 className="w-4 h-4 mr-2" /> Compartilhar
                      </DropdownMenuItem>
                    )}
                    {canManage && (
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteDocument(doc.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="p-4 bg-card relative">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-sm truncate flex-1 text-card-foreground leading-tight" title={doc.name}>{doc.name}</h3>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70 mb-3 font-semibold">
                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">PDF</span>
                <span>•</span>
                <span>{doc.size}</span>
                <span>•</span>
                <span>{format(new Date(doc.uploadDate), 'dd/MM/yyyy')}</span>
              </div>

              {hasActiveFilter && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mb-3 font-semibold truncate">
                  <FolderIcon className="w-3 h-3 shrink-0" />
                  <span className="truncate">{folder ? folder.name : 'Raiz'}</span>
                </div>
              )}

              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.slice(0, 2).map((tag, i) => {
                    const t = tag.toLowerCase();
                    const cls = t.includes('import')
                      ? 'bg-red-600 text-white'
                      : t.includes('revis')
                      ? 'bg-amber-400 text-black'
                      : t.includes('aprov')
                      ? 'bg-emerald-400 text-black'
                      : 'bg-slate-500 text-white';

                    return (
                      <Badge key={i} variant="secondary" className={`text-[9px] px-2 py-0 rounded-sm font-bold uppercase tracking-widest ${cls} border-none`}>
                        {tag}
                      </Badge>
                    )
                  })}
                  {doc.tags.length > 2 && (
                    <span className="text-[9px] font-bold text-muted-foreground/60">+{doc.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        );
      })}
      {viewingDoc && (
        <PDFViewerModal
          docId={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
      {sharingDocId && (() => {
        const doc = state.documents.find(d => d.id === sharingDocId);
        return doc ? <ShareDocumentDialog doc={doc} onClose={() => setSharingDocId(null)} /> : null;
      })()}
    </div>
  );
}

function DocumentThumbnail({ doc }: { doc: Document }) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const hasRealThumbnail = !!doc.thumbnailUrl && !imgFailed;

  if (hasRealThumbnail) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={doc.thumbnailUrl}
        alt={`Preview de ${doc.name}`}
        className="w-full h-full object-cover object-top rounded-md border border-sidebar-border/30 transform transition-all group-hover:scale-[1.02] group-hover:-translate-y-1 bg-white"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div className="w-full h-full bg-background/6 rounded-md border border-sidebar-border/30 relative overflow-hidden transform transition-all group-hover:scale-[1.02] group-hover:-translate-y-1 flex flex-col p-6">
      <div className="h-1.5 w-1/3 bg-red-500 rounded-full mb-6 opacity-90" />

      <div className="space-y-4 flex-1">
        <div className="h-2 w-full bg-slate-100 rounded-full" />
        <div className="h-2 w-full bg-slate-100 rounded-full" />
        <div className="h-2 w-3/4 bg-slate-100 rounded-full" />
        <div className="pt-4 space-y-4">
          <div className="h-2 w-full bg-slate-50 rounded-full" />
          <div className="h-2 w-5/6 bg-slate-50 rounded-full" />
        </div>
      </div>

      <div className="absolute bottom-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <span className="text-5xl font-bold text-primary select-none">F</span>
      </div>

      <div className="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-sm shadow-sm">
        PDF
      </div>
    </div>
  );
}
