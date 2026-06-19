
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
import { Download, Tag, FileText, ExternalLink, Sparkles, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function PDFViewerModal({ docId, onClose }: { docId: string, onClose: () => void }) {
  const { state } = useFlowPDF();
  const doc = state.documents.find(d => d.id === docId);

  if (!doc) return null;

  const hasValidUrl = doc.url && doc.url !== '#';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl border-none shadow-2xl">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0 bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <DialogTitle className="text-base truncate max-w-[200px] md:max-w-md font-headline font-bold" title={doc.name}>
                {doc.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground font-medium">{doc.size}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">Enviado em {new Date(doc.uploadDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-10">
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2 h-9" onClick={() => window.open(doc.url, '_blank')}>
              <ExternalLink className="w-4 h-4" /> Abrir Original
            </Button>
            <Button size="sm" className="gap-2 h-9" onClick={() => {
              const link = document.createElement('a');
              link.href = doc.url;
              link.download = doc.name;
              link.click();
            }}>
              <Download className="w-4 h-4" /> Baixar PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row bg-[#F8F9FA] overflow-hidden">
          {/* Main Viewer Area */}
          <div className="flex-1 overflow-hidden flex flex-col bg-muted/40 relative">
            {hasValidUrl ? (
              <div className="w-full h-full p-4 md:p-8 overflow-auto flex justify-center">
                <iframe
                  src={`${doc.url}#toolbar=1&navpanes=0&scrollbar=1`}
                  className="w-full max-w-4xl h-full shadow-2xl border-none bg-white rounded-sm"
                  title={doc.name}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 opacity-20" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Visualização indisponível</h3>
                <p className="max-w-xs text-sm mt-1">Este documento de exemplo não possui um arquivo PDF real carregado.</p>
              </div>
            )}
          </div>

          {/* AI Side Panel */}
          <aside className="w-full md:w-[380px] bg-white border-l p-6 overflow-y-auto shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-headline font-bold text-lg">Inteligência Flow</h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-accent/5 text-accent border-accent/20">IA Ativa</Badge>
            </div>

            <section className="space-y-6">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Classificação sugerida
                </h4>
                <div className="flex flex-wrap gap-2">
                  {doc.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-3 py-1.5 font-medium transition-colors hover:bg-primary/10">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" /> Indexação de Conteúdo
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {doc.keywords.map((kw, i) => (
                    <span key={i} className="text-xs px-2.5 py-1.5 rounded-md bg-muted/50 text-foreground border border-border/50 font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="pt-6">
                <div className="p-5 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                  <p className="text-[10px] text-primary font-bold mb-3 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Resumo Inteligente
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    "O Flow identificou que este documento trata principalmente de <strong>{doc.keywords.slice(0, 2).join(', ')}</strong> e tópicos relacionados a <strong>{doc.tags[0] || 'Geral'}</strong>. Foram extraídos {doc.keywords.length} metadados relevantes para busca."
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-auto pt-8">
              <Button variant="outline" className="w-full justify-start gap-2 h-11 text-muted-foreground hover:text-foreground">
                <MessageSquare className="w-4 h-4" /> Perguntar sobre o arquivo...
              </Button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
