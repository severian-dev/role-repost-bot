import {
  EmbedBuilder,
  Message,
  TextChannel,
  NewsChannel,
  ChannelType,
  type ColorResolvable,
} from 'discord.js';
import type { RepostRule } from '../types/index.js';

export interface RepostResult {
  success: boolean;
  error?: string;
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

    const embed = new EmbedBuilder()
      .setAuthor({
        name: message.member?.displayName ?? message.author.displayName,
        iconURL: message.author.displayAvatarURL(),
      })
      .setColor(rule.embedColor as ColorResolvable)
      .setTimestamp(message.createdAt);

    if (content) {
      embed.setDescription(content);
    }

    if (message.channel.type === ChannelType.GuildText || message.channel.type === ChannelType.GuildAnnouncement) {
      embed.setFooter({ text: `Posted in #${message.channel.name}` });
    }

    if (rule.includeJumpLink) {
      embed.addFields({ name: '\u200b', value: `[Jump to message](${message.url})` });
    }

    const embeds = [embed];

    // Include any embeds from the original message (up to 9 more since we have 1)
    for (const originalEmbed of message.embeds.slice(0, 9)) {
      embeds.push(EmbedBuilder.from(originalEmbed));
    }

    const files = message.attachments.map((a) => a.url);

    await destinationChannel.send({ embeds, files });

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
