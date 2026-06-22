"use client";

import React from 'react';
import { useFlowPDF } from '@/lib/store';
import { OriginFilter, DateFilter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SlidersHorizontal } from 'lucide-react';

const ORIGIN_OPTIONS: { value: OriginFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'mine', label: 'Meus arquivos' },
  { value: 'shared', label: 'Compartilhados comigo' },
  { value: 'public', label: 'Pastas públicas' },
];

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'Qualquer data' },
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'custom', label: 'Período personalizado' },
];

export function FilterPopover() {
  const {
    state,
    setOriginFilter,
    setDateFilter,
    setCustomDateRange,
  } = useFlowPDF();

  const hasActiveFilter = state.originFilter !== 'all' || state.dateFilter !== 'all';

  const handleClear = () => {
    setOriginFilter('all');
    setDateFilter('all');
    setCustomDateRange({ start: null, end: null });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-11 w-11 relative shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
          {hasActiveFilter && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-5" align="end">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Origem</Label>
          <RadioGroup value={state.originFilter} onValueChange={(v) => setOriginFilter(v as OriginFilter)}>
            {ORIGIN_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value={opt.value} />
                {opt.label}
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data de envio</Label>
          <RadioGroup value={state.dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            {DATE_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value={opt.value} />
                {opt.label}
              </label>
            ))}
          </RadioGroup>

          {state.dateFilter === 'custom' && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <Label htmlFor="date-start" className="text-[10px] text-muted-foreground">De</Label>
                <Input
                  id="date-start"
                  type="date"
                  className="h-9 text-xs"
                  value={state.customDateRange.start || ''}
                  onChange={(e) => setCustomDateRange({ ...state.customDateRange, start: e.target.value || null })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="date-end" className="text-[10px] text-muted-foreground">Até</Label>
                <Input
                  id="date-end"
                  type="date"
                  className="h-9 text-xs"
                  value={state.customDateRange.end || ''}
                  onChange={(e) => setCustomDateRange({ ...state.customDateRange, end: e.target.value || null })}
                />
              </div>
            </div>
          )}
        </div>

        <Button variant="ghost" size="sm" className="w-full" onClick={handleClear} disabled={!hasActiveFilter}>
          Limpar filtros
        </Button>
      </PopoverContent>
    </Popover>
  );
}
