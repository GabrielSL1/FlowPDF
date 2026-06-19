
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
import { Upload, X, FileText, Loader2 } from 'lucide-react';
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
      // Simulação de progresso de upload
      const interval = setInterval(() => {
        setProgress(p => (p < 80 ? p + 10 : p));
      }, 400);

      // Análise de IA
      const aiResults = await tagDocument({ 
        documentContent: `Documento intitulado ${file.name}. Extração simulada para FlowPDF.`
      });

      clearInterval(interval);
      setProgress(100);

      // Salva no Firebase Firestore
      await addDocument({
        name: file.name,
        url: '#', // Em produção, aqui iria a URL do Firebase Storage
        thumbnailUrl: `https://picsum.photos/seed/${file.name}/300/400`,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString(),
        type: 'pdf' as const,
        tags: aiResults.tags,
        keywords: aiResults.keywords,
        folderId: state.currentFolderId,
      });
      
      setTimeout(() => {
        setUploading(false);
        setOpen(false);
        setProgress(0);
        toast({
          title: "Upload concluído",
          description: `${file.name} foi salvo no Firebase e tagueado pela IA.`,
        });
      }, 800);

    } catch (error) {
      console.error(error);
      setUploading(false);
      toast({
        title: "Erro no upload",
        description: "Algo deu errado ao processar o documento no Firebase.",
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
          <DialogTitle>Enviar Documento para o Firebase</DialogTitle>
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
                <p className="font-medium">Clique para enviar para o Cloud</p>
                <p className="text-sm text-muted-foreground mt-1">Sincronização automática via Firebase</p>
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
                    <span className="text-sm font-medium">Processando no Firebase...</span>
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
