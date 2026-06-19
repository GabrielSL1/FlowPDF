
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

export function SidebarNav() {
  const { state, setCurrentFolder, addFolder, deleteFolder } = useFlowPDF();
  const auth = useAuth();
  
  const rootFolders = state.folders.filter(f => f.parentId === null);

  const handleLogout = async () => {
    // Remove usuário de teste se houver
    localStorage.removeItem('flowpdf_demo_user');
    
    // Tenta deslogar do Firebase
    try {
      if (auth) await signOut(auth);
    } catch (e) {
      console.log("Deslogado do modo demo.");
    }
    
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <div className="p-6 flex-1">
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
              className="h-5 w-5 hover:bg-sidebar-accent"
              onClick={() => {
                const name = prompt('Nome da Pasta:');
                if (name) addFolder(name, null);
              }}
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
                onAddSubfolder={(parentId) => {
                  const name = prompt('Nome da Subpasta:');
                  if (name) addFolder(name, parentId);
                }}
              />
            ))}
          </div>
        </nav>
      </div>

      <div className="p-6 space-y-4">
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
  onAddSubfolder: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const children = allFolders.filter(f => f.parentId === folder.id);
  const isActive = currentFolderId === folder.id;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="group flex items-center">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="p-1 h-7 w-7 hover:bg-sidebar-accent"
            disabled={children.length === 0}
          >
            {children.length > 0 && (
              isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <Button
          variant="ghost"
          className={cn(
            "flex-1 justify-start gap-2 h-9 text-sm font-medium px-2 transition-colors",
            isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
          )}
          onClick={() => onSelect(folder.id)}
        >
          <FolderIcon className={cn("w-4 h-4", isActive ? "text-accent fill-accent/20" : "text-accent")} />
          {folder.name}
        </Button>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddSubfolder(folder.id)}>
            <Plus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(folder.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <CollapsibleContent className="pl-6 border-l border-sidebar-border/30 ml-4 space-y-1 mt-1">
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
    </Collapsible>
  );
}
