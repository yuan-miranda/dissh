import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: `${__dirname}/.env` });
// eslint-disable-next-line no-undef
const { token, clientId } = process.env;

import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const messageAuthor = {};
const messageLocations = {};
const oldMessages = {};
const activeMessages = {};
const sshStreamOutputs = {};
const sshStreams = {};
const sshSessions = {};

export { client, token, clientId, messageAuthor, messageLocations, oldMessages, activeMessages, sshStreamOutputs, sshStreams, sshSessions, __dirname };