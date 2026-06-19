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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
        title: "Erro de Conexão",
        description: "O serviço de arquivos (Storage) não está pronto.",
        variant: "destructive"
      });
      return;
    }

    if (file.type !== 'application/pdf') {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione apenas arquivos PDF.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    setStatus('Iniciando envio...');
    setErrorType(null);

    try {
      const storagePath = `users/${user.uid}/documents/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(percent * 0.7); // Deixa espaço para o processamento da IA
          setStatus(`Enviando: ${percent}%`);
        }, 
        (error) => {
          console.error("Storage Error:", error);
          setUploading(false);
          if (error.code === 'storage/unauthorized') {
            setErrorType('unauthorized');
          } else {
            setErrorType('general');
            toast({
              title: "Erro no Cloud",
              description: "Verifique sua conexão ou se o Storage está ativo no Console.",
              variant: "destructive"
            });
          }
        },
        async () => {
          try {
            setStatus('Obtendo link seguro...');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            setProgress(80);
            setStatus('Inteligência Artificial analisando...');
            
            // Simulação ou chamada real de extração de texto para IA
            const aiResults = await tagDocument({ 
              documentContent: `Documento: ${file.name}. Tamanho: ${(file.size / 1024).toFixed(2)} KB. Usuário: ${user.email}`
            });

            setStatus('Salvando no Banco de Dados...');
            
            const docData = {
              name: file.name,
              url: downloadURL,
              thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(file.name)}/300/400`,
              size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
              uploadDate: new Date().toISOString(),
              type: 'pdf' as const,
              tags: aiResults.tags,
              keywords: aiResults.keywords,
              folderId: state.currentFolderId,
              userId: user.uid
            };

            await addDocument(docData);

            // Criar notificação
            const notificationData = {
              userId: user.uid,
              message: `Upload concluído: ${file.name}`,
              type: 'upload_success' as const,
              createdAt: new Date().toISOString(),
              read: false
            };

            addDoc(collection(db, 'notifications'), notificationData)
              .catch(() => {
                // Silencioso se for apenas notificação
              });

            setProgress(100);
            setStatus('Concluído com sucesso!');
            
            setTimeout(() => {
              setUploading(false);
              setOpen(false);
              toast({
                title: "Sucesso!",
                description: "Seu documento já está disponível na nuvem.",
              });
            }, 800);
          } catch (innerError: any) {
            console.error("Finalization error:", innerError);
            setUploading(false);
            toast({
              title: "Erro no Banco",
              description: "O arquivo subiu, mas não conseguimos salvar os dados. Verifique o Firestore.",
              variant: "destructive"
            });
          }
        }
      );

    } catch (error: any) {
      console.error("Critical error:", error);
      setUploading(false);
      toast({
        title: "Falha Crítica",
        description: "Não foi possível iniciar o processo de upload.",
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
          <DialogTitle>Gerenciador de Upload</DialogTitle>
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
                <p className="font-medium">Clique ou arraste seu PDF</p>
                <p className="text-xs text-muted-foreground mt-1">Armazenamento seguro em nuvem</p>
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
                    <p className="text-xs font-bold text-destructive uppercase">Acesso Bloqueado</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Suas regras de Storage estão impedindo o upload. No Firebase Console, vá em Storage &gt; Rules e permita leitura/escrita para usuários logados.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-primary/5 p-4 rounded-lg flex gap-3 items-start border border-primary/10">
                <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">
                  Dica: Arquivos muito grandes podem demorar mais para serem processados pela nossa IA.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}