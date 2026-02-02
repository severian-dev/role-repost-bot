# Role Repost Bot — Specification

A Discord bot that monitors messages for role mentions and reposts them to a designated channel.

## Purpose

When users mention a specific role (e.g., `@Highlight`, `@Announcement`, `@Repost`) in any message, the bot automatically reposts that message to a configured destination channel. This is useful for:

- Collecting important announcements in one place
- Creating a "best of" or highlights channel
- Aggregating content from multiple channels

## Core Functionality

### Message Flow

```
User posts message mentioning @TargetRole in #any-channel
    ↓
Bot detects role mention
    ↓
Bot reposts to #destination-channel with:
    - Original author attribution
    - Link to original message
    - Original content (text, embeds, attachments)
    ↓
(Optional) Bot reacts to original with ✅ to confirm
```

### Features

| Feature | Description |
|---------|-------------|
| **Role trigger** | Configurable role ID that triggers repost |
| **Destination channel** | Configurable channel where reposts go |
| **Attribution** | Shows original author, channel, and timestamp |
| **Jump link** | Includes link back to original message |
| **Attachment forwarding** | Preserves images and files |
| **Embed preservation** | Forwards any embeds from original |
| **Confirmation reaction** | Optional reaction on source message |
| **Ignore list** | Optional list of channels to ignore |
| **Cooldown** | Optional per-user cooldown to prevent spam |

## Technical Requirements

### Discord Intents

- `Guilds` — Access guild information
- `GuildMessages` — Receive message events
- `MessageContent` — Read message content (privileged intent)

### Bot Permissions

- Read Messages / View Channels (in monitored channels)
- Send Messages (in destination channel)
- Embed Links (in destination channel)
- Attach Files (in destination channel)
- Add Reactions (if confirmation reaction enabled)

### Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Discord library**: discord.js v14
- **Configuration**: `.env` for secrets, `config.json` for behavior

## Configuration

### Environment Variables (`.env`)

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_server_id
```

### Behavior Config (`config.json`)

```json
{
  "triggerRoleId": "123456789",
  "destinationChannelId": "987654321",
  "confirmReaction": "✅",
  "ignoredChannelIds": [],
  "cooldownSeconds": 0,
  "embedColor": "#5865F2",
  "includeJumpLink": true,
  "stripRoleMention": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `triggerRoleId` | string | Role ID that triggers repost |
| `destinationChannelId` | string | Channel ID to repost into |
| `confirmReaction` | string \| null | Emoji to react with on success (null to disable) |
| `ignoredChannelIds` | string[] | Channels to ignore even if role mentioned |
| `cooldownSeconds` | number | Per-user cooldown (0 to disable) |
| `embedColor` | string | Hex color for repost embed |
| `includeJumpLink` | boolean | Include "Jump to message" link |
| `stripRoleMention` | boolean | Remove the trigger role mention from reposted content |

## Repost Embed Format

```
┌─────────────────────────────────────────┐
│ [Author Avatar] AuthorName              │
│ Posted in #channel-name                 │
├─────────────────────────────────────────┤
│                                         │
│ [Original message content here]         │
│                                         │
│ [Any attachments/images]                │
│                                         │
├─────────────────────────────────────────┤
│ 🔗 Jump to message    •    Jan 15, 2026 │
└─────────────────────────────────────────┘
```

## Project Structure

```
role-repost-bot/
├── src/
│   ├── index.ts              # Entry point
│   ├── client.ts             # Discord client setup
│   ├── config/
│   │   ├── loader.ts         # Config loading
│   │   └── schema.ts         # Zod validation schema
│   ├── events/
│   │   ├── ready.ts          # Bot ready handler
│   │   └── messageCreate.ts  # Main repost logic
│   ├── services/
│   │   ├── repostService.ts  # Build and send repost
│   │   └── cooldownService.ts# In-memory cooldown tracking
│   └── types/
│       └── config.ts         # Type definitions
├── .env.example
├── config.json
├── package.json
├── tsconfig.json
├── CLAUDE.md
└── README.md
```

## Commands (Optional)

If slash commands are desired:

| Command | Description |
|---------|-------------|
| `/repost-config` | Show current configuration |
| `/repost-test` | Test repost to destination (admin only) |
| `/repost-ignore <channel>` | Add/remove channel from ignore list |

## Error Handling

- **Missing permissions**: Log warning, skip repost
- **Deleted message**: Handle race condition gracefully
- **Rate limits**: Respect Discord rate limits
- **Invalid config**: Fail fast on startup with clear error

## Future Enhancements (Out of Scope for MVP)

- Multiple trigger roles with different destinations
- Webhook mode (repost appears as original author)
- Keyword triggers in addition to role mentions
- Web dashboard for configuration
- Message filtering (min length, require attachments, etc.)
