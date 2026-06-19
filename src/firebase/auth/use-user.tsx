
'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Primeiro, verifica se há um usuário de teste no localStorage
    const demoUser = typeof window !== 'undefined' ? localStorage.getItem('flowpdf_demo_user') : null;
    if (demoUser) {
      setUser(JSON.parse(demoUser));
      setLoading(false);
      return;
    }

    // Se não houver demo, segue o fluxo normal do Firebase
    try {
      return onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
    } catch (e) {
      setLoading(false);
    }
  }, [auth]);

  return { user, loading };
}
