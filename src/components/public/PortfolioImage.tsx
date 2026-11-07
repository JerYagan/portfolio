import type { PublicImage } from '@/lib/data/portfolio';

export function PortfolioImage({
  image,
  className = '',
  eager = false,
}: {
  image: PublicImage | null;
  className?: string;
  eager?: boolean;
}) {
  if (!image) {
    return (
      <div aria-hidden="true" className={`image-placeholder ${className}`.trim()}>
        <span>Image to come</span>
      </div>
    );
  }

  return (
    <img
      alt={image.alt}
      className={className}
      decoding="async"
      height={900}
      loading={eager ? 'eager' : 'lazy'}
      src={image.url}
      width={1440}
    />
  );
}
