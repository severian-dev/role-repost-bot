# CLAUDE.md

Project instructions for building the Role Repost Bot.

## Project Overview

Discord bot that monitors messages for a specific role mention and reposts them to a designated channel. Built with TypeScript and discord.js v14.

## Getting Started

If this is a fresh project, initialize it:

```bash
npm init -y
npm install discord.js zod dotenv
npm install -D typescript tsup tsx @types/node
npx tsc --init
```

Then configure `tsconfig.json` for strict mode and ES modules.

## Key Commands

- `npm run dev` — Run with tsx (development, auto-restart)
- `npm run build` — Compile with tsup
- `npm start` — Run compiled output
- `npx tsc --noEmit` — Type-check without emitting

## Implementation Priorities

Build in this order:

1. **Config loading** — `.env` for secrets, `config.json` for behavior, validate with Zod
2. **Client setup** — Discord.js client with required intents
3. **Ready event** — Log successful connection
4. **messageCreate event** — Core repost logic
5. **Repost service** — Build embed, forward attachments
6. **Cooldown service** — In-memory Map for per-user cooldowns (no database needed)

## Key Implementation Details

### Required Intents

```typescript
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Privileged - must enable in Discord Developer Portal
  ],
});
```

### Message Event Logic

```typescript
// Pseudocode for messageCreate handler
if (message.author.bot) return;
if (!message.mentions.roles.has(config.triggerRoleId)) return;
if (config.ignoredChannelIds.includes(message.channelId)) return;
if (isOnCooldown(message.author.id)) return;

await repostMessage(message, config);
await message.react(config.confirmReaction); // if enabled
setCooldown(message.author.id);
```

### Repost Embed Structure

```typescript
const embed = new EmbedBuilder()
  .setAuthor({
    name: message.author.displayName,
    iconURL: message.author.displayAvatarURL()
  })
  .setDescription(content)
  .setColor(config.embedColor)
  .setTimestamp(message.createdAt)
  .setFooter({ text: `Posted in #${message.channel.name}` });

if (config.includeJumpLink) {
  embed.addFields({ name: '\u200b', value: `[Jump to message](${message.url})` });
}
```

### Attachment Handling

```typescript
// Attachments can be forwarded by URL
const files = message.attachments.map(a => a.url);
await destChannel.send({ embeds: [embed], files });
```

## Project Structure

```
src/
├── index.ts              # Entry point
├── client.ts             # Discord client factory
├── config/
│   ├── loader.ts         # Load and validate config
│   └── schema.ts         # Zod schema
├── events/
│   ├── ready.ts          # ClientReady handler
│   └── messageCreate.ts  # Repost trigger logic
├── services/
│   ├── repostService.ts  # Build embed, send repost
│   └── cooldownService.ts# In-memory cooldowns
└── types/
    └── config.ts         # Config interface
```

## Conventions

- All configuration is validated with Zod on startup
- Services contain business logic, events handle Discord API calls
- Use early returns for guard clauses
- Log important events (startup, reposts, errors)

## Configuration Schema

```typescript
// config/schema.ts
import { z } from 'zod';

export const configSchema = z.object({
  triggerRoleId: z.string(),
  destinationChannelId: z.string(),
  confirmReaction: z.string().nullable().default('✅'),
  ignoredChannelIds: z.array(z.string()).default([]),
  cooldownSeconds: z.number().default(0),
  embedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#5865F2'),
  includeJumpLink: z.boolean().default(true),
  stripRoleMention: z.boolean().default(true),
});
```

## Environment Variables

```env
DISCORD_TOKEN=     # Bot token from Discord Developer Portal
CLIENT_ID=         # Application ID
GUILD_ID=          # Server ID (for development)
```

## Documentation

When making changes, update:

- **README.md** — Setup instructions, configuration reference
- **CHANGELOG.md** — Track changes (if created)

## Error Handling

- Wrap Discord API calls in try/catch
- Log errors with context (channel ID, user ID)
- Don't crash on transient failures (missing permissions, deleted messages)
- Validate config on startup and fail fast with clear messages

## Testing Checklist

Before considering complete:

- [ ] Bot connects and logs ready message
- [ ] Message with trigger role is reposted
- [ ] Message without trigger role is ignored
- [ ] Bot messages are ignored
- [ ] Ignored channels are respected
- [ ] Cooldown prevents spam
- [ ] Attachments are forwarded
- [ ] Embeds from original are preserved
- [ ] Jump link works
- [ ] Confirmation reaction appears (if enabled)
- [ ] Missing permissions are handled gracefully
