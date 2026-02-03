import { createClient } from './client.js';
import { env } from './config/env.js';
import { runMigrations, closeDatabase, cooldownRepo } from './database/index.js';
import { registerEvents } from './events/index.js';

const client = createClient();

runMigrations();
registerEvents(client);

// Cleanup expired cooldowns periodically
setInterval(() => {
  const cleaned = cooldownRepo.cleanupExpiredCooldowns();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired cooldown(s)`);
  }
}, 60 * 1000);

process.on('SIGINT', () => {
  console.log('Shutting down...');
  client.destroy();
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  client.destroy();
  closeDatabase();
  process.exit(0);
});

client.login(env.DISCORD_TOKEN);
