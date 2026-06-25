/**
 * Defesa em profundidade: as Firestore Rules já impedem gravar uma "url"/
 * "thumbnailUrl" fora do nosso próprio bucket no Supabase (ver firestore.rules,
 * função isOwnStorageUrl). Esta checagem replica a mesma validação no cliente,
 * para o caso de dados antigos/legados ou de uma futura regressão nas regras
 * — nunca renderiza em <iframe>/<img>/window.open uma URL que não seja
 * explicitamente https e do nosso próprio domínio de Storage.
 */
const TRUSTED_STORAGE_HOST = 'hvbzkzzcrtopnclbkkbl.supabase.co';
const TRUSTED_STORAGE_PATH_PREFIX = '/storage/v1/object/public/documents/';

export function isTrustedStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' &&
      parsed.hostname === TRUSTED_STORAGE_HOST &&
      parsed.pathname.startsWith(TRUSTED_STORAGE_PATH_PREFIX);
  } catch {
    return false;
  }
}
