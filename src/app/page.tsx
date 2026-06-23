
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { FlowPDFProvider } from '@/lib/store';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DocumentGrid } from '@/components/dashboard/DocumentGrid';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';

export default function FlowPDFPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Sidebar Area (desktop) */}
        <div className="hidden lg:block w-80 h-full bg-sidebar flex-shrink-0">
          <SidebarNav />
        </div>

        {/* Sidebar Area (mobile drawer) */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="p-0 w-80 max-w-[85vw] bg-sidebar border-none">
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-background relative z-10 overflow-hidden">
          <DashboardHeader onMenuClick={() => setMobileNavOpen(true)} />

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/10">
            <div className="max-w-[1600px] mx-auto">
              <div className="p-4 sm:p-8 pb-0">
                <h1 className="text-2xl sm:text-3xl font-headline font-bold text-foreground">Documentos</h1>
                <p className="text-muted-foreground mt-1">Gerencie e navegue no seu espaço de trabalho inteligente.</p>
              </div>

              <div className="px-4 sm:px-8">
                <StatsCards />
              </div>

              <DocumentGrid />
            </div>
          </div>
        </main>
      </div>
    </FlowPDFProvider>
  );
}
