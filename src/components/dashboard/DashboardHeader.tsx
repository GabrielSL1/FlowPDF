
"use client";

import React from 'react';
import { useFlowPDF } from '@/lib/store';
import { useUser } from '@/firebase';
import { Search, Bell, Settings, Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UploadModal } from './UploadModal';

export function DashboardHeader() {
  const { state, setSearchQuery } = useFlowPDF();
  const { user } = useUser();
  
  const currentFolder = state.folders.find(f => f.id === state.currentFolderId);
  const path = currentFolder ? ` / ${currentFolder.name}` : '';

  return (
    <header className="h-20 border-b bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Meus Documentos</span>
          {path}
        </div>
        
        <div className="relative max-w-md w-full ml-8">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar por nome ou tags da IA..." 
            className="pl-10 bg-muted/50 border-none h-11 focus-visible:ring-1"
            value={state.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <UploadModal />
        
        <div className="flex items-center gap-2 border-l pl-4 ml-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Settings className="w-5 h-5" />
          </Button>
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"} />
            <AvatarFallback>{user?.displayName?.slice(0, 2).toUpperCase() || "JD"}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
