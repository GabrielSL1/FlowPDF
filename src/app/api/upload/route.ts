import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { supabaseAdmin, DOCUMENTS_BUCKET } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!idToken) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err) {
    console.error('Token inválido:', err);
    return NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const thumbnail = formData.get('thumbnail');

  if (!(file instanceof Blob) || (file as File).type !== 'application/pdf') {
    return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande (máximo 25MB).' }, { status: 400 });
  }

  const fileName = (file as File).name || 'documento.pdf';
  const storagePath = `${uid}/${Date.now()}_${fileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, { contentType: 'application/pdf', cacheControl: '3600' });

  if (uploadError) {
    console.error('Erro ao enviar PDF para o Supabase:', uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage.from(DOCUMENTS_BUCKET).getPublicUrl(storagePath);

  let thumbnailUrl: string | undefined;
  if (thumbnail instanceof Blob && thumbnail.size > 0 && thumbnail.size < 5 * 1024 * 1024) {
    const thumbPath = `${uid}/thumbnails/${Date.now()}_${fileName}.jpg`;
    const { error: thumbError } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .upload(thumbPath, thumbnail, { contentType: 'image/jpeg', cacheControl: '3600' });

    if (!thumbError) {
      thumbnailUrl = supabaseAdmin.storage.from(DOCUMENTS_BUCKET).getPublicUrl(thumbPath).data.publicUrl;
    }
  }

  return NextResponse.json({ url: urlData.publicUrl, thumbnailUrl, size: file.size });
}
