export const publicCacheHeaders = {
  'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=3600',
};

export const privateNoStoreHeaders = { 'Cache-Control': 'no-store' };

export function apiError(code: string, message: string, status: number, noStore = false) {
  return Response.json(
    { error: { code, message } },
    { status, headers: noStore ? privateNoStoreHeaders : publicCacheHeaders },
  );
}

export function apiFailure() {
  return apiError('INTERNAL_ERROR', 'Portfolio data is temporarily unavailable.', 500, true);
}

export function mediaExpirationMeta(hasMedia: boolean) {
  return hasMedia
    ? { media_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
    : {};
}
