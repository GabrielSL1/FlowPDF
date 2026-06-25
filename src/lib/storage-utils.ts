/**
 * Sanitiza um nome de arquivo para uso como chave (key) no Supabase Storage.
 *
 * O Storage rejeita chaves com caracteres acentuados (ex: "Relatório.pdf",
 * "Março.pdf") com um erro 400 "Invalid key" — isso é extremamente comum em
 * nomes de arquivo em português e, sem essa sanitização, qualquer PDF com
 * acento no nome falha o upload silenciosamente do ponto de vista do usuário.
 * O nome ORIGINAL (com acentos) continua sendo salvo normalmente no Firestore
 * e exibido na interface; só a chave de armazenamento é sanitizada.
 */
export function sanitizeStorageFileName(fileName: string): string {
  const combiningDiacriticalMarks = new RegExp('[̀-ͯ]', 'g');
  const withoutDiacritics = fileName.normalize('NFD').replace(combiningDiacriticalMarks, '');
  return withoutDiacritics.replace(/[^a-zA-Z0-9._-]/g, '_');
}
