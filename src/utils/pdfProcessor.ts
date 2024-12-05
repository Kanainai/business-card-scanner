import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Use a specific version of PDF.js worker that's compatible with our setup
GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfLib: typeof import('pdfjs-dist');

async function loadPdfLib() {
  if (!pdfLib) {
    pdfLib = await import('pdfjs-dist');
  }
  return pdfLib;
}

export async function extractImagesFromPDF(file: File): Promise<string[]> {
  let pdf: PDFDocumentProxy | null = null;
  try {
    await loadPdfLib();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: arrayBuffer });
    pdf = await loadingTask.promise;
    const images: string[] = [];

    console.log(`Processing PDF with ${pdf.numPages} pages`);

    // Process pages sequentially to avoid memory issues
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const imageUrl = canvas.toDataURL('image/png');
      console.log(`Successfully extracted image from page ${i}`);
      images.push(imageUrl);
    }

    console.log(`Total images extracted: ${images.length}`);
    return images;
  } catch (error) {
    console.error('Error extracting images from PDF:', error);
    throw error;
  } finally {
    if (pdf) {
      try {
        await pdf.destroy();
      } catch (e) {
        console.error('Error cleaning up PDF:', e);
      }
    }
  }
}

export async function performOCR(imageUrl: string): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  try {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data: { text } } = await worker.recognize(imageUrl);
    await worker.terminate();
    
    return text;
  } catch (error) {
    console.error('Error performing OCR:', error);
    throw error;
  }
}