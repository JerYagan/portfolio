'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PublicGalleryImage } from '@/lib/data/portfolio';
import { PdfDocumentPreview } from '@/components/public/PdfDocumentPreview';

export function ProjectGallery({ images }: { images: PublicGalleryImage[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState<PublicGalleryImage | null>(null);
  const [layout, setLayout] = useState({ width: 0, columns: 4 });
  const [imageRatios, setImageRatios] = useState<Record<number, number>>({});

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    const updateLayout = () => {
      const width = gallery.getBoundingClientRect().width;
      const viewportWidth = window.innerWidth;
      const columns = viewportWidth <= 620 ? 2 : viewportWidth <= 760 ? 3 : 4;
      setLayout((current) => current.width === width && current.columns === columns ? current : { width, columns });
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(gallery);
    window.addEventListener('resize', updateLayout, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateLayout);
    };
  }, []);

  const columns = Array.from({ length: Math.min(layout.columns, Math.max(images.length, 1)) }, () => [] as Array<{ image: PublicGalleryImage; index: number }>);
  const columnHeights = columns.map(() => 0);
  const columnWidth = Math.max(1, (layout.width - 14 * (columns.length - 1)) / columns.length);

  images.forEach((image, index) => {
    const column = columnHeights.indexOf(Math.min(...columnHeights));
    columns[column].push({ image, index });
    const ratio = image.media_type === 'pdf' ? 0.84 : imageRatios[index] ?? 0.8;
    columnHeights[column] += columnWidth * ratio + (image.caption ? 24 : 0) + 14;
  });

  function openImage(image: PublicGalleryImage) {
    setActiveImage(image);
    dialogRef.current?.showModal();
  }

  function closeImage() {
    dialogRef.current?.close();
    setActiveImage(null);
  }

  return (
    <>
      <div className="project-masonry" ref={galleryRef} style={{ '--masonry-columns': columns.length } as CSSProperties}>
        {columns.map((column, columnIndex) => <div className="project-masonry__column" key={columnIndex}>
          {column.map(({ image, index }) => <figure key={`${image.url}-${index}`}>
            {image.media_type === 'pdf' ? <PdfDocumentPreview compact image={image} /> : <button
              aria-label={`Open image preview: ${image.alt}`}
              className="gallery-image-button"
              onClick={() => openImage(image)}
              type="button"
            >
              {/* Natural image dimensions are retained so the gallery never crops the artwork. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={image.alt}
                className="gallery-image"
                loading="lazy"
                onLoad={(event) => {
                  const loadedImage = event.currentTarget;
                  if (!loadedImage.naturalWidth || !loadedImage.naturalHeight) return;
                  const ratio = loadedImage.naturalHeight / loadedImage.naturalWidth;
                  setImageRatios((current) => current[index] === ratio ? current : { ...current, [index]: ratio });
                }}
                src={image.url}
              />
            </button>}
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>)}
        </div>)}
      </div>

      <dialog
        aria-label="Project image preview"
        className="gallery-lightbox"
        onClick={(event) => {
          const target = event.target;
          if (target instanceof Element && target.closest('.gallery-lightbox__image, .gallery-lightbox__close')) return;
          closeImage();
        }}
        onClose={() => setActiveImage(null)}
        ref={dialogRef}
      >
        <button aria-label="Close image preview" className="gallery-lightbox__close" onClick={closeImage} type="button">×</button>
        {activeImage ? (
          <div className="gallery-lightbox__content">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={activeImage.alt} className="gallery-lightbox__image" src={activeImage.url} />
          </div>
        ) : null}
      </dialog>
    </>
  );
}
