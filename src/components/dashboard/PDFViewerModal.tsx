
"use client";

import React from 'react';
import { useDocuFlow } from '@/lib/store';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Tag, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function PDFViewerModal({ docId, onClose }: { docId: string, onClose: () => void }) {
  const { state } = useDocuFlow();
  const doc = state.documents.find(d => d.id === docId);

  if (!doc) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center text-primary">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base truncate max-w-md">{doc.name}</DialogTitle>
              <p className="text-xs text-muted-foreground">{doc.size} • Uploaded on {new Date(doc.uploadDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-8">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Download
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row bg-[#F8F9FA]">
          {/* Main Viewer Area */}
          <div className="flex-1 p-6 overflow-auto flex justify-center">
            <div className="w-full max-w-4xl bg-white shadow-2xl rounded-sm aspect-[1/1.41] flex flex-col items-center justify-center border text-muted-foreground p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <Tag className="w-10 h-10 opacity-20" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Integrated PDF Viewer</h2>
              <p className="max-w-md">In a production environment, this area would render the PDF file using a library like react-pdf or a native iframe.</p>
              <div className="mt-8 p-4 bg-muted/50 rounded-lg w-full text-left font-mono text-xs">
                 // Mock file stream: {doc.name}<br/>
                 // Content Hash: {Math.random().toString(36).substring(7)}<br/>
                 // Security Level: AES-256 Encrypted
              </div>
            </div>
          </div>

          {/* AI Insights Sidebar */}
          <div className="w-full md:w-80 bg-background border-l p-6 overflow-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <h3 className="font-headline font-semibold">AI Insights</h3>
            </div>

            <section className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Tag className="w-3 h-3" /> AI Suggested Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {doc.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-3 py-1">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>

            <Separator className="mb-8" />

            <section>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Extracted Keywords</h4>
              <div className="flex flex-wrap gap-1.5">
                {doc.keywords.map((kw, i) => (
                  <span key={i} className="text-sm px-2 py-0.5 rounded-md bg-muted text-muted-foreground border">
                    {kw}
                  </span>
                ))}
              </div>
            </section>
            
            <div className="mt-12 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-xs text-accent-foreground font-medium mb-1">AI Summary</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This document contains significant information regarding {doc.keywords.slice(0, 2).join(' and ')}. Our AI recommends filing this in {doc.tags[0] || 'General'} category.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
