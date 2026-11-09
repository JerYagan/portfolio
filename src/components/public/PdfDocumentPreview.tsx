'use client';

import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PublicGalleryImage } from '@/lib/data/portfolio';

let pdfJsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

function loadPdfJs() {
  pdfJsPromise ??= import('pdfjs-dist').then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    return pdfjs;
  });
  return pdfJsPromise;
}

function usePdfDocument(url: string) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: import('pdfjs-dist').PDFDocumentLoadingTask | null = null;
    setDocument(null);
    setError(false);

    void (async () => {
      try {
        const pdfjs = await loadPdfJs();
        if (cancelled) return;
        loadingTask = pdfjs.getDocument({ url });
        const loaded = await loadingTask.promise;
        if (cancelled) {
          await loadingTask.destroy();
          return;
        }
        setDocument(loaded);
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (loadingTask) void loadingTask.destroy();
    };
  }, [url]);

  return { document, error };
}

function PdfPageCanvas({ document, pageNumber }: { document: PDFDocumentProxy; pageNumber: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(() => setWidth(wrapper.clientWidth));
    observer.observe(wrapper);
    setWidth(wrapper.clientWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width < 1) return;
    let cancelled = false;
    let renderTask: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | null = null;

    void (async () => {
      try {
        const page = await document.getPage(pageNumber);
        if (cancelled) return;
        const initialViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(width / initialViewport.width, 1.75);
        const viewport = page.getViewport({ scale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        renderTask = page.render({
          canvas,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
          background: '#ffffff',
        });
        await renderTask.promise;
      } catch {
        // The dialog-level error state is reserved for document loading failures.
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber, width]);

  return <div className="pdf-page-canvas" ref={wrapperRef}><canvas ref={canvasRef} /></div>;
}

export function PdfDocumentPreview({ image, compact = false }: { image: PublicGalleryImage; compact?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { document, error } = usePdfDocument(image.url);

  function openPreview() {
    setIsOpen(true);
    dialogRef.current?.showModal();
  }

  function closePreview() {
    dialogRef.current?.close();
    setIsOpen(false);
  }

  return <>
    <div className={`pdf-presentation-preview${compact ? ' pdf-presentation-preview--compact' : ''}`}>
      {document ? <PdfPageCanvas document={document} pageNumber={1} /> : <div className="pdf-presentation-preview__placeholder">{error ? 'PDF preview unavailable' : 'Loading PDF preview…'}</div>}
      <button aria-label={`Open PDF presentation: ${image.alt}`} className="pdf-presentation-preview__action" onClick={openPreview} type="button"><strong>PDF</strong><span>Open full presentation ↗</span></button>
    </div>
    <dialog
      aria-label={`PDF presentation: ${image.alt}`}
      className="pdf-presentation-viewer"
      onClick={(event) => {
        const target = event.target;
        if (!(target instanceof Element) || !target.closest('.pdf-page-canvas, .pdf-presentation-viewer__close')) closePreview();
      }}
      onClose={() => setIsOpen(false)}
      ref={dialogRef}
    >
      <button aria-label="Close PDF presentation" className="pdf-presentation-viewer__close" onClick={closePreview} type="button">×</button>
      {isOpen ? <div aria-live="polite" className="pdf-document-scroll">
        {error ? <p className="pdf-document-message">This PDF could not be displayed. Please try again later.</p>
          : !document ? <p className="pdf-document-message">Loading presentation…</p>
            : <div className="pdf-document-pages">{Array.from({ length: document.numPages }, (_, index) => <PdfPageCanvas document={document} key={index + 1} pageNumber={index + 1} />)}</div>}
      </div> : null}
    </dialog>
  </>;
}

export function PdfDocumentPages({ image }: { image: PublicGalleryImage }) {
  const { document, error } = usePdfDocument(image.url);

  if (error) return <p className="pdf-document-message pdf-document-message--inline">This PDF could not be displayed.</p>;
  if (!document) return <p className="pdf-document-message pdf-document-message--inline">Loading presentation…</p>;

  return <div className="pdf-document-full-pages" aria-label={image.alt}>
    {Array.from({ length: document.numPages }, (_, index) => <PdfPageCanvas document={document} key={index + 1} pageNumber={index + 1} />)}
  </div>;
}
