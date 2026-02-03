export interface RepostRule {
  id: number;
  guildId: string;
  triggerRoleId: string;
  destinationChannelId: string;
  confirmReaction: string | null;
  embedColor: string;
  includeJumpLink: boolean;
  stripRoleMention: boolean;
  cooldownSeconds: number;
  createdAt: string;
}

export interface IgnoredChannel {
  id: number;
  ruleId: number;
  channelId: string;
}

export interface Cooldown {
  userId: string;
  ruleId: number;
  expiresAt: string;
}
