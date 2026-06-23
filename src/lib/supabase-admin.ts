import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

// Cliente com a service_role key — ignora as policies do bucket.
// Só pode ser usado em código que roda no servidor (API routes), nunca no navegador.
function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  return client;
}

export const supabaseAdmin = {
  storage: {
    from: (bucket: string) => getSupabaseAdmin().storage.from(bucket),
  },
};

export const DOCUMENTS_BUCKET = 'documents';
