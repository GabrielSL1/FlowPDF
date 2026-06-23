"use client";

import React, { useState } from 'react';
import { useFlowPDF } from '@/lib/store';
import { useUser } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MembersDialog() {
  const { state, addMember, deleteMember } = useFlowPDF();
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return;
    }
    await addMember(name.trim(), email.trim());
    setName('');
    setEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <Users className="w-5 h-5" />
          Membros da Equipe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Membros da Equipe</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="member-name" className="text-xs">Nome</Label>
              <Input
                id="member-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do membro"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="member-email" className="text-xs">E-mail</Label>
              <Input
                id="member-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!name.trim() || !email.trim()} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Adicionar Membro
          </Button>

          <div className="space-y-2 max-h-64 overflow-y-auto pt-2 border-t">
            {state.members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum membro cadastrado ainda.</p>
            ) : (
              state.members.map(member => {
                const canDelete = !!user && member.addedBy === user.uid;
                return (
                  <div key={member.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => deleteMember(member.id)}
                        title="Excluir membro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
