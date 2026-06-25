import { createClient } from '@supabase/supabase-js';

// Cliente com a chave anônima (publishable) — seguro para uso no navegador.
// Usado apenas como transporte para uploadToSignedUrl(); a autorização real
// vem do token assinado gerado pelo servidor (createSignedUploadUrl), não de
// RLS avaliado para este cliente.
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const DOCUMENTS_BUCKET = 'documents';
