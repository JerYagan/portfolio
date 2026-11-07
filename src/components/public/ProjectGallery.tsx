'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PublicGalleryImage } from '@/lib/data/portfolio';

type GalleryLayout = { column: number; row: number; span: number };

export function ProjectGallery({ images }: { images: PublicGalleryImage[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState<PublicGalleryImage | null>(null);
  const [imageRatios, setImageRatios] = useState<Record<number, number>>({});
  const [gallerySize, setGallerySize] = useState({ width: 1200, columns: 4, gap: 24 });

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    const updateLayout = () => {
      const width = gallery.getBoundingClientRect().width;
      const viewportWidth = window.innerWidth;
      const columns = viewportWidth <= 380 ? 1 : viewportWidth <= 620 ? 2 : viewportWidth <= 980 ? 3 : 4;
      const gap = Math.max(14, Math.min(28, viewportWidth * 0.02));
      setGallerySize((current) => current.width === width && current.columns === columns && current.gap === gap
        ? current
        : { width, columns, gap });
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

  const columns = Math.max(1, Math.min(gallerySize.columns, images.length));
  const layout: GalleryLayout[] = [];
  const columnEnds = Array.from({ length: columns }, () => 0);
  const columnWidth = Math.max(1, (gallerySize.width - gallerySize.gap * (columns - 1)) / columns);
  const rowSize = 8;

  images.forEach((image, index) => {
    const column = columnEnds.indexOf(Math.min(...columnEnds));
    const ratio = imageRatios[index] ?? 0.8;
    const captionHeight = image.caption ? 30 : 0;
    const estimatedHeight = columnWidth * ratio + captionHeight + 2;
    const rowGap = 16;
    const span = Math.max(1, Math.ceil((estimatedHeight + rowGap) / (rowSize + rowGap)));
    const row = columnEnds[column];
    layout.push({ column, row, span });
    columnEnds[column] = row + span;
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
      <div className="project-masonry" ref={galleryRef} style={{ '--masonry-columns': columns } as CSSProperties}>
        {images.map((image, index) => (
          <figure key={`${image.url}-${index}`} style={{ gridColumn: layout[index].column + 1, gridRow: `${layout[index].row + 1} / span ${layout[index].span}` }}>
            <button
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
            </button>
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ))}
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
