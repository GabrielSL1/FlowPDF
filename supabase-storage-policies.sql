-- Bucket "documents": leitura pública (necessária para os links de PDF/preview/avatar
-- funcionarem para qualquer usuário do app), mas escrita (insert/update/delete) só é
-- permitida usando a service_role key, que nunca é exposta ao navegador.
-- Todo upload passa agora pelas rotas /api/upload e /api/avatar-upload do servidor,
-- que verificam o login do Firebase antes de gravar no Supabase.
-- A policy "to public" antiga de insert/update/delete foi removida de propósito:
-- a chave anon (pública, visível no navegador) não tem mais permissão de escrita.

drop policy if exists "Public Access Documents Select" on storage.objects;
drop policy if exists "Public Access Documents Insert" on storage.objects;
drop policy if exists "Public Access Documents Update" on storage.objects;
drop policy if exists "Public Access Documents Delete" on storage.objects;

create policy "Public Access Documents Select"
on storage.objects for select
to public
using ( bucket_id = 'documents' );
