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
import { Document } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function ShareDocumentDialog({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const { state, updateDocumentSharing } = useFlowPDF();
  const { toast } = useToast();
  const [selectedEmails, setSelectedEmails] = useState<string[]>(doc.sharedWith || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedEmails(doc.sharedWith || []);
  }, [doc.id]);

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateDocumentSharing(doc.id, selectedEmails);
    setSaving(false);
    toast({ title: "Compartilhamento atualizado", description: `"${doc.name}" foi atualizado.` });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar "{doc.name}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {state.members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum membro cadastrado ainda. Adicione membros em "Membros da Equipe" na barra lateral.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
