
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { FlowPDFProvider } from '@/lib/store';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DocumentGrid } from '@/components/dashboard/DocumentGrid';
import { 
  SidebarProvider, 
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

export default function FlowPDFPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <FlowPDFProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen w-full bg-background overflow-hidden">
          {/* Sidebar Area */}
          <div className="w-80 h-full bg-primary flex-shrink-0">
            <SidebarNav />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#F1F3F5] rounded-l-[2rem] shadow-2xl relative z-10 -ml-4 border-l overflow-hidden">
            <DashboardHeader />
            
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/10">
              <div className="max-w-[1600px] mx-auto">
                <div className="p-8 pb-0">
                  <h1 className="text-3xl font-headline font-bold text-foreground">Documentos</h1>
                  <p className="text-muted-foreground mt-1">Gerencie e navegue no seu espaço de trabalho inteligente.</p>
                </div>
                
                <DocumentGrid />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </FlowPDFProvider>
  );
}
