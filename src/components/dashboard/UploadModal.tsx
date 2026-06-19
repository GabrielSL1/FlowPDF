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
import { Upload, FileText, Loader2, AlertCircle, XCircle, CheckCircle2, FlaskConical } from 'lucide-react';
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
    setIsSimulated(false);
  };

  const startMockUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setIsSimulated(true);
    setStatus('Iniciando simulação (Storage offline)...');
    
    // Simular progresso
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i * 0.7);
      if (i === 30) setStatus('Sincronizando metadados...');
      if (i === 70) setStatus('IA Processando conteúdo...');
      await new Promise(r => setTimeout(r, 150));
    }

    try {
      // Chamar IA para extrair tags
      const aiResults = await tagDocument({ 
        documentContent: `Documento simulado: ${file.name}. Tamanho: ${(file.size / 1024).toFixed(2)} KB.`
      }).catch(() => ({ tags: ['Geral', 'Simulado'], keywords: ['Exemplo', 'Arquivo'] }));

      const docData = {
        name: file.name,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // PDF de exemplo
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
      
      // Notificação
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        message: `[Simulação] Documento "${file.name}" registrado com sucesso.`,
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
          title: "Modo Simulação Ativo",
          description: "O documento foi registrado no banco, mas o arquivo físico não foi para o Storage.",
        });
      }, 500);
    } catch (e) {
      resetUpload();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast({ title: "Apenas PDFs", variant: "destructive" });
      return;
    }

    // Se o storage não estiver acessível, usamos a simulação automaticamente
    if (!storage) {
      await startMockUpload(file);
      return;
    }

    setUploading(true);
    setProgress(0);
    setStatus('Conectando ao Firebase Storage...');

    try {
      const storagePath = `users/${user.uid}/documents/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snap) => {
          const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          setProgress(p * 0.8);
          setStatus(`Enviando: ${p}%`);
        }, 
        async (err) => {
          console.error("Storage Error:", err);
          // FALLBACK PARA SIMULAÇÃO SE O STORAGE FALHAR (REGRAS/OFFLINE)
          toast({
            title: "Storage Bloqueado",
            description: "Iniciando upload simulado para garantir que o app funcione.",
          });
          await startMockUpload(file);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setStatus('IA Analisando...');
          
          const aiResults = await tagDocument({ documentContent: file.name })
            .catch(() => ({ tags: ['Geral'], keywords: [file.name] }));

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
          setStatus('Sincronizado!');
          setTimeout(() => { setOpen(false); resetUpload(); }, 500);
        }
      );
    } catch (error) {
      await startMockUpload(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!uploading) setOpen(val); if (!val) resetUpload(); }}>
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
            <div className="border-2 border-dashed border-muted rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-accent/50 transition-colors group cursor-pointer relative text-center">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} accept=".pdf" />
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="font-medium">Clique ou arraste seu PDF</p>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold tracking-widest">Limite Gratuito: 5GB</p>
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

              {isSimulated && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 items-start">
                  <FlaskConical className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-800 uppercase">Modo Simulação Ativo</p>
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Detectamos que seu Firebase Storage está bloqueado ou não configurado. O app está registrando os dados para que você possa testar as outras funcionalidades sem erros.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}