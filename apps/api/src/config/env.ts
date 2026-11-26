import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET minimal 16 karakter'),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Environment variable tidak valid:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

/**
 * `true` = izinkan semua origin (praktis untuk development lokal).
 * Daftar string (dipisah koma) = whitelist origin untuk production.
 */
export const corsOrigins: true | string[] = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : true;

if (!env.CORS_ORIGIN) {
  console.warn(
    'CORS_ORIGIN tidak diisi — CORS dibuka untuk semua origin (hanya untuk development).',
  );
}
