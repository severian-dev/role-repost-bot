import type { Client } from 'discord.js';

export function registerReadyEvent(client: Client): void {
  client.once('ready', (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
    console.log(`Serving ${readyClient.guilds.cache.size} guild(s)`);
  });
}
