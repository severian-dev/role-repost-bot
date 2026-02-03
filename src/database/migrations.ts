import { getDatabase } from './connection.js';

export function runMigrations(): void {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS repost_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      trigger_role_id TEXT NOT NULL,
      destination_channel_id TEXT NOT NULL,
      confirm_reaction TEXT DEFAULT '✅',
      embed_color TEXT DEFAULT '#5865F2',
      include_jump_link INTEGER DEFAULT 1,
      strip_role_mention INTEGER DEFAULT 1,
      cooldown_seconds INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(guild_id, trigger_role_id)
    );

    CREATE TABLE IF NOT EXISTS ignored_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER NOT NULL REFERENCES repost_rules(id) ON DELETE CASCADE,
      channel_id TEXT NOT NULL,
      UNIQUE(rule_id, channel_id)
    );

    CREATE TABLE IF NOT EXISTS cooldowns (
      user_id TEXT NOT NULL,
      rule_id INTEGER NOT NULL REFERENCES repost_rules(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      PRIMARY KEY (user_id, rule_id)
    );

    CREATE INDEX IF NOT EXISTS idx_repost_rules_guild ON repost_rules(guild_id);
    CREATE INDEX IF NOT EXISTS idx_ignored_channels_rule ON ignored_channels(rule_id);
    CREATE INDEX IF NOT EXISTS idx_cooldowns_expires ON cooldowns(expires_at);
  `);

  console.log('Database migrations complete');
}
