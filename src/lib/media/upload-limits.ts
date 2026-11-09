export const MAX_PORTFOLIO_MEDIA_BYTES = 15 * 1024 * 1024;

export const PORTFOLIO_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export const PORTFOLIO_MEDIA_MIME_TYPES = [...PORTFOLIO_IMAGE_MIME_TYPES, 'application/pdf'] as const;

export type PortfolioImageMimeType = typeof PORTFOLIO_IMAGE_MIME_TYPES[number];
export type PortfolioMediaMimeType = typeof PORTFOLIO_MEDIA_MIME_TYPES[number];

export const PORTFOLIO_IMAGE_EXTENSIONS: Record<PortfolioImageMimeType, 'jpg' | 'png' | 'webp' | 'avif'> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export const PORTFOLIO_MEDIA_EXTENSIONS: Record<PortfolioMediaMimeType, 'jpg' | 'png' | 'webp' | 'avif' | 'pdf'> = {
  ...PORTFOLIO_IMAGE_EXTENSIONS,
  'application/pdf': 'pdf',
};
