
'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    try {
      // Ouve mudanças reais no estado de autenticação do Firebase
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        
        // Limpa o usuário de demo se um usuário real logar
        if (firebaseUser && typeof window !== 'undefined') {
          localStorage.removeItem('flowpdf_demo_user');
        }
      });
      
      // Também verifica se há um demoUser apenas se não houver listener ativo ou erro
      const demoUser = typeof window !== 'undefined' ? localStorage.getItem('flowpdf_demo_user') : null;
      if (demoUser && !user) {
        setUser(JSON.parse(demoUser));
      }

      return () => unsubscribe();
    } catch (e) {
      console.error("Erro no listener de auth:", e);
      setLoading(false);
    }
  }, [auth]);

  return { user, loading };
}
