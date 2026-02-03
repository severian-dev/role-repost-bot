# Role Repost Bot

A Discord bot that monitors messages for role mentions and reposts them to designated channels. Supports multiple rules per guild, configured via slash commands.

## Features

- **Multiple rules per guild** — Map different roles to different destination channels
- **Slash command configuration** — No config files to edit
- **SQLite persistence** — Rules survive bot restarts
- **Per-user cooldowns** — Prevent spam
- **Customizable embeds** — Color, reaction, jump link
- **Ignored channels** — Exclude specific channels from reposting
- **Attachment forwarding** — Images and files are included in reposts

## Requirements

- Node.js 20+
- A Discord bot with these intents enabled:
  - Guilds
  - Guild Messages
  - **Message Content** (privileged intent - must enable in Discord Developer Portal)

## Setup

1. Clone and install dependencies:

```bash
git clone <repo-url>
cd role-repost-bot
npm install
```

2. Create a `.env` file:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_dev_guild_id  # Optional, for faster command updates during development
```

3. Deploy slash commands:

```bash
npm run deploy
```

4. Start the bot:

```bash
npm run dev    # Development with auto-restart
npm run build && npm start  # Production
```

## Commands

All commands require the **Manage Guild** permission.

### Rule Management

| Command | Description |
|---------|-------------|
| `/repost rule add <role> <channel>` | Create a new repost rule |
| `/repost rule remove <role>` | Delete a rule |
| `/repost rule list` | List all rules in the server |
| `/repost rule info <role>` | View detailed rule settings |
| `/repost test <role>` | Send a test embed to the destination |

### Rule Options

When adding a rule, you can customize:

| Option | Default | Description |
|--------|---------|-------------|
| `color` | `#5865F2` | Embed color (hex format) |
| `reaction` | `✅` | Reaction added to original message (empty to disable) |
| `cooldown` | `0` | Seconds between reposts per user |
| `jump_link` | `true` | Include link to original message |
| `strip_mention` | `true` | Remove the role mention from content |

### Ignored Channels

| Command | Description |
|---------|-------------|
| `/repost ignore add <role> <channel>` | Don't repost from this channel |
| `/repost ignore remove <role> <channel>` | Resume reposting from this channel |
| `/repost ignore list <role>` | List ignored channels for a rule |

## How It Works

1. User posts a message mentioning a trigger role (e.g., `@Announcements`)
2. Bot checks if a rule exists for that role in the guild
3. Bot verifies the source channel isn't ignored
4. Bot checks user cooldown
5. Bot creates an embed with the message content, author, timestamp
6. Bot forwards attachments and any embeds from the original
7. Bot reacts to the original message (if configured)
8. Bot sets user cooldown (if configured)

## Database

Rules are stored in SQLite (`./repost.db` by default). The database is created automatically on first run.

To use a different location, set `DATABASE_PATH` in your environment:

```env
DATABASE_PATH=/path/to/data/repost.db
```

## Development

```bash
npm run dev        # Run with tsx (auto-restart on changes)
npm run typecheck  # Type-check without building
npm run build      # Build for production
npm run deploy     # Deploy slash commands
```

## Bot Permissions

The bot needs these permissions in channels where it operates:

**Source channels:**
- View Channel
- Read Message History
- Add Reactions (if using confirmation reaction)

**Destination channels:**
- View Channel
- Send Messages
- Embed Links
- Attach Files

## License

MIT
