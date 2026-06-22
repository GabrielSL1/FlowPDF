-- Permite que qualquer usuário envie, leia e apague arquivos no bucket "documents".
-- Como a autenticação de usuários deste app é feita via Firebase (não via Supabase Auth),
-- usamos a chave anon para todas as operações e liberamos o bucket publicamente.
-- Se quiser restringir por usuário no futuro, isso exigiria migrar a autenticação para o Supabase Auth.

drop policy if exists "Public Access Documents Select" on storage.objects;
drop policy if exists "Public Access Documents Insert" on storage.objects;
drop policy if exists "Public Access Documents Update" on storage.objects;
drop policy if exists "Public Access Documents Delete" on storage.objects;

create policy "Public Access Documents Select"
on storage.objects for select
to public
using ( bucket_id = 'documents' );

create policy "Public Access Documents Insert"
on storage.objects for insert
to public
with check ( bucket_id = 'documents' );

create policy "Public Access Documents Update"
on storage.objects for update
to public
using ( bucket_id = 'documents' );

create policy "Public Access Documents Delete"
on storage.objects for delete
to public
using ( bucket_id = 'documents' );
