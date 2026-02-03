import { z } from 'zod';
import { join } from 'path';

const defaultDbPath = join(process.cwd(), 'repost.db');

export const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  CLIENT_ID: z.string().min(1, 'CLIENT_ID is required'),
  GUILD_ID: z.string().optional(),
  DATABASE_PATH: z.string().transform((val) => val || defaultDbPath).default(defaultDbPath),
});

export type EnvConfig = z.infer<typeof envSchema>;
