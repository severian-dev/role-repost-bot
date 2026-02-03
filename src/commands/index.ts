import type { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import * as repost from './repost.js';

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands = new Map<string, Command>();

commands.set(repost.data.name, repost as unknown as Command);

export function getCommandsData() {
  return Array.from(commands.values()).map((c) => c.data.toJSON());
}
