import {
  EmbedBuilder,
  Message,
  TextChannel,
  NewsChannel,
  ChannelType,
  type ColorResolvable,
} from 'discord.js';
import type { RepostRule } from '../types/index.js';

const MAX_DESCRIPTION_LENGTH = 4096;
const DEFAULT_EMBED_COLOR = '#5865F2';

export interface RepostResult {
  success: boolean;
  error?: string;
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength - 3) + '...';
}

export async function repostMessage(
  message: Message,
  rule: RepostRule,
  destinationChannel: TextChannel | NewsChannel
): Promise<RepostResult> {
  try {
    let content = message.content;

    if (rule.stripRoleMention) {
      content = content.replace(new RegExp(`<@&${rule.triggerRoleId}>`, 'g'), '').trim();
    }

    // Use member's role color if rule uses default color, otherwise use rule color
    const isDefaultColor = rule.embedColor.toUpperCase() === DEFAULT_EMBED_COLOR;
    const memberColor = message.member?.displayColor;
    const embedColor: ColorResolvable =
      isDefaultColor && memberColor && memberColor !== 0
        ? memberColor
        : (rule.embedColor as ColorResolvable);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: message.member?.displayName ?? message.author.displayName,
        iconURL: message.author.displayAvatarURL(),
      })
      .setColor(embedColor)
      .setTimestamp(message.createdAt);

    // Add role icon as thumbnail if available
    const roleIcon = message.member?.roles.highest.iconURL();
    if (roleIcon) {
      embed.setThumbnail(roleIcon);
    }

    if (content) {
      embed.setDescription(truncateContent(content, MAX_DESCRIPTION_LENGTH));
    }

    // Build footer with channel name
    if (message.channel.type === ChannelType.GuildText || message.channel.type === ChannelType.GuildAnnouncement) {
      embed.setFooter({ text: `Posted in #${message.channel.name}` });
    }

    // Add jump link as a subtle field
    if (rule.includeJumpLink) {
      embed.addFields({ name: '\u200b', value: `[View original](${message.url})`, inline: true });
    }

    const files = message.attachments.map((a) => a.url);

    await destinationChannel.send({ embeds: [embed], files });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to repost message ${message.id}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function addReaction(message: Message, reaction: string): Promise<boolean> {
  try {
    await message.react(reaction);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to add reaction to message ${message.id}:`, errorMessage);
    return false;
  }
}
