import { z } from 'zod';

export const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  CLIENT_ID: z.string().min(1, 'CLIENT_ID is required'),
  GUILD_ID: z.string().optional(),
  DATABASE_PATH: z.string().default('./repost.db'),
});

export type EnvConfig = z.infer<typeof envSchema>;
