"use client";

import React, { useState, useEffect } from 'react';
import { useFlowPDF } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function ShareFolderDialog({ folder, onClose }: { folder: Folder; onClose: () => void }) {
  const { state, updateFolderSharing } = useFlowPDF();
  const { toast } = useToast();
  const [selectedEmails, setSelectedEmails] = useState<string[]>(folder.sharedWith || []);
  const [extraEmail, setExtraEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedEmails(folder.sharedWith || []);
  }, [folder.id]);

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };

  const handleAddExtraEmail = () => {
    const email = extraEmail.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return;
    }
    if (!selectedEmails.includes(email)) {
      setSelectedEmails(prev => [...prev, email]);
    }
    setExtraEmail('');
  };

  const handleSave = async () => {
    setSaving(true);
    await updateFolderSharing(folder.id, selectedEmails);
    setSaving(false);
    toast({ title: "Compartilhamento atualizado", description: `"${folder.name}" foi atualizada.` });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar "{folder.name}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {state.members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum membro cadastrado ainda. Adicione membros em "Membros da Equipe" na barra lateral.
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-2 border rounded-lg p-3">
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
          )}

          <div className="space-y-1">
            <Label htmlFor="extra-email" className="text-xs">Ou compartilhar com outro e-mail</Label>
            <div className="flex gap-2">
              <Input
                id="extra-email"
                value={extraEmail}
                onChange={(e) => setExtraEmail(e.target.value)}
                placeholder="email@exemplo.com"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddExtraEmail(); } }}
              />
              <Button type="button" variant="outline" onClick={handleAddExtraEmail}>Adicionar</Button>
            </div>
          </div>

          {selectedEmails.filter(e => !state.members.some(m => m.email === e)).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedEmails.filter(e => !state.members.some(m => m.email === e)).map(email => (
                <span key={email} className="text-xs bg-muted px-2 py-1 rounded-md flex items-center gap-1">
                  {email}
                  <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => toggleEmail(email)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
