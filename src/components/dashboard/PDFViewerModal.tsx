
"use client";

import React from 'react';
import { useFlowPDF } from '@/lib/store';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Tag, X, FileText, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function PDFViewerModal({ docId, onClose }: { docId: string, onClose: () => void }) {
  const { state } = useFlowPDF();
  const doc = state.documents.find(d => d.id === docId);

  if (!doc) return null;

  const hasValidUrl = doc.url && doc.url !== '#';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0 bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <DialogTitle className="text-base truncate max-w-[200px] md:max-w-md" title={doc.name}>
                {doc.name}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">{doc.size} • Enviado em {new Date(doc.uploadDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-8">
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2" onClick={() => window.open(doc.url, '_blank')}>
              <ExternalLink className="w-4 h-4" /> Abrir Original
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              const link = document.createElement('a');
              link.href = doc.url;
              link.download = doc.name;
              link.click();
            }}>
              <Download className="w-4 h-4" /> Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row bg-[#F8F9FA] overflow-hidden">
          {/* Main Viewer Area */}
          <div className="flex-1 overflow-hidden flex flex-col bg-muted/30 relative">
            {hasValidUrl ? (
              <object
                data={`${doc.url}#toolbar=1`}
                type="application/pdf"
                className="w-full h-full"
              >
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <FileText className="w-16 h-16 mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Seu navegador não consegue exibir este PDF</h3>
                  <p className="mb-6 text-muted-foreground max-w-sm">Algumas extensões de segurança ou configurações de privacidade podem impedir a visualização integrada.</p>
                  <Button onClick={() => window.open(doc.url, '_blank')} className="gap-2">
                    <ExternalLink className="w-4 h-4" /> Abrir Documento em Nova Guia
                  </Button>
                </div>
              </object>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium">Visualização não disponível</h3>
                <p className="max-w-xs text-sm">Este documento de exemplo não possui um arquivo PDF real vinculado.</p>
              </div>
            )}
          </div>

          {/* AI Insights Sidebar */}
          <aside className="w-full md:w-80 bg-background border-l p-6 overflow-y-auto shrink-0 flex flex-col">
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

            <section className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Palavras-chave</h4>
              <div className="flex flex-wrap gap-1.5">
                {doc.keywords.map((kw, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground border">
                    {kw}
                  </span>
                ))}
              </div>
            </section>
            
            <div className="mt-auto p-4 rounded-xl bg-accent/5 border border-accent/10">
              <p className="text-[10px] text-accent font-bold mb-2 uppercase tracking-widest">Resumo Automático</p>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "O sistema identificou que este documento trata principalmente de {doc.keywords.slice(0, 2).join(' e ')}. 
                Recomenda-se a classificação na pasta {doc.tags[0] || 'Geral'}."
              </p>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
