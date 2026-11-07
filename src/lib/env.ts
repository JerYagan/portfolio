import { z } from 'zod';

const optionalValue = (value: unknown) => (value === '' ? undefined : value);

const environmentSchema = z
  .object({
    siteUrl: z.string().url().default('http://localhost:3000'),
    supabaseUrl: z.preprocess(optionalValue, z.string().url().optional()),
    supabasePublishableKey: z.preprocess(optionalValue, z.string().min(1).optional()),
  })
  .superRefine((value, context) => {
    if (Boolean(value.supabaseUrl) !== Boolean(value.supabasePublishableKey)) {
      context.addIssue({
        code: 'custom',
        path: ['supabasePublishableKey'],
        message: 'Set both Supabase variables, or leave both blank until Supabase is configured.',
      });
    }
  });

export const env = environmentSchema.parse({
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabasePublishableKey);

export function requireSupabaseEnvironment() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  return {
    url: env.supabaseUrl,
    publishableKey: env.supabasePublishableKey,
  };
}
