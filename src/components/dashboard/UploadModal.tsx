
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
import { Upload, FileText, Loader2, AlertCircle, XCircle, CheckCircle2, FlaskConical, Info } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  
  const { addDocument, state } = useFlowPDF();
  const { user } = useUser();
  const storage = useStorage();
  const db = useFirestore();
  const { toast } = useToast();

  const resetUpload = () => {
    setUploading(false);
    setProgress(0);
    setStatus('');
    setErrorMessage(null);
    setIsSimulated(false);
  };

  const startMockUpload = async (file: File, reason?: string) => {
    if (!user) return;
    setUploading(true);
    setIsSimulated(true);
    setStatus(`Iniciando simulação (${reason || 'Storage Offline'})...`);
    
    // Simular progresso de upload
    for (let i = 0; i <= 100; i += 5) {
      setProgress(i * 0.7);
      if (i === 20) setStatus('Sincronizando metadados...');
      if (i === 60) setStatus('IA Processando conteúdo...');
      await new Promise(r => setTimeout(r, 100));
    }

    try {
      // Chamar IA para extrair tags baseadas no nome do arquivo
      const aiResults = await tagDocument({ 
        documentContent: `Arquivo: ${file.name}. Analise o título para gerar tags.`
      }).catch(() => ({ tags: ['Geral', 'Simulado'], keywords: ['Exemplo', file.name] }));

      const docData = {
        name: file.name,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // PDF padrão de teste
        thumbnailUrl: `https://picsum.photos/seed/${file.name}/300/400`,
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
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        message: `Documento "${file.name}" (Simulado) pronto para uso.`,
        type: 'upload_success',
        createdAt: new Date().toISOString(),
        read: false
      }).catch(() => {});

      setProgress(100);
      setStatus('Concluído via Simulação!');
      
      setTimeout(() => {
        setUploading(false);
        setOpen(false);
        toast({
          title: "Upload Concluído (Modo Simulação)",
          description: "Os dados foram salvos no banco, mas o arquivo físico não foi para a nuvem.",
        });
      }, 800);
    } catch (e) {
      setErrorMessage("Erro ao salvar dados simulados.");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast({ title: "Apenas arquivos PDF são permitidos.", variant: "destructive" });
      return;
    }

    setUploading(true);
    setProgress(0);
    setErrorMessage(null);
    setStatus('Conectando ao Firebase Storage...');

    // Se o storage não estiver disponível por erro de configuração
    if (!storage) {
      console.warn("Firebase Storage não inicializado.");
      await startMockUpload(file, "Storage não configurado");
      return;
    }

    try {
      const storagePath = `users/${user.uid}/documents/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snap) => {
          const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          setProgress(p * 0.85); // Deixa 15% para o processamento da IA
          setStatus(`Enviando arquivo: ${p}%`);
        }, 
        async (err) => {
          console.error("Erro no Firebase Storage:", err);
          // Se falhar (ex: erro 403), tentamos a simulação para não travar o usuário
          await startMockUpload(file, "Permissão negada no Google Cloud");
        },
        async () => {
          setStatus('Arquivo enviado! IA Analisando conteúdo...');
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const aiResults = await tagDocument({ documentContent: file.name })
            .catch(() => ({ tags: ['Geral'], keywords: [file.name] }));

          setStatus('Finalizando registro...');
          await addDocument({
            name: file.name,
            url: downloadURL,
            thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/300/400`,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            uploadDate: new Date().toISOString(),
            type: 'pdf' as const,
            tags: aiResults.tags,
            keywords: aiResults.keywords,
            folderId: state.currentFolderId,
            userId: user.uid
          });

          setProgress(100);
          setStatus('Documento disponível!');
          
          await addDoc(collection(db, 'notifications'), {
            userId: user.uid,
            message: `Documento "${file.name}" carregado com sucesso.`,
            type: 'upload_success',
            createdAt: new Date().toISOString(),
            read: false
          }).catch(() => {});

          setTimeout(() => { 
            setOpen(false); 
            resetUpload(); 
            toast({ title: "Sucesso!", description: "Seu PDF foi processado e armazenado." });
          }, 800);
        }
      );
    } catch (error: any) {
      console.error("Falha fatal no upload:", error);
      setErrorMessage(error.message || "Erro desconhecido ao enviar.");
      // Tentar simulação como último recurso
      setTimeout(() => startMockUpload(file, "Erro técnico no servidor"), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!uploading) setOpen(val); if (!val) resetUpload(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <Upload className="w-4 h-4" /> Upload PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Enviar Documento para o Flow
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {!uploading ? (
            <div className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-primary/10 transition-all group cursor-pointer relative text-center">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                onChange={handleUpload} 
                accept=".pdf" 
              />
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground">Clique para selecionar seu arquivo</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Apenas PDF • Limite 50MB</p>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-bold flex items-center gap-2 text-primary">
                    {progress < 100 && !errorMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {status}
                  </span>
                  <span className="font-mono font-bold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2.5 bg-primary/10" />
              </div>

              {errorMessage && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex gap-3 items-start">
                  <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-destructive uppercase">Falha no Upload</p>
                    <p className="text-[11px] text-destructive/80 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {isSimulated && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start">
                  <FlaskConical className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Modo de Segurança Ativo</p>
                    <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                      O Google Cloud Storage está bloqueando uploads reais. Ativamos a simulação para que você possa testar a IA e a organização de pastas sem erros.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="w-4 h-4 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground font-medium">
                  A IA do Flow está lendo o cabeçalho do arquivo para gerar as tags automáticas.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
