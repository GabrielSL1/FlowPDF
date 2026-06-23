
"use client";

import React, { useState, useMemo } from 'react';
import { useFlowPDF } from '@/lib/store';
import { useUser, useAuth, useFirestore, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Search, Bell, Settings, LogOut, User as UserIcon, Check, Trash2, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UploadModal } from './UploadModal';
import { SettingsModal } from './SettingsModal';
import { FilterPopover } from './FilterPopover';
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
import { query, collection, where, limit, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Notification } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function isNotificationRead(n: Notification, uid: string): boolean {
  if (n.readBy) return n.readBy.includes(uid);
  return !!n.read;
}

export function DashboardHeader({ onMenuClick }: { onMenuClick?: () => void } = {}) {
  const { state, setSearchQuery } = useFlowPDF();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Notificações próprias (ex: confirmação do seu próprio upload)
  const ownNotificationsQuery = useMemo(() =>
    user ? query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      limit(20)
    ) : null
  , [db, user]);
  const { data: ownNotificationsData } = useCollection<Notification>(ownNotificationsQuery);

  // Notificações de uploads em pastas públicas, feitos por outros usuários — em tempo real
  const publicNotificationsQuery = useMemo(() =>
    user ? query(
      collection(db, 'notifications'),
      where('isPublic', '==', true),
      limit(20)
    ) : null
  , [db, user]);
  const { data: publicNotificationsData } = useCollection<Notification>(publicNotificationsQuery);

  // Notificações de arquivos compartilhados diretamente com você — em tempo real
  const sharedNotificationsQuery = useMemo(() =>
    user?.email ? query(
      collection(db, 'notifications'),
      where('sharedWith', 'array-contains', user.email),
      limit(20)
    ) : null
  , [db, user]);
  const { data: sharedNotificationsData } = useCollection<Notification>(sharedNotificationsQuery);

  // Junta tudo, remove duplicatas e ordena (sem orderBy no Firestore p/ evitar exigir índice)
  const notifications = useMemo(() => {
    const map = new Map<string, Notification>();
    [...(ownNotificationsData || []), ...(publicNotificationsData || []), ...(sharedNotificationsData || [])]
      .forEach(n => {
        // Não mostra pro próprio autor a notificação de "alguém enviou um arquivo"
        if (n.uploaderId && n.uploaderId === user?.uid && n.userId !== user?.uid) return;
        map.set(n.id, n);
      });
    return Array.from(map.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [ownNotificationsData, publicNotificationsData, sharedNotificationsData, user]);

  const visibleNotifications = useMemo(
    () => notifications.filter(n => !dismissedIds.has(n.id)),
    [notifications, dismissedIds]
  );

  const unreadCount = user ? visibleNotifications.filter(n => !isNotificationRead(n, user.uid)).length : 0;

  const handleMarkAsRead = async (n: Notification) => {
    if (!user) return;
    try {
      if (n.readBy) {
        await updateDoc(doc(db, 'notifications', n.id), { readBy: arrayUnion(user.uid) });
      } else {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
    } catch (e) {
      console.error("Erro ao marcar como lida:", e);
    }
  };

  const handleClearAll = () => {
    if (!user || visibleNotifications.length === 0) return;
    const ids = visibleNotifications.map(n => n.id);
    setDismissedIds(prev => new Set([...prev, ...ids]));
    visibleNotifications.forEach(n => {
      if (!isNotificationRead(n, user.uid)) handleMarkAsRead(n);
    });
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
    <header className="h-20 border-b border-border bg-background/60 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 lg:px-8 flex items-center justify-between text-foreground gap-2">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted-foreground shrink-0"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground shrink-0">
          <span className="font-medium text-foreground">Meus Documentos</span>
          {path}
        </div>

        <div className="flex items-center gap-2 max-w-md w-full sm:ml-4 lg:ml-8 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              className="pl-10 bg-muted/30 border-none h-11 focus-visible:ring-1"
              value={state.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <FilterPopover />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <UploadModal />

          <div className="flex items-center gap-1 sm:gap-2 border-l border-border/20 pl-2 sm:pl-4 ml-1 sm:ml-4">
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
              <div className="p-4 border-b flex items-center justify-between gap-2">
                <h4 className="font-bold text-sm">Notificações</h4>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">{unreadCount} novas</span>}
                  {visibleNotifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] text-muted-foreground hover:text-destructive gap-1"
                      onClick={handleClearAll}
                    >
                      <Trash2 className="w-3 h-3" /> Limpar
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {visibleNotifications.length > 0 ? (
                  visibleNotifications.map((n) => {
                    const read = user ? isNotificationRead(n, user.uid) : true;
                    return (
                    <div
                      key={n.id}
                      className={`p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group flex gap-3 ${!read ? 'bg-primary/5' : ''}`}
                      onClick={() => !read && handleMarkAsRead(n)}
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
                      {!read && (
                        <div className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5" />
                      )}
                    </div>
                    );
                  })
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
