let workerConfigured = false;

export async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  if (!workerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    workerConfigured = true;
  }
  return pdfjsLib;
}
