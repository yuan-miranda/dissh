import { REST, Routes } from 'discord.js';
import { loadCommandModules } from './commands/utility/loadCommandModules.js';
import { __dirname, token, clientId } from './index.js';

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