
"use client";

import React, { useState } from 'react';
import { useFlowPDF } from '@/lib/store';
import { useStorage, useUser, useFirestore } from '@/firebase';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { tagDocument } from '@/ai/flows/ai-document-tagging';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';

export function UploadModal() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [errorType, setErrorType] = useState<string | null>(null);
  
  const { addDocument, state } = useFlowPDF();
  const { user } = useUser();
  const storage = useStorage();
  const db = useFirestore();
  const { toast } = useToast();

  const resetUpload = () => {
    setUploading(false);
    setProgress(0);
    setStatus('');
    setErrorType(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!storage) {
      toast({
        title: "Erro Crítico",
        description: "Serviço de Storage não inicializado no Firebase.",
        variant: "destructive"
      });
      return;
    }

    if (file.type !== 'application/pdf') {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, envie um documento PDF.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    setStatus('Iniciando envio...');
    setErrorType(null);

    try {
      const storageRef = ref(storage, `users/${user.uid}/documents/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(percent * 0.8);
          setStatus('Enviando para o Cloud Storage...');
        }, 
        (error) => {
          console.error("Erro no Storage:", error);
          setUploading(false);
          
          if (error.code === 'storage/unauthorized') {
            setErrorType('unauthorized');
            toast({
              title: "Acesso Negado (403)",
              description: "O Storage está bloqueando o envio. Verifique as 'Rules' no console do Firebase.",
              variant: "destructive"
            });
          } else {
            setErrorType('general');
            toast({
              title: "Erro de Conexão",
              description: error.message || "Erro ao enviar arquivo.",
              variant: "destructive"
            });
          }
        },
        async () => {
          try {
            setStatus('Processando links...');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            setProgress(85);
            setStatus('IA analisando documento...');
            
            const aiResults = await tagDocument({ 
              documentContent: `Documento PDF: ${file.name}. Tamanho: ${(file.size / 1024).toFixed(2)} KB.`
            });

            setStatus('Finalizando...');
            await addDocument({
              name: file.name,
              url: downloadURL,
              thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(file.name)}/300/400`,
              size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
              uploadDate: new Date().toISOString(),
              type: 'pdf',
              tags: aiResults.tags,
              keywords: aiResults.keywords,
              folderId: state.currentFolderId,
            });

            await addDoc(collection(db, 'notifications'), {
              userId: user.uid,
              message: `Novo PDF "${file.name}" pronto!`,
              type: 'upload_success',
              createdAt: new Date().toISOString(),
              read: false
            });

            setProgress(100);
            setStatus('Sucesso!');
            
            setTimeout(() => {
              setUploading(false);
              setOpen(false);
              toast({
                title: "Documento salvo!",
                description: `${file.name} já está disponível no seu dashboard.`,
              });
            }, 1000);
          } catch (innerError: any) {
            setUploading(false);
            toast({
              title: "Erro de Indexação",
              description: "Arquivo enviado, mas falha ao salvar no banco de dados.",
              variant: "destructive"
            });
          }
        }
      );

    } catch (error: any) {
      setUploading(false);
      toast({
        title: "Erro Inesperado",
        description: "Falha ao iniciar upload.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!uploading) setOpen(val);
      if (!val) resetUpload();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Upload className="w-4 h-4" /> Upload PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sincronizar PDF</DialogTitle>
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
                <p className="font-medium">Selecione seu arquivo PDF</p>
                <p className="text-xs text-muted-foreground mt-1">Sincronização imediata com IA</p>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold flex items-center gap-2">
                    {progress < 100 ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {status}
                  </span>
                  <span className="font-mono">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {errorType === 'unauthorized' && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex gap-3 items-start">
                  <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-destructive uppercase">Ação necessária no Firebase Console</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Seu Storage está bloqueando o acesso. Vá em <strong>Console &gt; Storage &gt; Rules</strong> e certifique-se de que as permissões permitem escrita para usuários autenticados.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-primary/5 p-4 rounded-lg flex gap-3 items-start border border-primary/10">
                <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">
                  Estamos usando sua cota do plano Spark. O arquivo ficará seguro na infraestrutura do Google.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
