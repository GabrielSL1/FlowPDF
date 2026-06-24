"use client";

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState<boolean | null>(null);
  // Evita que o efeito de inicialização sobrescreva um clique que o usuário
  // já tenha feito antes dele terminar de ler o localStorage (condição de
  // corrida que fazia o toggle "não funcionar" em cliques rápidos no mobile).
  const userInteractedRef = React.useRef(false);

  // initialize on mount to avoid SSR/hydration mismatch
  React.useEffect(() => {
    if (userInteractedRef.current) return;
    const stored = localStorage.getItem('theme');
    if (stored) {
      setIsDark(stored === 'dark');
      return;
    }
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  // apply class when user toggles
  React.useEffect(() => {
    if (isDark === null) return;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    userInteractedRef.current = true;
    setIsDark(!document.documentElement.classList.contains('dark'));
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Alternar tema"
    >
      {isDark === null ? (
        <Sun className="w-5 h-5 opacity-60" />
      ) : isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </Button>
  );
}
