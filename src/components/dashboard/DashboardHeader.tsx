
"use client";

import React, { useState, useMemo } from 'react';
import { useFlowPDF } from '@/lib/store';
import { useUser, useAuth, useFirestore, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Search, Bell, Settings, LogOut, User as UserIcon, Check } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { query, collection, where, limit, doc, updateDoc } from 'firebase/firestore';
import { Notification } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DashboardHeader() {
  const { state, setSearchQuery } = useFlowPDF();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  
  // Buscar notificações (removido orderBy para evitar erro de índice no Firestore)
  const notificationsQuery = useMemo(() => 
    user ? query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid),
      limit(20)
    ) : null
  , [db, user]);

  const { data: notificationsData } = useCollection<Notification>(notificationsQuery);
  
  // Ordenar no cliente para garantir que o sistema funcione sem índices manuais
  const notifications = useMemo(() => {
    if (!notificationsData) return [];
    return [...notificationsData].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);
  }, [notificationsData]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error("Erro ao marcar como lida:", e);
    }
  };

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
    <header className="h-20 border-b border-border bg-background/60 backdrop-blur-md sticky top-0 z-30 px-6 lg:px-8 flex items-center justify-between text-foreground">
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Meus Documentos</span>
          {path}
        </div>
        
        <div className="relative max-w-md w-full ml-4 lg:ml-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar por nome ou tags da IA..." 
            className="pl-10 bg-muted/30 border-none h-11 focus-visible:ring-1"
            value={state.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <UploadModal />
        
          <div className="flex items-center gap-2 border-l border-border/20 pl-4 ml-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-card-foreground" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b flex items-center justify-between">
                <h4 className="font-bold text-sm">Notificações</h4>
                {unreadCount > 0 && <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">{unreadCount} novas</span>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group flex gap-3 ${!n.read ? 'bg-primary/5' : ''}`}
                      onClick={() => !n.read && handleMarkAsRead(n.id)}
                    >
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${n.type === 'upload_success' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-tight mb-1">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(n.createdAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="text-xs">Nenhuma notificação por aqui.</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <ThemeToggle />
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

          <Avatar className="h-9 w-9 border border-sidebar-border/40 bg-card">
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
