import type { Client } from 'discord.js';
import { registerReadyEvent } from './ready.js';
import { registerMessageCreateEvent } from './messageCreate.js';
import { registerInteractionCreateEvent } from './interactionCreate.js';

export function registerEvents(client: Client): void {
  registerReadyEvent(client);
  registerMessageCreateEvent(client);
  registerInteractionCreateEvent(client);
}
