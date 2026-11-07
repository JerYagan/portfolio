export function isMissingCompletionDateColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const details = error as { code?: unknown; message?: unknown };
  const message = typeof details.message === 'string' ? details.message : '';
  return (details.code === '42703' && /completed_on/i.test(message))
    || (details.code === 'PGRST204' && message.includes('completed_on'));
}

export function isMissingPresentationColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const details = error as { code?: unknown; message?: unknown };
  const message = typeof details.message === 'string' ? details.message : '';
  return (details.code === '42703' && /presentation/i.test(message))
    || (details.code === 'PGRST204' && message.includes('presentation'));
}
