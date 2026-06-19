"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleFirebaseError = (error: any) => {
    let message = "Ocorreu um erro inesperado.";
    
    if (error.code === 'auth/api-key-not-valid') {
      message = "A Chave de API do Firebase é inválida ou ainda está sendo ativada. Aguarde 1 minuto e tente novamente.";
    } else if (error.code === 'auth/invalid-credential') {
      message = "E-mail ou senha incorretos.";
    } else {
      message = error.message || "Erro na autenticação.";
    }
    
    toast({
      variant: "destructive",
      title: "Erro de Acesso",
      description: message,
    });
  };

  const handleEmailAuth = async (mode: 'login' | 'signup') => {
    if (!email || !password) return;
    setAuthLoading(true);
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      handleFirebaseError(error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setAuthLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      handleFirebaseError(error);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">F</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">FlowPDF</CardTitle>
          <CardDescription>Gestão Inteligente de Documentos</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button className="w-full" onClick={() => handleEmailAuth('login')} disabled={authLoading}>
                {authLoading ? <Loader2 className="animate-spin" /> : "Entrar"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <Input placeholder="Nome" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button className="w-full" onClick={() => handleEmailAuth('signup')} disabled={authLoading}>
                {authLoading ? <Loader2 className="animate-spin" /> : "Cadastrar"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2">Ou</span></div>
          </div>

          <Button variant="outline" className="w-full gap-3" onClick={handleGoogleLogin} disabled={authLoading}>
            Entrar com Google
          </Button>
        </CardContent>
        <CardFooter>
          <Alert className="bg-primary/5 border-primary/20">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs font-bold text-primary">Conexão Segura</AlertTitle>
            <AlertDescription className="text-[10px] text-muted-foreground">Seus documentos estão protegidos.</AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
    </div>
  );
}
