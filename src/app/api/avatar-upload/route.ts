import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { supabaseAdmin, DOCUMENTS_BUCKET } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
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

    if (!(file instanceof Blob) || !(file as File).type.startsWith('image/')) {
      return NextResponse.json({ error: 'Selecione um arquivo de imagem.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 2MB.' }, { status: 400 });
    }

    const fileName = (file as File).name || 'avatar.jpg';
    const path = `avatars/${uid}/${Date.now()}_${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: '3600' });

    if (uploadError) {
      console.error('Erro ao enviar avatar para o Supabase:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err: any) {
    console.error('Erro inesperado em /api/avatar-upload:', err);
    return NextResponse.json({ error: err?.message || 'Erro inesperado no servidor.' }, { status: 500 });
  }
}
