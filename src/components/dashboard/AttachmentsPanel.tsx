"use client";

import React, { useState } from 'react';
import { Paperclip, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document } from '@/lib/types';
import { extractPdfAttachments, formatAttachmentSize } from '@/lib/pdf-attachments';
import { useToast } from '@/hooks/use-toast';

function formatAttachmentDate(date: string | null): string {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
}

export function AttachmentsPanel({ doc }: { doc: Document }) {
  const { toast } = useToast();
  const [downloadingName, setDownloadingName] = useState<string | null>(null);

  if (!doc.attachments || doc.attachments.length === 0) return null;

  const handleDownload = async (attachmentName: string) => {
    if (!doc.url || doc.url === '#') {
      toast({ title: "Documento original indisponível.", variant: "destructive" });
      return;
    }

    setDownloadingName(attachmentName);
    try {
      console.log(`[AttachmentsPanel] Baixando PDF original para extrair o anexo "${attachmentName}"...`);
      const response = await fetch(doc.url);
      if (!response.ok) throw new Error(`Falha ao buscar o PDF original (status ${response.status})`);
      const pdfBlob = await response.blob();

      const attachments = await extractPdfAttachments(pdfBlob);
      const match = attachments.find(a => a.name === attachmentName);

      if (!match) {
        console.error(`[AttachmentsPanel] Anexo "${attachmentName}" não foi encontrado ao reabrir o PDF.`);
        toast({
          title: "Não foi possível abrir este anexo",
          description: "O arquivo pode ter sido corrompido ou alterado desde o envio.",
          variant: "destructive",
        });
        return;
      }

      const blob = new Blob([match.content], { type: match.mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = match.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error(`[AttachmentsPanel] Erro ao baixar anexo "${attachmentName}":`, err);
      toast({
        title: "Erro ao baixar anexo",
        description: "Não foi possível ler este anexo. Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setDownloadingName(null);
    }
  };

  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
        <Paperclip className="w-3.5 h-3.5" /> Anexos ({doc.attachments.length})
      </h4>
      <div className="space-y-2">
        {doc.attachments.map((attachment, i) => (
          <div
            key={`${attachment.name}-${i}`}
            className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50"
          >
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate" title={attachment.name}>{attachment.name}</p>
              <p className="text-[10px] text-muted-foreground font-medium truncate" title={attachment.mimeType}>
                {attachment.mimeType} • {formatAttachmentSize(attachment.size)} • {formatAttachmentDate(attachment.date)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={downloadingName === attachment.name}
              onClick={() => handleDownload(attachment.name)}
              aria-label={`Baixar anexo ${attachment.name}`}
            >
              {downloadingName === attachment.name ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
