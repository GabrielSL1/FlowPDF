
"use client";

import React, { useState } from 'react';
import { useDocuFlow } from '@/lib/store';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { tagDocument } from '@/ai/flows/ai-document-tagging';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export function UploadModal() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { addDocument, state } = useDocuFlow();
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF document.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      // Simulate file upload progress
      const interval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 10 : p));
      }, 500);

      // AI Analysis
      // In a real app, we'd extract text from the PDF.
      // For this scaffold, we'll provide the filename and some generic context.
      const aiResults = await tagDocument({ 
        documentContent: `Document titled ${file.name}. This is a simulated extraction of content for AI tagging purposes in DocuFlow.`
      });

      clearInterval(interval);
      setProgress(100);

      const newDoc = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: URL.createObjectURL(file),
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString(),
        type: 'pdf' as const,
        tags: aiResults.tags,
        keywords: aiResults.keywords,
        folderId: state.currentFolderId,
      };

      addDocument(newDoc);
      
      setTimeout(() => {
        setUploading(false);
        setOpen(false);
        setProgress(0);
        toast({
          title: "Upload successful",
          description: `${file.name} has been analyzed and tagged by AI.`,
        });
      }, 800);

    } catch (error) {
      setUploading(false);
      toast({
        title: "Upload failed",
        description: "Something went wrong while processing the document.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Upload className="w-4 h-4" /> Upload PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {!uploading ? (
            <div className="border-2 border-dashed border-muted rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-accent/50 transition-colors group cursor-pointer relative">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleUpload}
                accept=".pdf"
              />
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground mt-1">PDF documents only (max. 50MB)</p>
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Analyzing document...</span>
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 flex gap-3 items-start">
                <Loader2 className="w-4 h-4 text-accent animate-spin mt-0.5" />
                <div className="text-xs leading-relaxed">
                  Our AI is currently scanning the document to extract key metadata, 
                  suggest relevant tags, and index content for smart searching.
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
