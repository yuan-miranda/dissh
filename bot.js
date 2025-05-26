import { loadCommandModules } from './commands/utility/loadCommandModules.js';
import { loadEventModules } from './events/utility/loadEventModules.js';
import { __dirname, client, token } from './index.js';
import { Collection } from 'discord.js';

(async () => {
    const commandModules = await loadCommandModules(__dirname);
    client.commands = new Collection();
    for (const command of commandModules) {
        client.commands.set(command.data.name, command);
    }

    const eventModules = await loadEventModules(__dirname);
    for (const event of eventModules) {
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }

    client.login(token);
})();