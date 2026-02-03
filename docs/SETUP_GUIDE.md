# Setup Guide

## Table of Contents

1. [Create the Discord Application](#1-create-the-discord-application)
2. [Create the Bot User](#2-create-the-bot-user)
3. [Generate the Invite URL](#3-generate-the-invite-url)
4. [Server-Side Setup](#4-server-side-setup)
5. [Configure and Start the Bot](#5-configure-and-start-the-bot)
6. [Create Your First Repost Rule](#6-create-your-first-repost-rule)
7. [Testing the Bot](#7-testing-the-bot)
8. [Bot Appearance and Presence](#8-bot-appearance-and-presence)

---

## 1. Create the Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Give it a name (e.g., "Role Repost Bot")
4. Note the **Application ID** (also called Client ID) from the General Information page — you'll need it for `.env`

---

## 2. Create the Bot User

1. In the application settings, go to the **Bot** tab
2. Click **Reset Token** to generate a bot token — copy it immediately (you can't see it again)
3. Under **Privileged Gateway Intents**, enable:
   - **Message Content Intent** — required to read message content and detect role mentions
4. You do NOT need:
   - Server Members Intent
   - Presence Intent

---

## 3. Generate the Invite URL

Go to **OAuth2 > URL Generator** in the Developer Portal:

- **Scopes**: select `bot` and `applications.commands`
- **Bot Permissions**: select:
  - `Send Messages`
  - `Embed Links`
  - `Attach Files`
  - `Add Reactions`
  - `Read Message History`

This generates a URL like:

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=117824
```

Open that URL in a browser, select your server, and authorize.

---

## 4. Server-Side Setup

Once the bot is in the server:

### Enable Developer Mode

Go to **User Settings > Advanced > Developer Mode** and enable it. This lets you right-click channels, roles, and users to copy their IDs.

### Identify Roles and Channels

Think about which role mentions should trigger reposts and where they should go. For example:

| Trigger Role | Destination Channel | Use Case |
|---|---|---|
| `@Announcements` | `#announcement-log` | Archive announcements in a read-only channel |
| `@LFG` | `#lfg-board` | Collect looking-for-group posts in one place |
| `@Showcase` | `#showcase-gallery` | Aggregate showcase posts from multiple channels |

### Copy IDs You'll Need

Right-click (or long-press on mobile) to copy these IDs when creating rules:

| What | Where to find it |
|---|---|
| Server (Guild) ID | Right-click the server name (for `.env` during development) |
| Role ID | Server Settings > Roles > right-click the role |
| Channel ID | Right-click the channel |

---

## 5. Configure and Start the Bot

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd role-repost-bot
npm install

# 2. Set up secrets
cp .env.example .env
# Edit .env:
#   DISCORD_TOKEN=your-bot-token
#   CLIENT_ID=your-application-id
#   GUILD_ID=your-server-id  (optional, for faster command registration)

# 3. Register slash commands with Discord
npm run deploy

# 4. Start the bot
npm run dev        # Development (with tsx, auto-restart)
# or
npm run build && npm start   # Production
```

### Verifying It Works

When the bot starts, you should see:

```
Database migrations complete
Ready! Logged in as YourBotName#1234
```

In your server, the bot should appear in the member list as online.

---

## 6. Create Your First Repost Rule

Rules are configured entirely via slash commands — no config files needed.

### Basic Rule

```
/repost rule add role:@Announcements channel:#announcement-log
```

This creates a rule that:
- Triggers when anyone mentions `@Announcements`
- Reposts the message to `#announcement-log` as an embed
- Adds a ✅ reaction to the original message
- Includes a "Jump to message" link

### Customized Rule

```
/repost rule add role:@LFG channel:#lfg-board color:#00FF00 cooldown:300 reaction:📌
```

This creates a rule with:
- Green embed color
- 5-minute cooldown between reposts per user
- 📌 reaction on the original message

### Available Options

| Option | Default | Description |
|---|---|---|
| `role` | (required) | Role that triggers the repost |
| `channel` | (required) | Destination channel for reposts |
| `color` | `#5865F2` | Embed color in hex format |
| `reaction` | `✅` | Reaction on original message (empty string to disable) |
| `cooldown` | `0` | Seconds between reposts per user (0 = no cooldown) |
| `jump_link` | `true` | Include link to original message |
| `strip_mention` | `true` | Remove the role mention from reposted content |

### Excluding Channels

If certain channels shouldn't trigger the rule:

```
/repost ignore add role:@Announcements channel:#admin-chat
```

Now messages mentioning `@Announcements` in `#admin-chat` won't be reposted.

---

## 7. Testing the Bot

### Test Command

Send a test embed without needing to mention the role:

```
/repost test role:@Announcements
```

This sends a sample embed to the destination channel so you can verify formatting and permissions.

### Live Test

1. Go to any channel (not in the ignore list)
2. Post a message mentioning the trigger role: `Hey @Announcements check this out!`
3. The bot should:
   - React to your message with the configured reaction
   - Repost the message to the destination channel as an embed

### Troubleshooting

**Bot doesn't react to mentions:**
- Verify Message Content Intent is enabled in the Developer Portal
- Check the bot has "View Channel" and "Read Message History" in the source channel
- Ensure the channel isn't in the ignore list: `/repost ignore list role:@YourRole`

**Repost doesn't appear:**
- Check the bot has "Send Messages", "Embed Links", and "Attach Files" in the destination channel
- Look at the console for error messages

**Commands don't appear:**
- Run `npm run deploy` to register commands
- If using `GUILD_ID`, commands appear immediately in that server
- Without `GUILD_ID`, global commands take up to 1 hour to propagate

---

## 8. Bot Appearance and Presence

### What You Control in the Developer Portal

These are set in the [Developer Portal](https://discord.com/developers/applications) under the **Bot** tab and **General Information** tab:

| Setting | Where | Notes |
|---|---|---|
| **Bot username** | Bot tab | The display name in the member list and messages |
| **Bot avatar** | Bot tab | Profile picture shown next to messages and in the member list |
| **Bot banner** | Bot tab | Profile banner (visible when clicking the bot's profile) |
| **App description** | General Information | Shown in the bot's "About Me" when users click its profile |
| **App icon** | General Information | Used in the OAuth2 authorization screen |

### What You Control in Code (Presence / Status)

Discord bots can set a **presence** that shows as a status line under their name in the member list. This is configured in the client options or set dynamically at runtime.

#### Status Types

| Status | Appearance |
|---|---|
| `online` | Green dot |
| `idle` | Yellow/orange dot |
| `dnd` (do not disturb) | Red dot |
| `invisible` | Gray dot (appears offline) |

#### Activity Types

| Type | Displays as |
|---|---|
| `Playing` | "Playing ..." |
| `Watching` | "Watching ..." |
| `Listening` | "Listening to ..." |
| `Competing` | "Competing in ..." |
| `Custom` | Shows custom text with optional emoji |

#### Where to Configure

The bot's presence is set in `src/client.ts` via the client constructor options, or dynamically via `client.user.setPresence()`.

To set a static presence at startup, modify the `createClient()` function in `src/client.ts`:

```typescript
import { Client, GatewayIntentBits, ActivityType } from 'discord.js';

export function createClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    presence: {
      status: 'online',
      activities: [{
        name: 'for role mentions',
        type: ActivityType.Watching,
      }],
    },
  });
}
```

### Summary of Appearance Controls

| Aspect | Controlled where |
|---|---|
| Username and avatar | Developer Portal (Bot tab) |
| Profile description | Developer Portal (General Information) |
| Online/idle/DND status | Code: `presence.status` in client options |
| "Playing/Watching/..." text | Code: `presence.activities` in client options |
| Embed color and reaction | Slash commands (`/repost rule add`) |

---

## Command Reference

All commands require **Manage Guild** permission.

### Rule Management

| Command | Description |
|---|---|
| `/repost rule add` | Create a new repost rule |
| `/repost rule remove <role>` | Delete a rule |
| `/repost rule list` | List all rules in the server |
| `/repost rule info <role>` | View detailed rule settings |
| `/repost test <role>` | Send a test embed to the destination |

### Ignored Channels

| Command | Description |
|---|---|
| `/repost ignore add <role> <channel>` | Don't repost from this channel |
| `/repost ignore remove <role> <channel>` | Resume reposting from this channel |
| `/repost ignore list <role>` | List ignored channels for a rule |
