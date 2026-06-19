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
import { Upload, FileText, Loader2, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';
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
        title: "Erro de Configuração",
        description: "O serviço de Storage não foi detectado. Ative-o no Firebase Console.",
        variant: "destructive"
      });
      return;
    }

    if (file.type !== 'application/pdf') {
      toast({
        title: "Arquivo Inválido",
        description: "Apenas arquivos PDF são permitidos.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    setStatus('Iniciando conexão segura...');
    setErrorType(null);

    try {
      const storagePath = `users/${user.uid}/documents/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(percent * 0.8); // 80% para upload, 20% para IA/DB
          setStatus(`Enviando arquivo: ${percent}%`);
        }, 
        (error) => {
          console.error("Storage Error Details:", error);
          setUploading(false);
          if (error.code === 'storage/unauthorized') {
            setErrorType('unauthorized');
          } else {
            setErrorType('general');
            toast({
              title: "Falha no Upload",
              description: "O Firebase recusou a conexão. Verifique se o Storage está ativo.",
              variant: "destructive"
            });
          }
        },
        async () => {
          try {
            setStatus('Processando metadados...');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            setProgress(85);
            setStatus('IA Analisando conteúdo...');
            
            // Chamar IA para extrair tags
            const aiResults = await tagDocument({ 
              documentContent: `Documento: ${file.name}. Tamanho: ${(file.size / 1024).toFixed(2)} KB. Usuário ID: ${user.uid}`
            }).catch(e => {
              console.warn("IA Error:", e);
              return { tags: ['Geral'], keywords: [file.name] };
            });

            setStatus('Sincronizando com o Cloud...');
            
            const docData = {
              name: file.name,
              url: downloadURL,
              thumbnailUrl: `https://picsum.photos/seed/${user.uid}_${Date.now()}/300/400`,
              size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
              uploadDate: new Date().toISOString(),
              type: 'pdf' as const,
              tags: aiResults.tags,
              keywords: aiResults.keywords,
              folderId: state.currentFolderId,
              userId: user.uid
            };

            await addDocument(docData);

            // Criar notificação de sucesso
            await addDoc(collection(db, 'notifications'), {
              userId: user.uid,
              message: `Documento "${file.name}" enviado e processado com sucesso.`,
              type: 'upload_success',
              createdAt: new Date().toISOString(),
              read: false
            }).catch(() => {});

            setProgress(100);
            setStatus('Concluído!');
            
            setTimeout(() => {
              setUploading(false);
              setOpen(false);
              toast({
                title: "Documento Disponível",
                description: "O arquivo foi salvo e indexado com sucesso.",
              });
            }, 500);
          } catch (innerError: any) {
            console.error("DB Save Error:", innerError);
            setUploading(false);
            toast({
              title: "Erro ao Salvar",
              description: "O arquivo subiu, mas não conseguimos registrar no banco.",
              variant: "destructive"
            });
          }
        }
      );

    } catch (error: any) {
      console.error("Critical Upload Error:", error);
      setUploading(false);
      toast({
        title: "Erro Crítico",
        description: "Não foi possível iniciar o processo.",
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
          <DialogTitle>Enviar para o Fluxo</DialogTitle>
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
                <p className="text-xs text-muted-foreground mt-1">Armazenamento em nuvem criptografado</p>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold flex items-center gap-2">
                    {progress < 100 ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 text-green-500" />}
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
                    <p className="text-xs font-bold text-destructive uppercase">Acesso Bloqueado pelo Cloud</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Seu Firebase Storage está bloqueando o acesso. Vá em <strong>Storage &gt; Rules</strong> no Console e certifique-se de que a leitura/escrita está permitida para usuários logados.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-primary/5 p-4 rounded-lg flex gap-3 items-start border border-primary/10">
                <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">
                  Nota: Durante o upload, nossa IA extrai automaticamente tags e palavras-chave para facilitar sua busca.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}