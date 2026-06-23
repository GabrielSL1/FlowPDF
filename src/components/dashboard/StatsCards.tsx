"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFlowPDF } from '@/lib/store';

export function StatsCards() {
  const { state } = useFlowPDF();
  const docs = state.documents;
  const total = docs.length;
  const folders = state.folders.length;

  const { importantes, revisao, aprovados } = React.useMemo(() => {
    let importantes = 0, revisao = 0, aprovados = 0;
    for (const d of docs) {
      if (d.status === 'importante') importantes++;
      else if (d.status === 'revisao') revisao++;
      else if (d.status === 'aprovado') aprovados++;
    }
    return { importantes, revisao, aprovados };
  }, [docs]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <Card className="w-full rounded-xl border-sidebar-border/30 bg-card">
        <CardContent className="p-4">
          <div className="text-[11px] text-muted-foreground font-semibold uppercase">Total de PDFs</div>
          <div className="mt-2 flex flex-col gap-0.5">
            <div className="text-3xl font-bold text-primary">{total}</div>
            <div className="text-xs text-muted-foreground">em {folders} pastas</div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full rounded-xl border-sidebar-border/30 bg-card">
        <CardContent className="p-4">
          <div className="text-[11px] text-muted-foreground font-semibold uppercase">Importantes</div>
          <div className="mt-2 flex flex-col gap-0.5">
            <div className="text-3xl font-bold text-red-400">{importantes}</div>
            <div className="text-xs text-muted-foreground">documentos marcados</div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full rounded-xl border-sidebar-border/30 bg-card">
        <CardContent className="p-4">
          <div className="text-[11px] text-muted-foreground font-semibold uppercase">Em Revisão</div>
          <div className="mt-2 flex flex-col gap-0.5">
            <div className="text-3xl font-bold text-amber-400">{revisao}</div>
            <div className="text-xs text-muted-foreground">aguardando revisão</div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full rounded-xl border-sidebar-border/30 bg-card">
        <CardContent className="p-4">
          <div className="text-[11px] text-muted-foreground font-semibold uppercase">Aprovados</div>
          <div className="mt-2 flex flex-col gap-0.5">
            <div className="text-3xl font-bold text-emerald-400">{aprovados}</div>
            <div className="text-xs text-muted-foreground">documentos aprovados</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
