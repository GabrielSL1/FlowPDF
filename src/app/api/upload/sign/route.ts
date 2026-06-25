import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { supabaseAdmin, DOCUMENTS_BUCKET } from '@/lib/supabase-admin';
import { sanitizeStorageFileName } from '@/lib/storage-utils';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Endpoint leve (só JSON, nunca recebe os bytes do PDF) que autoriza o
 * upload e devolve URLs assinadas para o cliente enviar o arquivo e a
 * miniatura DIRETO para o Supabase Storage.
 *
 * Existe porque Serverless Functions na Vercel têm um limite de payload de
 * requisição bem menor que os 25MB que o app permite (na prática, ~4.5MB) —
 * um PDF de 10MB enviado pelo fluxo antigo (multipart/form-data direto pra
 * rota da API) era rejeitado pela plataforma antes mesmo de chegar no nosso
 * código, sem nenhum log ou erro nosso para explicar o motivo.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!idToken) {
      console.warn('[api/upload/sign] Requisição sem token de autorização.');
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await verifyIdToken(idToken);
      uid = decoded.uid;
    } catch (err) {
      console.error('[api/upload/sign] Token inválido:', err);
      return NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 });
    }

    const retryAfter = checkRateLimit(`upload-sign:${uid}`, 20, 60_000);
    if (retryAfter !== null) {
      console.warn(`[api/upload/sign] uid=${uid} excedeu o limite de requisições (retry em ${retryAfter}s).`);
      return NextResponse.json(
        { error: 'Muitas tentativas de upload. Aguarde um momento e tente novamente.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const body = await req.json().catch(() => null);
    const fileName: unknown = body?.fileName;
    const fileSize: unknown = body?.fileSize;

    console.log(`[api/upload/sign] uid=${uid} fileName=${fileName} fileSize=${fileSize}`);

    if (typeof fileName !== 'string' || !fileName.toLowerCase().endsWith('.pdf')) {
      console.warn(`[api/upload/sign] Rejeitado: nome de arquivo inválido (${fileName}).`);
      return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos.' }, { status: 400 });
    }
    if (typeof fileSize !== 'number' || !Number.isFinite(fileSize) || fileSize <= 0) {
      console.warn(`[api/upload/sign] Rejeitado: tamanho de arquivo ausente/inválido (${fileSize}).`);
      return NextResponse.json({ error: 'Tamanho do arquivo inválido.' }, { status: 400 });
    }
    if (fileSize > MAX_FILE_SIZE) {
      console.warn(`[api/upload/sign] Rejeitado: arquivo muito grande (${fileSize} bytes).`);
      return NextResponse.json({ error: 'Arquivo muito grande (máximo 25MB).' }, { status: 400 });
    }

    // O Supabase Storage rejeita chaves com acentos (comuns em nomes de
    // arquivo em português, ex: "Relatório.pdf") com 400 "Invalid key" — só a
    // CHAVE de armazenamento é sanitizada; o nome original (com acentos) é
    // salvo no Firestore e usado normalmente na interface.
    const safeFileName = sanitizeStorageFileName(fileName);
    const storagePath = `${uid}/${Date.now()}_${safeFileName}`;
    const thumbPath = `${uid}/thumbnails/${Date.now()}_${safeFileName}.jpg`;

    const [fileSignedResult, thumbSignedResult] = await Promise.all([
      supabaseAdmin.storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(storagePath),
      supabaseAdmin.storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(thumbPath),
    ]);

    if (fileSignedResult.error || !fileSignedResult.data) {
      console.error('[api/upload/sign] Falha ao gerar URL assinada para o PDF:', fileSignedResult.error);
      return NextResponse.json({ error: 'Não foi possível preparar o envio do arquivo.' }, { status: 500 });
    }

    const filePublicUrl = supabaseAdmin.storage.from(DOCUMENTS_BUCKET).getPublicUrl(storagePath).data.publicUrl;

    let thumbnail: { path: string; token: string; publicUrl: string } | null = null;
    if (thumbSignedResult.error || !thumbSignedResult.data) {
      console.warn('[api/upload/sign] Falha ao gerar URL assinada para a miniatura (não bloqueante):', thumbSignedResult.error);
    } else {
      thumbnail = {
        path: thumbPath,
        token: thumbSignedResult.data.token,
        publicUrl: supabaseAdmin.storage.from(DOCUMENTS_BUCKET).getPublicUrl(thumbPath).data.publicUrl,
      };
    }

    console.log(`[api/upload/sign] uid=${uid}: URLs assinadas geradas com sucesso para "${storagePath}".`);

    return NextResponse.json({
      file: { path: storagePath, token: fileSignedResult.data.token, publicUrl: filePublicUrl },
      thumbnail,
    });
  } catch (err: any) {
    console.error('[api/upload/sign] Erro inesperado:', err);
    return NextResponse.json({ error: err?.message || 'Erro inesperado no servidor.' }, { status: 500 });
  }
}
