import { REST, Routes } from 'discord.js';
import { env } from './config/env.js';
import { getCommandsData } from './commands/index.js';

const rest = new REST().setToken(env.DISCORD_TOKEN);

async function deployCommands() {
  try {
    const commands = getCommandsData();

    console.log(`Deploying ${commands.length} command(s)...`);

    if (env.GUILD_ID) {
      // Deploy to specific guild (instant)
      await rest.put(Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID), {
        body: commands,
      });
      console.log(`Successfully deployed commands to guild ${env.GUILD_ID}`);
    } else {
      // Deploy globally (can take up to 1 hour)
      await rest.put(Routes.applicationCommands(env.CLIENT_ID), {
        body: commands,
      });
      console.log('Successfully deployed commands globally (may take up to 1 hour to propagate)');
    }
  } catch (error) {
    console.error('Failed to deploy commands:', error);
    process.exit(1);
  }
}

deployCommands();
