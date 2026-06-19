
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
import { Loader2, Mail, Lock, User as UserIcon, AlertCircle, PlayCircle } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleFirebaseError = (error: any) => {
    console.error("Auth Error:", error);
    let message = "Ocorreu um erro inesperado.";
    
    if (error.code === 'auth/invalid-api-key' || error.message?.includes('api-key-not-valid')) {
      message = "Configuração do Firebase pendente. Use o 'Acesso de Teste' abaixo para visualizar o sistema.";
    } else {
      switch (error.code) {
        case 'auth/operation-not-allowed':
          message = "Este método de login não está ativado no Firebase Console.";
          break;
        case 'auth/popup-blocked':
          message = "O popup de login foi bloqueado pelo navegador.";
          break;
        case 'auth/email-already-in-use':
          message = "Este e-mail já está em uso.";
          break;
        case 'auth/invalid-email':
          message = "E-mail inválido.";
          break;
        case 'auth/wrong-password':
          message = "Senha incorreta.";
          break;
        case 'auth/user-not-found':
          message = "Conta não encontrada.";
          break;
        case 'auth/weak-password':
          message = "A senha deve ter pelo menos 6 caracteres.";
          break;
        default:
          message = error.message || "Falha na autenticação.";
      }
    }
    
    setErrorMessage(message);
    toast({
      variant: "destructive",
      title: "Erro de Autenticação",
      description: message,
    });
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setAuthLoading(true);
    setErrorMessage(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      handleFirebaseError(error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (mode: 'login' | 'signup') => {
    if (!auth || !email || !password) {
      setErrorMessage("Por favor, preencha todos os campos.");
      return;
    }
    setAuthLoading(true);
    setErrorMessage(null);
    
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      handleFirebaseError(error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const mockUser = {
      uid: 'demo-123',
      email: 'convidado@flowpdf.com',
      displayName: 'Usuário Convidado',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'
    };
    localStorage.setItem('flowpdf_demo_user', JSON.stringify(mockUser));
    window.location.reload(); // Recarrega para o hook useUser capturar o novo estado
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-primary">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md shadow-2xl border-none relative z-10">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
              <span className="text-3xl font-bold text-white font-headline">F</span>
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-headline font-bold">FlowPDF</CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Gestão inteligente de documentos.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuração Pendente</AlertTitle>
              <AlertDescription className="text-xs">
                O Firebase ainda não foi configurado. Você pode testar o sistema usando o botão de **Acesso de Teste** abaixo.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                className="w-full h-11" 
                onClick={() => handleEmailAuth('login')}
                disabled={authLoading}
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar na Conta"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nome completo</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="signup-name" 
                    type="text" 
                    placeholder="Seu Nome" 
                    className="pl-10"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="Mínimo 6 caracteres" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                className="w-full h-11" 
                onClick={() => handleEmailAuth('signup')}
                disabled={authLoading}
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar minha Conta"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="outline"
              className="w-full h-11 gap-3 font-medium transition-all"
              onClick={handleGoogleLogin}
              disabled={authLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </Button>

            <Button 
              variant="secondary"
              className="w-full h-11 gap-3 font-semibold bg-accent/10 text-accent hover:bg-accent/20 border-accent/20 border"
              onClick={handleDemoLogin}
            >
              <PlayCircle className="w-5 h-5" />
              Acesso de Teste (Demo)
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center pb-8 pt-2">
          <p className="text-[10px] text-muted-foreground px-8 leading-relaxed">
            O Modo de Teste permite navegar no sistema sem configurar o Firebase. 
            Para uso real, insira as chaves em src/firebase/config.ts.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
