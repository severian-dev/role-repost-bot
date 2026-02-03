import { getDatabase } from '../connection.js';
import type { IgnoredChannel } from '../../types/index.js';

interface IgnoredChannelRow {
  id: number;
  rule_id: number;
  channel_id: string;
}

function rowToIgnoredChannel(row: IgnoredChannelRow): IgnoredChannel {
  return {
    id: row.id,
    ruleId: row.rule_id,
    channelId: row.channel_id,
  };
}

export function addIgnoredChannel(ruleId: number, channelId: string): IgnoredChannel {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO ignored_channels (rule_id, channel_id)
    VALUES (?, ?)
  `);

  const result = stmt.run(ruleId, channelId);

  return {
    id: Number(result.lastInsertRowid),
    ruleId,
    channelId,
  };
}

export function getIgnoredChannels(ruleId: number): IgnoredChannel[] {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT * FROM ignored_channels WHERE rule_id = ?')
    .all(ruleId) as IgnoredChannelRow[];
  return rows.map(rowToIgnoredChannel);
}

export function isChannelIgnored(ruleId: number, channelId: string): boolean {
  const db = getDatabase();
  const row = db
    .prepare('SELECT 1 FROM ignored_channels WHERE rule_id = ? AND channel_id = ?')
    .get(ruleId, channelId);
  return row !== undefined;
}

export function removeIgnoredChannel(ruleId: number, channelId: string): boolean {
  const db = getDatabase();
  const result = db
    .prepare('DELETE FROM ignored_channels WHERE rule_id = ? AND channel_id = ?')
    .run(ruleId, channelId);
  return result.changes > 0;
}

export function clearIgnoredChannels(ruleId: number): number {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM ignored_channels WHERE rule_id = ?').run(ruleId);
  return result.changes;
}
