
'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [instances, setInstances] = useState<{
    app: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
    storage: FirebaseStorage;
  } | null>(null);

  useEffect(() => {
    const { app, firestore, auth, storage } = initializeFirebase();
    setInstances({ app, firestore, auth, storage });
  }, []);

  if (!instances) return null;

  return (
    <FirebaseProvider 
      app={instances.app} 
      firestore={instances.firestore} 
      auth={instances.auth}
      storage={instances.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
