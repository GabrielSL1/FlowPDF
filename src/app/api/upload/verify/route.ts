import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { supabaseAdmin, DOCUMENTS_BUCKET } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const PDF_MAGIC_BYTES = '%PDF-';

/**
 * No fluxo de upload direto (cliente -> Supabase via signed URL), nosso
 * servidor nunca vê os bytes do arquivo — só o nome/tamanho declarados pelo
 * cliente. Isso significa que um atacante pode subir QUALQUER conteúdo
 * (ex: HTML com <script>) com extensão/contentType ".pdf"/"application/pdf"
 * forjados. Este endpoint faz uma verificação leve pós-upload (lê só os
 * primeiros bytes via Range request) para confirmar que o arquivo é
 * realmente um PDF (assinatura "%PDF-"); se não for, remove o arquivo do
 * Storage e rejeita antes de o documento ser salvo no Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      console.warn('[api/upload/verify] Requisição sem token de autorização.');
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let uid: string;
    try {
      uid = (await verifyIdToken(idToken)).uid;
    } catch (err) {
      console.error('[api/upload/verify] Token inválido:', err);
      return NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 });
    }

    const retryAfter = checkRateLimit(`upload-verify:${uid}`, 20, 60_000);
    if (retryAfter !== null) {
      console.warn(`[api/upload/verify] uid=${uid} excedeu o limite de requisições (retry em ${retryAfter}s).`);
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde um momento e tente novamente.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const body = await req.json().catch(() => null);
    const path: unknown = body?.path;

    if (typeof path !== 'string' || !path.startsWith(`${uid}/`)) {
      console.warn(`[api/upload/verify] uid=${uid} tentou verificar um path fora do próprio escopo: "${path}".`);
      return NextResponse.json({ error: 'Caminho de arquivo inválido.' }, { status: 403 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path);
    const res = await fetch(publicUrlData.publicUrl, { headers: { Range: 'bytes=0-1023' } });

    if (!res.ok && res.status !== 206) {
      console.error(`[api/upload/verify] uid=${uid}: falha ao buscar "${path}" para verificação (HTTP ${res.status}).`);
      return NextResponse.json({ error: 'Não foi possível verificar o arquivo enviado.' }, { status: 502 });
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const header = buf.toString('latin1', 0, PDF_MAGIC_BYTES.length);

    if (header !== PDF_MAGIC_BYTES) {
      console.warn(`[api/upload/verify] uid=${uid}: arquivo em "${path}" não é um PDF válido (assinatura="${header}"). Removendo do Storage.`);
      const { error: removeError } = await supabaseAdmin.storage.from(DOCUMENTS_BUCKET).remove([path]);
      if (removeError) {
        console.error(`[api/upload/verify] Falha ao remover arquivo inválido "${path}":`, removeError);
      }
      return NextResponse.json({ error: 'O arquivo enviado não é um PDF válido.' }, { status: 400 });
    }

    console.log(`[api/upload/verify] uid=${uid}: "${path}" verificado como PDF válido.`);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/upload/verify] Erro inesperado:', err);
    return NextResponse.json({ error: err?.message || 'Erro inesperado no servidor.' }, { status: 500 });
  }
}
