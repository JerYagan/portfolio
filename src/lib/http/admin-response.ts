import { NextResponse } from 'next/server';

export const adminHeaders = { 'Cache-Control': 'no-store' };

export function adminJson(data: unknown, status = 200, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status, headers: adminHeaders });
}

export function adminError(code: string, message: string, status: number, fields?: Record<string, string>) {
  return NextResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status, headers: adminHeaders },
  );
}

export function adminFailure() {
  return adminError('INTERNAL_ERROR', 'The request could not be completed.', 500);
}

export function databaseErrorResponse(error: { code?: string; constraint?: string } | null) {
  if (error?.code === '23505') return adminError('SLUG_TAKEN', 'That name or slug is already in use.', 409);
  if (error?.code === '23503') return adminError('CATEGORY_IN_USE', 'This category is still assigned to entries.', 409);
  return adminFailure();
}

export function entryDatabaseErrorResponse(error: { code?: string; constraint?: string } | null) {
  if (error?.code === '23505') return adminError('SLUG_TAKEN', 'An entry with that slug already exists.', 409);
  if (error?.code === '23503') return adminError('VALIDATION_ERROR', 'Choose an existing category or valid related record.', 400);
  if (error?.code === '23514' || error?.code === '22P02') return adminError('VALIDATION_ERROR', 'Check the submitted entry values.', 400);
  return adminFailure();
}
