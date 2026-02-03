import { ChannelType, type Client, type Message, type TextChannel, type NewsChannel } from 'discord.js';
import { ruleRepo, ignoredChannelRepo } from '../database/index.js';
import { repostMessage, addReaction } from '../services/repostService.js';
import { isOnCooldown, setCooldown } from '../services/cooldownService.js';

export function registerMessageCreateEvent(client: Client): void {
  client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.mentions.roles.size) return;

    const rules = ruleRepo.getRulesByGuild(message.guild.id);
    if (rules.length === 0) return;

    for (const rule of rules) {
      if (!message.mentions.roles.has(rule.triggerRoleId)) {
        continue;
      }

      if (ignoredChannelRepo.isChannelIgnored(rule.id, message.channelId)) {
        continue;
      }

      if (isOnCooldown(message.author.id, rule)) {
        continue;
      }

      const destChannel = await client.channels.fetch(rule.destinationChannelId).catch(() => null);
      if (!destChannel) {
        console.error(`Destination channel ${rule.destinationChannelId} not found for rule ${rule.id}`);
        continue;
      }

      if (destChannel.type !== ChannelType.GuildText && destChannel.type !== ChannelType.GuildAnnouncement) {
        console.error(`Destination channel ${rule.destinationChannelId} is not a text channel`);
        continue;
      }

      const result = await repostMessage(message, rule, destChannel as TextChannel | NewsChannel);

      if (result.success) {
        console.log(
          `Reposted message ${message.id} from #${(message.channel as TextChannel).name} to #${destChannel.name}`
        );

        if (rule.confirmReaction) {
          await addReaction(message, rule.confirmReaction);
        }

        setCooldown(message.author.id, rule);
      }
    }
  });
}
