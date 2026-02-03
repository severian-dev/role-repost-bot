import { getDatabase } from '../connection.js';
import type { RepostRule } from '../../types/index.js';

interface RuleRow {
  id: number;
  guild_id: string;
  trigger_role_id: string;
  destination_channel_id: string;
  confirm_reaction: string | null;
  embed_color: string;
  include_jump_link: number;
  strip_role_mention: number;
  cooldown_seconds: number;
  created_at: string;
}

function rowToRule(row: RuleRow): RepostRule {
  return {
    id: row.id,
    guildId: row.guild_id,
    triggerRoleId: row.trigger_role_id,
    destinationChannelId: row.destination_channel_id,
    confirmReaction: row.confirm_reaction,
    embedColor: row.embed_color,
    includeJumpLink: row.include_jump_link === 1,
    stripRoleMention: row.strip_role_mention === 1,
    cooldownSeconds: row.cooldown_seconds,
    createdAt: row.created_at,
  };
}

export interface CreateRuleParams {
  guildId: string;
  triggerRoleId: string;
  destinationChannelId: string;
  confirmReaction?: string | null;
  embedColor?: string;
  includeJumpLink?: boolean;
  stripRoleMention?: boolean;
  cooldownSeconds?: number;
}

export function createRule(params: CreateRuleParams): RepostRule {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO repost_rules (
      guild_id, trigger_role_id, destination_channel_id,
      confirm_reaction, embed_color, include_jump_link,
      strip_role_mention, cooldown_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    params.guildId,
    params.triggerRoleId,
    params.destinationChannelId,
    params.confirmReaction ?? '✅',
    params.embedColor ?? '#5865F2',
    params.includeJumpLink ?? true ? 1 : 0,
    params.stripRoleMention ?? true ? 1 : 0,
    params.cooldownSeconds ?? 0
  );

  return getRuleById(Number(result.lastInsertRowid))!;
}

export function getRuleById(id: number): RepostRule | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM repost_rules WHERE id = ?').get(id) as RuleRow | undefined;
  return row ? rowToRule(row) : null;
}

export function getRuleByGuildAndRole(guildId: string, triggerRoleId: string): RepostRule | null {
  const db = getDatabase();
  const row = db
    .prepare('SELECT * FROM repost_rules WHERE guild_id = ? AND trigger_role_id = ?')
    .get(guildId, triggerRoleId) as RuleRow | undefined;
  return row ? rowToRule(row) : null;
}

export function getRulesByGuild(guildId: string): RepostRule[] {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT * FROM repost_rules WHERE guild_id = ? ORDER BY created_at')
    .all(guildId) as RuleRow[];
  return rows.map(rowToRule);
}

export function updateRule(
  id: number,
  updates: Partial<Omit<CreateRuleParams, 'guildId' | 'triggerRoleId'>>
): RepostRule | null {
  const db = getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.destinationChannelId !== undefined) {
    fields.push('destination_channel_id = ?');
    values.push(updates.destinationChannelId);
  }
  if (updates.confirmReaction !== undefined) {
    fields.push('confirm_reaction = ?');
    values.push(updates.confirmReaction);
  }
  if (updates.embedColor !== undefined) {
    fields.push('embed_color = ?');
    values.push(updates.embedColor);
  }
  if (updates.includeJumpLink !== undefined) {
    fields.push('include_jump_link = ?');
    values.push(updates.includeJumpLink ? 1 : 0);
  }
  if (updates.stripRoleMention !== undefined) {
    fields.push('strip_role_mention = ?');
    values.push(updates.stripRoleMention ? 1 : 0);
  }
  if (updates.cooldownSeconds !== undefined) {
    fields.push('cooldown_seconds = ?');
    values.push(updates.cooldownSeconds);
  }

  if (fields.length === 0) {
    return getRuleById(id);
  }

  values.push(id);
  db.prepare(`UPDATE repost_rules SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return getRuleById(id);
}

export function deleteRule(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM repost_rules WHERE id = ?').run(id);
  return result.changes > 0;
}

export function deleteRuleByGuildAndRole(guildId: string, triggerRoleId: string): boolean {
  const db = getDatabase();
  const result = db
    .prepare('DELETE FROM repost_rules WHERE guild_id = ? AND trigger_role_id = ?')
    .run(guildId, triggerRoleId);
  return result.changes > 0;
}
