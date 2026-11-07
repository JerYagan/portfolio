import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const publicSlugSchema = z.string().min(1).max(100).regex(slugPattern);

export const publicEntriesQuerySchema = z
  .object({
    category: z.string().min(1).max(60).regex(slugPattern).optional(),
    featured: z.enum(['true', 'false']).optional(),
    q: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12),
  })
  .strict();

export type PublicEntriesQuery = z.infer<typeof publicEntriesQuerySchema>;
