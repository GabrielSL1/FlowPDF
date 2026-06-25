"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldCheck } from 'lucide-react';
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
    console.error("Erro de autenticação Firebase:", error.code, error.message);

    // O usuário só fechou o popup ou clicou duas vezes rápido — não é um erro real, não precisa de toast.
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      return;
    }

    let message = "Ocorreu um erro inesperado.";

    if (error.code === 'auth/api-key-not-valid' || error.message?.includes('api-key-not-valid')) {
      message = "A Chave de API do Firebase está sendo validada. Aguarde alguns segundos e tente novamente.";
    } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      message = "E-mail ou senha incorretos.";
    } else if (error.code === 'auth/email-already-in-use') {
      message = "Este e-mail já está em uso.";
    } else if (error.code === 'auth/operation-not-allowed') {
      message = "O login com Google ainda não está habilitado neste projeto. Ative em Firebase Console → Authentication → Sign-in method → Google.";
    } else if (error.code === 'auth/unauthorized-domain') {
      message = "Este domínio não está autorizado para login. Adicione-o em Firebase Console → Authentication → Settings → Authorized domains.";
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      message = "Este e-mail já tem uma conta criada com senha. Entre com e-mail e senha.";
    } else if (error.code === 'auth/popup-blocked') {
      message = "O navegador bloqueou o popup do Google. Permitindo popups ou tentando novamente deve funcionar.";
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

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Informe seu e-mail",
        description: "Digite o e-mail da sua conta no campo acima antes de solicitar a redefinição de senha.",
      });
      return;
    }
    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      // Não revela se o e-mail existe ou não na base (evita enumeração de usuários) —
      // mostramos a mesma mensagem de sucesso independente do resultado, exceto para
      // erros que não dependem da existência da conta (ex: formato de e-mail inválido).
      if (error.code !== 'auth/invalid-email') {
        setAuthLoading(false);
        toast({ title: "Se este e-mail estiver cadastrado, um link de redefinição foi enviado." });
        return;
      }
      handleFirebaseError(error);
      setAuthLoading(false);
      return;
    }
    setAuthLoading(false);
    toast({ title: "Se este e-mail estiver cadastrado, um link de redefinição foi enviado." });
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setAuthLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError: any) {
          handleFirebaseError(redirectError);
          return;
        }
      }
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="FlowPDF" className="w-16 h-16 rounded-2xl object-contain shadow-lg" />
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
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <Input id="login-email" type="email" placeholder="exemplo@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="text-right">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
                  onClick={handlePasswordReset}
                  disabled={authLoading}
                >
                  Esqueci minha senha
                </button>
              </div>
              <Button className="w-full mt-2" onClick={() => handleEmailAuth('login')} disabled={authLoading}>
                {authLoading ? <Loader2 className="animate-spin" /> : "Entrar"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nome Completo</Label>
                <Input id="signup-name" placeholder="Seu nome" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input id="signup-email" type="email" placeholder="exemplo@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input id="signup-password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="w-full mt-2" onClick={() => handleEmailAuth('signup')} disabled={authLoading}>
                {authLoading ? <Loader2 className="animate-spin" /> : "Cadastrar Agora"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Ou continue com</span></div>
          </div>

          <Button variant="outline" className="w-full gap-3" onClick={handleGoogleLogin} disabled={authLoading}>
            {authLoading ? <Loader2 className="animate-spin" /> : "Google Account"}
          </Button>
        </CardContent>
        <CardFooter>
          <Alert className="bg-primary/5 border-primary/20">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs font-bold text-primary uppercase tracking-wider">Acesso Criptografado</AlertTitle>
            <AlertDescription className="text-[10px] text-muted-foreground">Seus dados e documentos são protegidos pelo Firebase Cloud Security.</AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
    </div>
  );
}
