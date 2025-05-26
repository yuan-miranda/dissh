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

const statusMessages = {
    alreadyConnected: 'You are already connected to a session.',
    noCredentials: 'No saved credentials found.',
    invalidHost: 'Invalid or unreachable host address.',
    invalidPort: 'Invalid port or session is unreachable. The default port is 22.',
    invalidPassword: 'Incorrect password.',
    noActiveSession: 'No active session found.',
    connected: 'Connected to the session.',
    disconnected: 'Disconnected from the session.',
    credentialDeleted: 'Credential deleted successfully.',
    noResponse: 'The session did not respond.',
    sessionTimeout: 'Connection timed out.',
};

export {
    __dirname,
    client,
    token,
    clientId,
    messageAuthor,
    messageLocations,
    oldMessages,
    activeMessages,
    sshStreamOutputs,
    sshStreams,
    sshSessions,
    statusMessages
};