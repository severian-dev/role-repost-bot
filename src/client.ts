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
        name: 'Just keeping an eye on things',
        type: ActivityType.Custom,
      }],
    },
  });
}
