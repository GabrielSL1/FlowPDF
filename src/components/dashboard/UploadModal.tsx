"use client";

import React, { useState } from 'react';
import { useFlowPDF } from '@/lib/store';
import { useUser, useFirestore } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, XCircle, CheckCircle2, Info, Users, Globe } from 'lucide-react';
import { tagDocument } from '@/ai/flows/ai-document-tagging';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase, DOCUMENTS_BUCKET } from '@/lib/supabase';
import { generatePdfThumbnail } from '@/lib/pdf-thumbnail';
import { collection, addDoc } from 'firebase/firestore';

export function UploadModal() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  const { addDocument, state } = useFlowPDF();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const currentFolder = state.folders.find(f => f.id === state.currentFolderId);
  const isPublicFolder = !!currentFolder?.isPublic;

  const resetUpload = () => {
    setUploading(false);
    setProgress(0);
    setStatus('');
    setErrorMessage(null);
    setPendingFile(null);
    setSelectedEmails([]);
  };

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };

  const uploadFile = async (file: File) => {
    if (!user) return;

    setUploading(true);
    setProgress(0);
    setErrorMessage(null);
    setStatus('Enviando arquivo...');

    try {
      const storagePath = `${user.uid}/${Date.now()}_${file.name}`;
      setProgress(20);

      const { error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(storagePath, file, {
          contentType: 'application/pdf',
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error("Erro ao enviar para o Supabase Storage:", uploadError);
        let description = uploadError.message || "Não foi possível enviar o arquivo. Tente novamente.";
        if (/row-level security|not authorized|permission/i.test(description)) {
          description = "Permissão negada pelo Supabase Storage. Verifique as políticas (policies) do bucket no painel do Supabase.";
        } else if (/bucket not found/i.test(description)) {
          description = `O bucket "${DOCUMENTS_BUCKET}" não existe no seu projeto Supabase. Crie-o em Storage no painel do Supabase.`;
        }
        setErrorMessage(description);
        setUploading(false);
        return;
      }

      setProgress(50);
      setStatus('Gerando preview do PDF...');

      const { data: publicUrlData } = supabase.storage
        .from(DOCUMENTS_BUCKET)
        .getPublicUrl(storagePath);

      let thumbnailUrl: string | undefined;
      const thumbnailBlob = await generatePdfThumbnail(file);
      if (thumbnailBlob) {
        const thumbPath = `${user.uid}/thumbnails/${Date.now()}_${file.name}.jpg`;
        const { error: thumbError } = await supabase.storage
          .from(DOCUMENTS_BUCKET)
          .upload(thumbPath, thumbnailBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });
        if (!thumbError) {
          thumbnailUrl = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(thumbPath).data.publicUrl;
        }
      }

      setProgress(70);
      setStatus('IA Analisando conteúdo...');

      const aiResults = await tagDocument({ documentContent: file.name })
        .catch(() => ({ tags: ['Geral'], keywords: [file.name] }));

      await addDocument({
        name: file.name,
        url: publicUrlData.publicUrl,
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString(),
        type: 'pdf' as const,
        tags: aiResults.tags,
        keywords: aiResults.keywords,
        folderId: state.currentFolderId,
        userId: user.uid,
        sharedWith: selectedEmails
      });

      setProgress(100);
      setStatus('Finalizado!');

      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        message: `Documento "${file.name}" carregado na nuvem.`,
        type: 'upload_success',
        createdAt: new Date().toISOString(),
        read: false
      }).catch(() => {});

      setTimeout(() => {
        setOpen(false);
        resetUpload();
        toast({ title: "Sucesso!", description: "Seu arquivo foi enviado e processado." });
      }, 800);
    } catch (error: any) {
      console.error("Erro técnico no upload:", error);
      setErrorMessage(error?.message || "Erro técnico ao enviar o arquivo.");
      setUploading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast({ title: "Apenas PDFs são aceitos.", variant: "destructive" });
      return;
    }

    setPendingFile(file);
    await uploadFile(file);
  };

  const handleRetry = () => {
    if (pendingFile) uploadFile(pendingFile);
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
            Enviar Documento
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {!uploading ? (
            <>
              {isPublicFolder ? (
                <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg text-accent">
                  <Globe className="w-4 h-4 shrink-0" />
                  <p className="text-[11px] font-medium">
                    Esta é uma pasta pública. O arquivo ficará visível para todos os usuários.
                  </p>
                </div>
              ) : state.members.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Compartilhar com
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {state.members.map(member => (
                      <label key={member.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={selectedEmails.includes(member.email)}
                          onCheckedChange={() => toggleEmail(member.email)}
                        />
                        <span className="truncate">{member.name} <span className="text-muted-foreground text-xs">({member.email})</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

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
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">PDF • IA integrada</p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-4 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-bold flex items-center gap-2 text-primary">
                    {errorMessage ? (
                      <XCircle className="w-4 h-4 text-destructive" />
                    ) : progress < 100 ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {status}
                  </span>
                  <span className="font-mono font-bold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2.5 bg-primary/10" />
              </div>

              {errorMessage && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex gap-3 items-start">
                  <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="text-[11px] text-destructive font-medium">{errorMessage}</p>
                    <Button size="sm" variant="outline" onClick={handleRetry} className="h-7 text-xs">
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="w-4 h-4 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground font-medium">
                  Seus dados são protegidos por criptografia de ponta no banco de dados.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}