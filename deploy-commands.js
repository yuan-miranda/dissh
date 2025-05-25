import { REST, Routes } from 'discord.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { loadCommandModules } from './commands/utility/loadCommandModules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: `${__dirname}/.env` });
// eslint-disable-next-line no-undef
const { token, clientId } = process.env;

const rest = new REST().setToken(token);

(async () => {
    try {
        const commandModules = await loadCommandModules(__dirname);
        const commands = commandModules.map(command => command.data.toJSON());
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();