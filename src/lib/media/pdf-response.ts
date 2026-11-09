export async function streamPdfResponse(request: Request, signedUrl: string, cacheControl: string) {
  const range = request.headers.get('range');
  const upstream = await fetch(signedUrl, {
    cache: 'no-store',
    headers: range && /^bytes=\d*-\d*$/.test(range) ? { range } : undefined,
    signal: AbortSignal.timeout(120_000),
  });
  if (!upstream.ok && upstream.status !== 206) {
    await upstream.body?.cancel();
    return new Response('The PDF could not be loaded.', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }

  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'inline; filename="presentation.pdf"',
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
    'Vary': 'Range',
  });
  for (const header of ['content-length', 'content-range', 'etag', 'last-modified']) {
    const value = upstream.headers.get(header);
    if (value) headers.set(header, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
