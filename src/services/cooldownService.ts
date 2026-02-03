import { cooldownRepo } from '../database/index.js';
import type { RepostRule } from '../types/index.js';

export function isOnCooldown(userId: string, rule: RepostRule): boolean {
  if (rule.cooldownSeconds <= 0) {
    return false;
  }
  return cooldownRepo.isOnCooldown(userId, rule.id);
}

export function setCooldown(userId: string, rule: RepostRule): void {
  if (rule.cooldownSeconds <= 0) {
    return;
  }
  const expiresAt = new Date(Date.now() + rule.cooldownSeconds * 1000);
  cooldownRepo.setCooldown(userId, rule.id, expiresAt);
}

export function getCooldownRemaining(userId: string, rule: RepostRule): number {
  const expiry = cooldownRepo.getCooldownExpiry(userId, rule.id);
  if (!expiry) {
    return 0;
  }
  const remaining = expiry.getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}

export function clearCooldown(userId: string, rule: RepostRule): boolean {
  return cooldownRepo.clearCooldown(userId, rule.id);
}
