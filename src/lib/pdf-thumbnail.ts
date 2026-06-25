import { loadPdfJs } from './pdfjs-loader';

export async function generatePdfThumbnail(file: File): Promise<Blob | null> {
  try {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.2 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (!context) return null;

    await page.render({ canvas, canvasContext: context, viewport }).promise;

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.82);
    });
  } catch (err) {
    console.warn('Falha ao gerar preview do PDF:', err);
    return null;
  }
}
