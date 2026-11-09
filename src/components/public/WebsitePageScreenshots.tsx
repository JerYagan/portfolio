'use client';

import { useRef, useState } from 'react';
import type { PublicGalleryImage } from '@/lib/data/portfolio';

type Device = NonNullable<PublicGalleryImage['device_label']>;

export function WebsitePageScreenshots({ images }: { images: PublicGalleryImage[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  if (images.length === 0) return null;

  const activeImage = activeIndex === null ? null : images[activeIndex] ?? null;

  function openScreenshot(index: number) {
    setActiveIndex(index);
    dialogRef.current?.showModal();
  }

  function closeScreenshot() {
    dialogRef.current?.close();
    setActiveIndex(null);
  }

  function stepScreenshot(direction: -1 | 1) {
    if (activeIndex === null || images.length < 2) return;
    setActiveIndex((activeIndex + direction + images.length) % images.length);
    const scrollContainer = dialogRef.current?.querySelector('.website-screenshot-viewer__scroll');
    scrollContainer?.scrollTo({ top: 0 });
  }

  return (
    <>
      <div className="website-screenshot-grid">
        {images.map((image, index) => (
          <button className="website-screenshot-card" key={`${image.url}-${index}`} onClick={() => openScreenshot(index)} type="button">
            <span className="website-screenshot-card__preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" loading="lazy" src={image.url} />
              <span className="website-screenshot-card__open">View full page ↗</span>
            </span>
            <span className="website-screenshot-card__meta">
              <span>{image.page_name}</span>
              <span>{formatDevice(image.device_label)}</span>
            </span>
            <span className="visually-hidden">Open the full-page image for {image.page_name}, {formatDevice(image.device_label)}</span>
          </button>
        ))}
      </div>

      <dialog
        aria-label={activeImage ? `${activeImage.page_name} full-page screenshot` : 'Website page screenshot viewer'}
        className="website-screenshot-viewer"
        onClick={(event) => {
          const target = event.target;
          if (target instanceof Element && target.closest('.website-screenshot-viewer__toolbar, .website-screenshot-viewer__image')) return;
          closeScreenshot();
        }}
        onClose={() => setActiveIndex(null)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') stepScreenshot(1);
          if (event.key === 'ArrowLeft') stepScreenshot(-1);
        }}
        ref={dialogRef}
      >
        {activeImage ? <>
          <div className="website-screenshot-viewer__toolbar">
            <p><span>{activeImage.page_name}</span><span>{formatDevice(activeImage.device_label)}</span><span>{(activeIndex ?? 0) + 1} / {images.length}</span></p>
            <div>
              {images.length > 1 ? <>
                <button aria-label="Previous screenshot" className="website-screenshot-viewer__step" onClick={() => stepScreenshot(-1)} type="button">←</button>
                <button aria-label="Next screenshot" className="website-screenshot-viewer__step" onClick={() => stepScreenshot(1)} type="button">→</button>
              </> : null}
              <button aria-label="Close screenshot viewer" className="website-screenshot-viewer__close" onClick={closeScreenshot} type="button">×</button>
            </div>
          </div>
          <div aria-label={`${activeImage.page_name} page screenshot. Scroll vertically to view the full page.`} className="website-screenshot-viewer__scroll" role="region" tabIndex={0}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={activeImage.alt} className="website-screenshot-viewer__image" src={activeImage.url} />
          </div>
        </> : null}
      </dialog>
    </>
  );
}

function formatDevice(device: Device | null) {
  if (device === 'desktop') return 'Desktop';
  if (device === 'tablet') return 'Tablet';
  return device === 'mobile' ? 'Mobile' : 'Device unspecified';
}
