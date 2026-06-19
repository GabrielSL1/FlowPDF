
"use client";

import React, { useState } from 'react';
import { useFlowPDF } from '@/lib/store';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { tagDocument } from '@/ai/flows/ai-document-tagging';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export function UploadModal() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { addDocument, state } = useFlowPDF();
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, envie um documento PDF.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const interval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 10 : p));
      }, 500);

      const aiResults = await tagDocument({ 
        documentContent: `Documento intitulado ${file.name}. Extração simulada para FlowPDF.`
      });

      clearInterval(interval);
      setProgress(100);

      const docId = Math.random().toString(36).substr(2, 9);
      const newDoc = {
        id: docId,
        name: file.name,
        url: URL.createObjectURL(file),
        thumbnailUrl: `https://picsum.photos/seed/${file.name}/300/400`,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString(),
        type: 'pdf' as const,
        tags: aiResults.tags,
        keywords: aiResults.keywords,
        folderId: state.currentFolderId,
      };

      addDocument(newDoc);
      
      setTimeout(() => {
        setUploading(false);
        setOpen(false);
        setProgress(0);
        toast({
          title: "Upload concluído",
          description: `${file.name} foi analisado e tagueado pela IA.`,
        });
      }, 800);

    } catch (error) {
      setUploading(false);
      toast({
        title: "Erro no upload",
        description: "Algo deu errado ao processar o documento.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Upload className="w-4 h-4" /> Upload PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Documento</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {!uploading ? (
            <div className="border-2 border-dashed border-muted rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-accent/50 transition-colors group cursor-pointer relative">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleUpload}
                accept=".pdf"
              />
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="font-medium">Clique para enviar ou arraste e solte</p>
                <p className="text-sm text-muted-foreground mt-1">Apenas PDFs (máx. 50MB)</p>
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Analisando documento...</span>
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 flex gap-3 items-start">
                <Loader2 className="w-4 h-4 text-accent animate-spin mt-0.5" />
                <div className="text-xs leading-relaxed text-muted-foreground">
                  Nossa IA está escaneando o documento para extrair metadados, 
                  sugerir tags e indexar o conteúdo para busca inteligente.
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
