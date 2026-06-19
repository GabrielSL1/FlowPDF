
"use client";

import React from 'react';
import { useDocuFlow } from '@/lib/store';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Tag, X, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function PDFViewerModal({ docId, onClose }: { docId: string, onClose: () => void }) {
  const { state } = useDocuFlow();
  const doc = state.documents.find(d => d.id === docId);

  if (!doc) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center text-primary">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base truncate max-w-md">{doc.name}</DialogTitle>
              <p className="text-xs text-muted-foreground">{doc.size} • Enviado em {new Date(doc.uploadDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-8">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(doc.url, '_blank')}>
              <Download className="w-4 h-4" /> Download
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="w-4 h-4" /> Compartilhar
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row bg-[#F8F9FA] overflow-hidden">
          {/* Main Viewer Area */}
          <div className="flex-1 overflow-hidden flex flex-col bg-muted/30">
            {doc.url && doc.url !== '#' ? (
              <iframe 
                src={`${doc.url}#toolbar=0`} 
                className="w-full h-full border-none"
                title={doc.name}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium">Visualização não disponível</h3>
                <p className="max-w-xs text-sm">Este documento é um exemplo estático ou o link expirou.</p>
              </div>
            )}
          </div>

          {/* AI Insights Sidebar */}
          <div className="w-full md:w-80 bg-background border-l p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <h3 className="font-headline font-semibold">Insights da IA</h3>
            </div>

            <section className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Tags Sugeridas
              </h4>
              <div className="flex flex-wrap gap-2">
                {doc.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-3 py-1">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>

            <Separator className="mb-8" />

            <section>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Palavras-chave</h4>
              <div className="flex flex-wrap gap-1.5">
                {doc.keywords.map((kw, i) => (
                  <span key={i} className="text-sm px-2 py-0.5 rounded-md bg-muted text-muted-foreground border">
                    {kw}
                  </span>
                ))}
              </div>
            </section>
            
            <div className="mt-12 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-xs text-accent-foreground font-medium mb-1">Resumo da IA</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Este documento contém informações relevantes sobre {doc.keywords.slice(0, 2).join(' e ')}. A IA recomenda arquivar na categoria {doc.tags[0] || 'Geral'}.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
