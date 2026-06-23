"use client";

import React, { useState } from 'react';
import { useFlowPDF } from '@/lib/store';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  Folder as FolderIcon,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  LayoutDashboard,
  HardDrive,
  LogOut,
  Info,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Folder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { MembersDialog } from '@/components/dashboard/MembersDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { state, setCurrentFolder, addFolder, deleteFolder } = useFlowPDF();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [newFolderPublic, setNewFolderPublic] = useState(false);

  const rootFolders = state.folders.filter(f => f.parentId === null);

  const usedStorageMB = state.documents.length * 1.2;
  const totalStorageMB = 5120;
  const usagePercentage = Math.min((usedStorageMB / totalStorageMB) * 100, 100);

  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth);
      window.location.href = '/login';
    } catch (e) {
      console.error("Erro ao sair:", e);
    }
  };

  const openNewFolderDialog = React.useCallback((parentId: string | null) => {
    setParentFolderId(parentId);
    setNewFolderName("");
    setNewFolderPublic(false);
    setIsDialogOpen(true);
  }, []);

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        await addFolder(newFolderName.trim(), parentFolderId, newFolderPublic);
        setIsDialogOpen(false);
        toast({
          title: "Pasta Criada",
          description: `"${newFolderName.trim()}" foi sincronizada.`,
        });
      } catch (err) {
        toast({
          title: "Erro",
          description: "Não foi possível criar a pasta.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="FlowPDF" className="w-10 h-10 rounded-lg object-contain shrink-0" />
          <span className="text-2xl font-bold font-headline tracking-tight">FlowPDF</span>
        </div>

        <nav className="space-y-1">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-3 h-11 text-base transition-colors",
              state.currentFolderId === null ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
            )}
            onClick={() => { setCurrentFolder(null); onNavigate?.(); }}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Button>
          
          <div className="pt-6 pb-2 px-2 text-xs font-semibold uppercase tracking-wider opacity-60 flex items-center justify-between">
            Meus Espaços
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 hover:bg-sidebar-accent rounded-full text-white"
              onClick={() => openNewFolderDialog(null)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-1 mt-2">
            {rootFolders.map(folder => (
              <FolderItem
                key={folder.id}
                folder={folder}
                allFolders={state.folders}
                currentFolderId={state.currentFolderId}
                currentUserId={user?.uid}
                onSelect={(id) => { setCurrentFolder(id); onNavigate?.(); }}
                onDelete={deleteFolder}
                onAddSubfolder={openNewFolderDialog}
              />
            ))}
          </div>
        </nav>
      </div>

      <div className="p-6 space-y-4 shrink-0 bg-sidebar">
        <MembersDialog />

        <div className="bg-sidebar-accent/40 rounded-xl p-4 border border-sidebar-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Armazenamento</span>
            </div>
            <Info className="w-3.5 h-3.5 opacity-50" />
          </div>
          <div className="h-1.5 w-full bg-sidebar-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-500" 
              style={{ width: `${Math.max(usagePercentage, 5)}%` }} 
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-[10px] opacity-70 uppercase font-bold">
              {usedStorageMB.toFixed(1)} MB / 5 GB
            </p>
            <p className="text-[10px] opacity-70 font-bold">{Math.round(usagePercentage)}%</p>
          </div>
        </div>

        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-destructive/20 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Sair do Sistema
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{parentFolderId ? 'Nova Subpasta' : 'Nova Pasta Raiz'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Nome da pasta</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: Contratos, Notas Fiscais..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                }}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={newFolderPublic}
                onCheckedChange={(checked) => setNewFolderPublic(checked === true)}
              />
              <span>Tornar pública (visível para todos os usuários)</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Sincronizar no Cloud</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const FolderItem = React.memo(function FolderItem({
  folder,
  allFolders,
  currentFolderId,
  currentUserId,
  onSelect,
  onDelete,
  onAddSubfolder
}: {
  folder: Folder;
  allFolders: Folder[];
  currentFolderId: string | null;
  currentUserId?: string;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onAddSubfolder: (parentId: string) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const children = allFolders.filter(f => f.parentId === folder.id);
  const isActive = currentFolderId === folder.id;
  const canDelete = !folder.isPublic || folder.userId === currentUserId;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="group flex items-center pr-1 relative">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className={cn(
              "p-0 h-9 w-6 hover:bg-sidebar-accent shrink-0",
              children.length === 0 && "opacity-0 pointer-events-none"
            )}
          >
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </Button>
        </CollapsibleTrigger>
        <Button
          variant="ghost"
          className={cn(
            "flex-1 justify-start gap-2 h-9 text-sm font-medium px-2 transition-colors overflow-hidden",
            isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
          )}
          onClick={() => onSelect(folder.id)}
        >
          <FolderIcon className={cn("w-4 h-4 shrink-0", isActive ? "text-accent fill-accent/20" : "text-accent")} />
          <span className="truncate">{folder.name}</span>
          {folder.isPublic && (
            <span title="Pasta pública">
              <Globe className="w-3 h-3 shrink-0 opacity-60" />
            </span>
          )}
        </Button>

        <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 absolute right-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-sidebar-accent rounded-full bg-sidebar-background/80"
            onClick={(e) => {
              e.stopPropagation();
              onAddSubfolder(folder.id);
              setIsOpen(true);
            }}
          >
            <Plus className="w-3 h-3" />
          </Button>

          {canDelete && (
            <AlertDialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-white/50 hover:text-white hover:bg-destructive rounded-full bg-sidebar-background/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Excluir</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Pasta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso excluirá <strong>{folder.name}</strong> e todos os arquivos dentro dela permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(folder.id);
                    }}
                  >
                    Confirmar Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {children.length > 0 && (
        <CollapsibleContent className="pl-4 border-l border-sidebar-border/30 ml-3 space-y-1 mt-1">
          {children.map(child => (
            <FolderItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              currentFolderId={currentFolderId}
              currentUserId={currentUserId}
              onSelect={onSelect}
              onDelete={onDelete}
              onAddSubfolder={onAddSubfolder}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
});
