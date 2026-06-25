import { loadPdfJs } from './pdfjs-loader';

export interface PdfAttachmentMeta {
  name: string;
  mimeType: string;
  size: number;
  /** ISO 8601, quando disponível no PDF (best-effort). */
  date: string | null;
}

export interface PdfAttachmentWithContent extends PdfAttachmentMeta {
  content: Uint8Array;
}

const EXTENSION_MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  rtf: 'application/rtf',
  xml: 'application/xml',
  json: 'application/json',
  html: 'text/html',
  htm: 'text/html',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  eml: 'message/rfc822',
  msg: 'application/vnd.ms-outlook',
  dwg: 'image/vnd.dwg',
};

export function inferMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_MIME_MAP[ext] || 'application/octet-stream';
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function stripPath(name: string): string {
  return name.split(/[\\/]/).pop() || name;
}

function parsePdfDate(raw: string): string | null {
  // Formato padrão do PDF: "D:YYYYMMDDHHmmSS(+/-HH'mm'|Z)?"
  const match = /^D?:?(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/.exec(raw);
  if (!match) return null;
  const [, y, mo = '01', d = '01', h = '00', mi = '00', s = '00'] = match;
  const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Tentativa best-effort de obter as datas (CreationDate/ModDate) dos anexos
 * lendo diretamente a árvore /Names/EmbeddedFiles do PDF com pdf-lib, já que
 * a API pública do pdfjs-dist (getAttachments()) não expõe essa informação.
 * Qualquer falha aqui é silenciosa: a listagem/download dos anexos não depende
 * desse resultado, só perde a coluna de data.
 */
async function extractAttachmentDates(arrayBuffer: ArrayBuffer): Promise<Map<string, string>> {
  const dates = new Map<string, string>();
  try {
    const { PDFDocument, PDFDict, PDFArray, PDFName, PDFRawStream, PDFString, PDFHexString } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true, updateMetadata: false });

    const namesDict = pdfDoc.catalog.lookup(PDFName.of('Names'));
    if (!(namesDict instanceof PDFDict)) return dates;
    const embeddedFilesDict = namesDict.lookup(PDFName.of('EmbeddedFiles'));
    if (!(embeddedFilesDict instanceof PDFDict)) return dates;

    const decodeName = (obj: unknown): string | null => {
      if (obj instanceof PDFString || obj instanceof PDFHexString) return stripPath(obj.decodeText());
      return null;
    };

    const collectFromNamesArray = (namesArray: any) => {
      for (let i = 0; i + 1 < namesArray.size(); i += 2) {
        const filename = decodeName(namesArray.lookup(i));
        const fileSpec = namesArray.lookup(i + 1);
        if (!filename || !(fileSpec instanceof PDFDict)) continue;

        const efDict = fileSpec.lookup(PDFName.of('EF'));
        if (!(efDict instanceof PDFDict)) continue;
        const fileStream = efDict.lookup(PDFName.of('UF')) ?? efDict.lookup(PDFName.of('F'));
        if (!(fileStream instanceof PDFRawStream)) continue;

        const params = fileStream.dict.lookup(PDFName.of('Params'));
        if (!(params instanceof PDFDict)) continue;
        const rawDate = params.lookup(PDFName.of('ModDate')) ?? params.lookup(PDFName.of('CreationDate'));
        if (rawDate instanceof PDFString || rawDate instanceof PDFHexString) {
          const iso = parsePdfDate(rawDate.decodeText());
          if (iso) dates.set(filename, iso);
        }
      }
    };

    const walkNameTree = (dict: any, depth = 0) => {
      if (depth > 10) return;
      const names = dict.lookup(PDFName.of('Names'));
      if (names instanceof PDFArray) collectFromNamesArray(names);
      const kids = dict.lookup(PDFName.of('Kids'));
      if (kids instanceof PDFArray) {
        for (let i = 0; i < kids.size(); i++) {
          const kid = kids.lookup(i);
          if (kid instanceof PDFDict) walkNameTree(kid, depth + 1);
        }
      }
    };

    walkNameTree(embeddedFilesDict);
  } catch (err) {
    console.warn('[pdf-attachments] Não foi possível extrair datas dos anexos (ignorando, recurso opcional):', err);
  }
  return dates;
}

/**
 * Detecta e extrai todos os anexos incorporados (Embedded Files) de um PDF,
 * equivalente à aba "Anexos" do Adobe Acrobat Reader.
 *
 * Retorna lista vazia quando o PDF legitimamente não tem anexos (caso normal,
 * não é erro). Lança uma exceção quando a leitura do PDF falha de fato (ex:
 * arquivo corrompido) — cabe a cada chamador decidir como avisar o usuário
 * (ver UploadModal e AttachmentsPanel para os dois tratamentos amigáveis).
 */
export async function extractPdfAttachments(file: File | Blob): Promise<PdfAttachmentWithContent[]> {
  const fileName = file instanceof File ? file.name : 'blob';
  console.log(`[pdf-attachments] Iniciando detecção de anexos em "${fileName}" (${file.size} bytes)`);
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;

  const rawAttachments: Record<string, { filename: string; content: Uint8Array }> | null =
    await pdf.getAttachments();

  if (!rawAttachments || Object.keys(rawAttachments).length === 0) {
    console.log(`[pdf-attachments] "${fileName}": nenhum anexo encontrado.`);
    await pdf.cleanup();
    return [];
  }

  const entries = Object.values(rawAttachments);
  console.log(`[pdf-attachments] "${fileName}": ${entries.length} anexo(s) encontrado(s) ->`, entries.map(a => a.filename));

  const dates = await extractAttachmentDates(arrayBuffer.slice(0));
  await pdf.cleanup();

  return entries.map((attachment) => {
    const name = attachment.filename || 'arquivo_sem_nome';
    return {
      name,
      mimeType: inferMimeType(name),
      size: attachment.content?.byteLength ?? 0,
      date: dates.get(stripPath(name)) ?? null,
      content: attachment.content,
    };
  });
}

/** Extrai apenas os metadados (sem o conteúdo binário) — usado para salvar no Firestore. */
export async function extractPdfAttachmentsMeta(file: File): Promise<PdfAttachmentMeta[]> {
  const attachments = await extractPdfAttachments(file);
  return attachments.map(({ content, ...meta }) => meta);
}
