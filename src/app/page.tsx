
"use client";

import React from 'react';
import { DocuFlowProvider } from '@/lib/store';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DocumentGrid } from '@/components/dashboard/DocumentGrid';
import { 
  SidebarProvider, 
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';

export default function DocuFlowPage() {
  return (
    <DocuFlowProvider>
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
                  <h1 className="text-3xl font-headline font-bold text-foreground">Documents</h1>
                  <p className="text-muted-foreground mt-1">Manage and navigate your intelligent document workspace.</p>
                </div>
                
                <DocumentGrid />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </DocuFlowProvider>
  );
}
