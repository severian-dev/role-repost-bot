import { getDatabase } from '../connection.js';

export function setCooldown(userId: string, ruleId: number, expiresAt: Date): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO cooldowns (user_id, rule_id, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT (user_id, rule_id) DO UPDATE SET expires_at = excluded.expires_at
  `).run(userId, ruleId, expiresAt.toISOString());
}

export function isOnCooldown(userId: string, ruleId: number): boolean {
  const db = getDatabase();
  const row = db
    .prepare('SELECT expires_at FROM cooldowns WHERE user_id = ? AND rule_id = ?')
    .get(userId, ruleId) as { expires_at: string } | undefined;

  if (!row) {
    return false;
  }

  const expiresAt = new Date(row.expires_at);
  if (expiresAt <= new Date()) {
    clearCooldown(userId, ruleId);
    return false;
  }

  return true;
}

export function getCooldownExpiry(userId: string, ruleId: number): Date | null {
  const db = getDatabase();
  const row = db
    .prepare('SELECT expires_at FROM cooldowns WHERE user_id = ? AND rule_id = ?')
    .get(userId, ruleId) as { expires_at: string } | undefined;

  if (!row) {
    return null;
  }

  const expiresAt = new Date(row.expires_at);
  if (expiresAt <= new Date()) {
    clearCooldown(userId, ruleId);
    return null;
  }

  return expiresAt;
}

export function clearCooldown(userId: string, ruleId: number): boolean {
  const db = getDatabase();
  const result = db
    .prepare('DELETE FROM cooldowns WHERE user_id = ? AND rule_id = ?')
    .run(userId, ruleId);
  return result.changes > 0;
}

export function cleanupExpiredCooldowns(): number {
  const db = getDatabase();
  const result = db
    .prepare('DELETE FROM cooldowns WHERE expires_at <= datetime(?)')
    .run(new Date().toISOString());
  return result.changes;
}
