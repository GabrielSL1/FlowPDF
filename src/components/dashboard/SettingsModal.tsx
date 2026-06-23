
"use client";

import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Camera } from 'lucide-react';

export function SettingsModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
    setPhotoURL(user?.photoURL || '');
  }, [user]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Selecione um arquivo de imagem.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "A imagem deve ter no máximo 2MB.", variant: "destructive" });
      return;
    }

    setUploadingPhoto(true);
    try {
      const idToken = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/avatar-upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Não foi possível enviar a imagem.');

      setPhotoURL(result.url);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar foto",
        description: error.message || "Não foi possível enviar a imagem.",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: photoURL || undefined
      });

      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 600);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível salvar as alterações.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personalizar Perfil</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex justify-center">
            <div className="relative group">
              <Avatar className="w-20 h-20 border border-border">
                <AvatarImage src={photoURL} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>

              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
                disabled={uploadingPhoto}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail (Não pode ser alterado)</Label>
              <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Nome de Exibição</Label>
              <Input 
                id="name" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleUpdateProfile} disabled={loading || uploadingPhoto || !displayName.trim()}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
