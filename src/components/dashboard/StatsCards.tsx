"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFlowPDF } from '@/lib/store';

export function StatsCards() {
  const { state } = useFlowPDF();
  const docs = state.documents;
  const total = docs.length;
  const folders = state.folders.length;

  const countByTag = (re: RegExp) => docs.filter(d => d.tags.some(t => re.test(t))).length;
  const importantes = countByTag(/import/i);
  const revisao = countByTag(/revis/i);
  const aprovados = countByTag(/aprov/i);

  return (
    <div className="flex gap-4 justify-end items-start mb-6">
      <Card className="w-44 rounded-xl border-sidebar-border/30 bg-card">
        <CardContent className="p-4">
          <div className="text-[11px] text-muted-foreground font-semibold uppercase">Total de PDFs</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-bold text-primary">{total}</div>
            <div className="text-xs text-muted-foreground">em {folders} pastas</div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-44 rounded-xl border-sidebar-border/30 bg-card">
        <CardContent className="p-4">
          <div className="text-[11px] text-muted-foreground font-semibold uppercase">Importantes</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-bold text-red-400">{importantes}</div>
            <div className="text-xs text-muted-foreground">documentos marcados</div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-44 rounded-xl border-sidebar-border/30 bg-card">
        <CardContent className="p-4">
          <div className="text-[11px] text-muted-foreground font-semibold uppercase">Em Revisão</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-bold text-amber-400">{revisao}</div>
            <div className="text-xs text-muted-foreground">aguardando revisão</div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-44 rounded-xl border-sidebar-border/30 bg-card">
        <CardContent className="p-4">
          <div className="text-[11px] text-muted-foreground font-semibold uppercase">Aprovados</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-bold text-emerald-400">{aprovados}</div>
            <div className="text-xs text-muted-foreground">documentos aprovados</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
