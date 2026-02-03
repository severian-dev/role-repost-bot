import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  type ChatInputCommandInteraction,
  type Role,
  type TextChannel,
  type NewsChannel,
} from 'discord.js';
import { ruleRepo, ignoredChannelRepo } from '../database/index.js';

export const data = new SlashCommandBuilder()
  .setName('repost')
  .setDescription('Manage role repost rules')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommandGroup((group) =>
    group
      .setName('rule')
      .setDescription('Manage repost rules')
      .addSubcommand((sub) =>
        sub
          .setName('add')
          .setDescription('Add a new repost rule')
          .addRoleOption((opt) =>
            opt.setName('role').setDescription('Role that triggers the repost').setRequired(true)
          )
          .addChannelOption((opt) =>
            opt
              .setName('channel')
              .setDescription('Channel to repost to')
              .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
              .setRequired(true)
          )
          .addStringOption((opt) =>
            opt
              .setName('color')
              .setDescription('Embed color (hex, e.g., #5865F2)')
              .setRequired(false)
          )
          .addStringOption((opt) =>
            opt
              .setName('reaction')
              .setDescription('Confirmation reaction emoji (empty to disable)')
              .setRequired(false)
          )
          .addIntegerOption((opt) =>
            opt
              .setName('cooldown')
              .setDescription('Cooldown in seconds between reposts per user')
              .setMinValue(0)
              .setMaxValue(86400)
              .setRequired(false)
          )
          .addBooleanOption((opt) =>
            opt
              .setName('jump_link')
              .setDescription('Include jump link to original message')
              .setRequired(false)
          )
          .addBooleanOption((opt) =>
            opt
              .setName('strip_mention')
              .setDescription('Remove the role mention from reposted content')
              .setRequired(false)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('remove')
          .setDescription('Remove a repost rule')
          .addRoleOption((opt) =>
            opt.setName('role').setDescription('Role to remove the rule for').setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub.setName('list').setDescription('List all repost rules in this server')
      )
      .addSubcommand((sub) =>
        sub
          .setName('info')
          .setDescription('Get detailed info about a rule')
          .addRoleOption((opt) =>
            opt.setName('role').setDescription('Role to get info for').setRequired(true)
          )
      )
  )
  .addSubcommandGroup((group) =>
    group
      .setName('ignore')
      .setDescription('Manage ignored channels for rules')
      .addSubcommand((sub) =>
        sub
          .setName('add')
          .setDescription('Add a channel to ignore for a rule')
          .addRoleOption((opt) =>
            opt.setName('role').setDescription('Role the rule is for').setRequired(true)
          )
          .addChannelOption((opt) =>
            opt
              .setName('channel')
              .setDescription('Channel to ignore')
              .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('remove')
          .setDescription('Remove a channel from ignored list')
          .addRoleOption((opt) =>
            opt.setName('role').setDescription('Role the rule is for').setRequired(true)
          )
          .addChannelOption((opt) =>
            opt
              .setName('channel')
              .setDescription('Channel to stop ignoring')
              .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('list')
          .setDescription('List ignored channels for a rule')
          .addRoleOption((opt) =>
            opt.setName('role').setDescription('Role to list ignored channels for').setRequired(true)
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('test')
      .setDescription('Test a repost rule by sending a sample embed')
      .addRoleOption((opt) =>
        opt.setName('role').setDescription('Role to test the rule for').setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  if (subcommandGroup === 'rule') {
    switch (subcommand) {
      case 'add':
        await handleRuleAdd(interaction);
        break;
      case 'remove':
        await handleRuleRemove(interaction);
        break;
      case 'list':
        await handleRuleList(interaction);
        break;
      case 'info':
        await handleRuleInfo(interaction);
        break;
    }
  } else if (subcommandGroup === 'ignore') {
    switch (subcommand) {
      case 'add':
        await handleIgnoreAdd(interaction);
        break;
      case 'remove':
        await handleIgnoreRemove(interaction);
        break;
      case 'list':
        await handleIgnoreList(interaction);
        break;
    }
  } else if (subcommand === 'test') {
    await handleTest(interaction);
  }
}

async function handleRuleAdd(interaction: ChatInputCommandInteraction): Promise<void> {
  const role = interaction.options.getRole('role', true) as Role;
  const channel = interaction.options.getChannel('channel', true) as TextChannel | NewsChannel;
  const color = interaction.options.getString('color') ?? '#5865F2';
  const reaction = interaction.options.getString('reaction');
  const cooldown = interaction.options.getInteger('cooldown') ?? 0;
  const jumpLink = interaction.options.getBoolean('jump_link') ?? true;
  const stripMention = interaction.options.getBoolean('strip_mention') ?? true;

  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    await interaction.reply({
      content: 'Invalid color format. Use hex format like `#5865F2`.',
      ephemeral: true,
    });
    return;
  }

  const existing = ruleRepo.getRuleByGuildAndRole(interaction.guildId!, role.id);
  if (existing) {
    await interaction.reply({
      content: `A rule for ${role} already exists. Remove it first with \`/repost rule remove\`.`,
      ephemeral: true,
    });
    return;
  }

  try {
    const rule = ruleRepo.createRule({
      guildId: interaction.guildId!,
      triggerRoleId: role.id,
      destinationChannelId: channel.id,
      confirmReaction: reaction === '' ? null : (reaction ?? '✅'),
      embedColor: color,
      includeJumpLink: jumpLink,
      stripRoleMention: stripMention,
      cooldownSeconds: cooldown,
    });

    await interaction.reply({
      content: `Created repost rule: Messages mentioning ${role} will be reposted to ${channel}.`,
      ephemeral: true,
    });

    console.log(`Rule ${rule.id} created: ${role.name} -> #${channel.name} in ${interaction.guild!.name}`);
  } catch (error) {
    console.error('Failed to create rule:', error);
    await interaction.reply({
      content: 'Failed to create the rule. Please try again.',
      ephemeral: true,
    });
  }
}

async function handleRuleRemove(interaction: ChatInputCommandInteraction): Promise<void> {
  const role = interaction.options.getRole('role', true) as Role;

  const deleted = ruleRepo.deleteRuleByGuildAndRole(interaction.guildId!, role.id);

  if (deleted) {
    await interaction.reply({
      content: `Removed repost rule for ${role}.`,
      ephemeral: true,
    });
    console.log(`Rule for ${role.name} removed in ${interaction.guild!.name}`);
  } else {
    await interaction.reply({
      content: `No rule found for ${role}.`,
      ephemeral: true,
    });
  }
}

async function handleRuleList(interaction: ChatInputCommandInteraction): Promise<void> {
  const rules = ruleRepo.getRulesByGuild(interaction.guildId!);

  if (rules.length === 0) {
    await interaction.reply({
      content: 'No repost rules configured for this server.',
      ephemeral: true,
    });
    return;
  }

  const lines = await Promise.all(
    rules.map(async (rule) => {
      const role = await interaction.guild!.roles.fetch(rule.triggerRoleId).catch(() => null);
      const channel = await interaction.client.channels.fetch(rule.destinationChannelId).catch(() => null);

      const roleName = role ? `<@&${role.id}>` : `\`${rule.triggerRoleId}\` (deleted)`;
      const channelName = channel ? `<#${channel.id}>` : `\`${rule.destinationChannelId}\` (deleted)`;

      return `• ${roleName} → ${channelName}`;
    })
  );

  await interaction.reply({
    content: `**Repost Rules (${rules.length})**\n${lines.join('\n')}`,
    ephemeral: true,
  });
}

async function handleRuleInfo(interaction: ChatInputCommandInteraction): Promise<void> {
  const role = interaction.options.getRole('role', true) as Role;

  const rule = ruleRepo.getRuleByGuildAndRole(interaction.guildId!, role.id);

  if (!rule) {
    await interaction.reply({
      content: `No rule found for ${role}.`,
      ephemeral: true,
    });
    return;
  }

  const channel = await interaction.client.channels.fetch(rule.destinationChannelId).catch(() => null);
  const channelName = channel ? `<#${channel.id}>` : `\`${rule.destinationChannelId}\` (deleted)`;

  const ignoredChannels = ignoredChannelRepo.getIgnoredChannels(rule.id);
  const ignoredList =
    ignoredChannels.length > 0
      ? ignoredChannels.map((ic) => `<#${ic.channelId}>`).join(', ')
      : 'None';

  const info = [
    `**Rule for ${role}**`,
    ``,
    `**Destination:** ${channelName}`,
    `**Embed Color:** \`${rule.embedColor}\``,
    `**Reaction:** ${rule.confirmReaction ?? 'Disabled'}`,
    `**Cooldown:** ${rule.cooldownSeconds > 0 ? `${rule.cooldownSeconds}s` : 'None'}`,
    `**Jump Link:** ${rule.includeJumpLink ? 'Yes' : 'No'}`,
    `**Strip Mention:** ${rule.stripRoleMention ? 'Yes' : 'No'}`,
    `**Ignored Channels:** ${ignoredList}`,
    `**Created:** <t:${Math.floor(new Date(rule.createdAt).getTime() / 1000)}:R>`,
  ];

  await interaction.reply({
    content: info.join('\n'),
    ephemeral: true,
  });
}

async function handleIgnoreAdd(interaction: ChatInputCommandInteraction): Promise<void> {
  const role = interaction.options.getRole('role', true) as Role;
  const channel = interaction.options.getChannel('channel', true) as TextChannel | NewsChannel;

  const rule = ruleRepo.getRuleByGuildAndRole(interaction.guildId!, role.id);

  if (!rule) {
    await interaction.reply({
      content: `No rule found for ${role}. Create one first with \`/repost rule add\`.`,
      ephemeral: true,
    });
    return;
  }

  if (ignoredChannelRepo.isChannelIgnored(rule.id, channel.id)) {
    await interaction.reply({
      content: `${channel} is already ignored for this rule.`,
      ephemeral: true,
    });
    return;
  }

  try {
    ignoredChannelRepo.addIgnoredChannel(rule.id, channel.id);
    await interaction.reply({
      content: `Messages in ${channel} mentioning ${role} will no longer be reposted.`,
      ephemeral: true,
    });
  } catch (error) {
    console.error('Failed to add ignored channel:', error);
    await interaction.reply({
      content: 'Failed to add the ignored channel. Please try again.',
      ephemeral: true,
    });
  }
}

async function handleIgnoreRemove(interaction: ChatInputCommandInteraction): Promise<void> {
  const role = interaction.options.getRole('role', true) as Role;
  const channel = interaction.options.getChannel('channel', true) as TextChannel | NewsChannel;

  const rule = ruleRepo.getRuleByGuildAndRole(interaction.guildId!, role.id);

  if (!rule) {
    await interaction.reply({
      content: `No rule found for ${role}.`,
      ephemeral: true,
    });
    return;
  }

  const removed = ignoredChannelRepo.removeIgnoredChannel(rule.id, channel.id);

  if (removed) {
    await interaction.reply({
      content: `${channel} is no longer ignored for ${role}.`,
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: `${channel} was not in the ignored list for this rule.`,
      ephemeral: true,
    });
  }
}

async function handleIgnoreList(interaction: ChatInputCommandInteraction): Promise<void> {
  const role = interaction.options.getRole('role', true) as Role;

  const rule = ruleRepo.getRuleByGuildAndRole(interaction.guildId!, role.id);

  if (!rule) {
    await interaction.reply({
      content: `No rule found for ${role}.`,
      ephemeral: true,
    });
    return;
  }

  const ignored = ignoredChannelRepo.getIgnoredChannels(rule.id);

  if (ignored.length === 0) {
    await interaction.reply({
      content: `No channels are ignored for ${role}.`,
      ephemeral: true,
    });
    return;
  }

  const channels = ignored.map((ic) => `• <#${ic.channelId}>`).join('\n');

  await interaction.reply({
    content: `**Ignored Channels for ${role} (${ignored.length})**\n${channels}`,
    ephemeral: true,
  });
}

async function handleTest(interaction: ChatInputCommandInteraction): Promise<void> {
  const role = interaction.options.getRole('role', true) as Role;

  const rule = ruleRepo.getRuleByGuildAndRole(interaction.guildId!, role.id);

  if (!rule) {
    await interaction.reply({
      content: `No rule found for ${role}. Create one first with \`/repost rule add\`.`,
      ephemeral: true,
    });
    return;
  }

  const destChannel = await interaction.client.channels.fetch(rule.destinationChannelId).catch(() => null);

  if (!destChannel) {
    await interaction.reply({
      content: `Destination channel not found. The channel may have been deleted.`,
      ephemeral: true,
    });
    return;
  }

  if (destChannel.type !== ChannelType.GuildText && destChannel.type !== ChannelType.GuildAnnouncement) {
    await interaction.reply({
      content: `Destination channel is not a text channel.`,
      ephemeral: true,
    });
    return;
  }

  const { EmbedBuilder } = await import('discord.js');

  const embed = new EmbedBuilder()
    .setAuthor({
      name: interaction.user.displayName,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setDescription('This is a test repost message.')
    .setColor(rule.embedColor as import('discord.js').ColorResolvable)
    .setTimestamp()
    .setFooter({ text: `Posted in #${(interaction.channel as TextChannel).name}` });

  if (rule.includeJumpLink) {
    embed.addFields({ name: '\u200b', value: '[Jump to message](https://discord.com)' });
  }

  try {
    await (destChannel as TextChannel | NewsChannel).send({ embeds: [embed] });
    await interaction.reply({
      content: `Test message sent to <#${destChannel.id}>!`,
      ephemeral: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await interaction.reply({
      content: `Failed to send test message: ${errorMessage}`,
      ephemeral: true,
    });
  }
}
