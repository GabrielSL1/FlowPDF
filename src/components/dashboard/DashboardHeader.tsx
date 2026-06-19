
"use client";

import React, { useState } from 'react';
import { useFlowPDF } from '@/lib/store';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Search, Bell, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UploadModal } from './UploadModal';
import { SettingsModal } from './SettingsModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const { state, setSearchQuery } = useFlowPDF();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  
  const currentFolder = state.folders.find(f => f.id === state.currentFolderId);
  const path = currentFolder ? ` / ${currentFolder.name}` : '';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <header className="h-20 border-b bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Meus Documentos</span>
          {path}
        </div>
        
        <div className="relative max-w-md w-full ml-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Personalizar Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair do Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Avatar className="h-9 w-9 border">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback className="bg-primary text-white font-bold">
              {user?.displayName?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "JD"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </header>
  );
}
