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

export function isMissingMediaRoleColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const details = error as { code?: unknown; message?: unknown };
  const message = typeof details.message === 'string' ? details.message : '';
  return (details.code === '42703' && /media_role/i.test(message))
    || (details.code === 'PGRST204' && message.includes('media_role'));
}

export function isMissingCaseStudySectionsColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const details = error as { code?: unknown; message?: unknown };
  const message = typeof details.message === 'string' ? details.message : '';
  return (details.code === '42703' && /case_study_sections/i.test(message))
    || (details.code === 'PGRST204' && message.includes('case_study_sections'));
}

export function isMissingProjectStatusColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const details = error as { code?: unknown; message?: unknown };
  const message = typeof details.message === 'string' ? details.message : '';
  return (details.code === '42703' && /project_status/i.test(message))
    || (details.code === 'PGRST204' && message.includes('project_status'));
}

export function isMissingWebsitePageMediaColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const details = error as { code?: unknown; message?: unknown };
  const message = typeof details.message === 'string' ? details.message : '';
  return (details.code === '42703' && /(page_name|device_label)/i.test(message))
    || (details.code === 'PGRST204' && /(page_name|device_label)/i.test(message));
}
