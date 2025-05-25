import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { loadCommandModules } from './commands/utility/loadCommandModules.js';
import { loadEventModules } from './events/utility/loadEventModules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: `${__dirname}/.env` });
// eslint-disable-next-line no-undef
const { token } = process.env;



const sshSessions = {};
function saveSessions() {
    console.log('Saving SSH sessions...');
}



import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

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
})();

client.on(Events.MessageCreate, async message => {
    return message;
});

client.on(Events.MessageDelete, async message => {
    return message;
});

client.login(token);

export { client, sshSessions, saveSessions };