export interface OptimizeResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
}

export async function optimizePdf(file: File): Promise<OptimizeResult> {
  const originalSize = file.size;

  try {
    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true, updateMetadata: false });

    pdfDoc.setProducer('');
    pdfDoc.setCreator('');

    const optimizedBytes = await pdfDoc.save({ useObjectStreams: true });

    if (optimizedBytes.byteLength >= originalSize) {
      return { file, originalSize, optimizedSize: originalSize };
    }

    const optimizedFile = new File([optimizedBytes], file.name, { type: 'application/pdf' });
    return { file: optimizedFile, originalSize, optimizedSize: optimizedBytes.byteLength };
  } catch (err) {
    console.warn('Falha ao otimizar o PDF, enviando arquivo original:', err);
    return { file, originalSize, optimizedSize: originalSize };
  }
}
