
"use client";

import React from 'react';
import { useFlowPDF } from '@/lib/store';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { 
  Folder as FolderIcon, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  LayoutDashboard,
  HardDrive,
  LogOut
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

export function SidebarNav() {
  const { state, setCurrentFolder, addFolder, deleteFolder } = useFlowPDF();
  const auth = useAuth();
  const { toast } = useToast();
  
  const rootFolders = state.folders.filter(f => f.parentId === null);

  const handleLogout = async () => {
    localStorage.removeItem('flowpdf_demo_user');
    try {
      if (auth) await signOut(auth);
    } catch (e) {
      console.log("Deslogado do modo demo.");
    }
    window.location.href = '/login';
  };

  const handleAddRootFolder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const name = window.prompt('Nome da nova pasta raiz:');
    if (name && name.trim()) {
      addFolder(name.trim(), null);
      toast({
        title: "Pasta criada",
        description: `A pasta "${name.trim()}" foi criada com sucesso.`,
      });
    }
  };

  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-bold text-xl font-headline">
            F
          </div>
          <span className="text-2xl font-bold font-headline tracking-tight">FlowPDF</span>
        </div>

        <nav className="space-y-1">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-3 h-11 text-base transition-colors",
              state.currentFolderId === null ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
            )}
            onClick={() => setCurrentFolder(null)}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Button>
          
          <div className="pt-6 pb-2 px-2 text-xs font-semibold uppercase tracking-wider opacity-60 flex items-center justify-between">
            Pastas
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 hover:bg-sidebar-accent rounded-full"
              onClick={handleAddRootFolder}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="space-y-1">
            {rootFolders.map(folder => (
              <FolderItem 
                key={folder.id} 
                folder={folder} 
                allFolders={state.folders} 
                currentFolderId={state.currentFolderId}
                onSelect={setCurrentFolder}
                onDelete={deleteFolder}
                onAddSubfolder={addFolder}
              />
            ))}
          </div>
        </nav>
      </div>

      <div className="p-6 space-y-4 shrink-0 bg-primary/95">
        <div className="bg-sidebar-accent/40 rounded-xl p-4 border border-sidebar-border/30">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Armazenamento</span>
          </div>
          <div className="h-1.5 w-full bg-sidebar-border rounded-full overflow-hidden">
            <div className="h-full bg-accent w-[35%]" />
          </div>
          <p className="text-xs mt-2 opacity-70">1.2 GB de 5 GB usados</p>
        </div>

        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-destructive/20 hover:text-white transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Sair do Sistema
        </Button>
      </div>
    </div>
  );
}

function FolderItem({ 
  folder, 
  allFolders, 
  currentFolderId, 
  onSelect,
  onDelete,
  onAddSubfolder
}: { 
  folder: Folder; 
  allFolders: Folder[]; 
  currentFolderId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onAddSubfolder: (name: string, parentId: string) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();
  const children = allFolders.filter(f => f.parentId === folder.id);
  const isActive = currentFolderId === folder.id;

  const handleAddChild = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const name = window.prompt(`Nova subpasta em "${folder.name}":`);
    if (name && name.trim()) {
      onAddSubfolder(name.trim(), folder.id);
      setIsOpen(true);
      toast({
        title: "Subpasta criada",
        description: `Subpasta "${name.trim()}" adicionada a ${folder.name}.`,
      });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir a pasta "${folder.name}" e todo seu conteúdo?`)) {
      onDelete(folder.id);
      toast({
        title: "Pasta excluída",
        description: `A pasta "${folder.name}" foi removida.`,
        variant: "destructive"
      });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="group flex items-center pr-1 relative">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className={cn(
              "p-0 h-9 w-6 hover:bg-sidebar-accent shrink-0 transition-opacity",
              children.length === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
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
        </Button>
        
        <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity absolute right-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 hover:bg-sidebar-accent rounded-full bg-sidebar-background/50 backdrop-blur-sm" 
            onClick={handleAddChild}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-white/50 hover:text-white hover:bg-destructive rounded-full bg-sidebar-background/50 backdrop-blur-sm" 
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
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
              onSelect={onSelect}
              onDelete={onDelete}
              onAddSubfolder={onAddSubfolder}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
