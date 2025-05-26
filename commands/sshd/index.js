import { SlashCommandBuilder, MessageFlags } from 'discord.js';

import { client, sshSessions, statusMessages } from '../../index.js';
import { getSession } from '../utility/getSession.js';
import { getCredentials } from '../utility/getCredentials.js';
import { createSession } from '../utility/createSession.js';
import { saveSessions } from '../utility/saveSessions.js';
import { getCurrentTime } from '../utility/getCurrentTime.js';

async function connectSession(uid, credentials) {
    if (getSession(uid)) throw new Error(statusMessages.alreadyConnected);
    if (!credentials) throw new Error(statusMessages.noCredentials);

    try {
        const newSession = await createSession(uid, credentials);

        client.user.setActivity(`${Object.keys(sshSessions).length || 0} active session(s)`);
        client.users.fetch(uid).then(async (user) => console.log(`${getCurrentTime()} ${user.tag} connected to ${credentials.host}:${credentials.port} as ${credentials.username}`));

        saveSessions(uid, newSession);
        return newSession;
    } catch (error) {
        throw new Error(error.message);
    }
}

async function autoConnectSession(uid) {
    await connectSession(uid, getCredentials(uid));
}

export const data = new SlashCommandBuilder()
    .setName('sshd')
    .setDescription('Connect to a remote server via SSH. If no options are provided, saved credentials will be used.')
    .addStringOption(option =>
        option.setName('host')
            .setDescription('The domain name or IP address of the remote server (e.g., example.com or 192.168.1.1).')
            .setRequired(false))
    .addIntegerOption(option =>
        option.setName('port')
            .setDescription('SSH port on the remote server (default is 22).')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('username')
            .setDescription('The user account name you are logging into on the remote server.')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('password')
            .setDescription('The password for that user account (if not using key-based authentication).')
            .setRequired(false));

export async function execute(interaction) {
    const uid = interaction.user.id;

    const host = interaction.options.getString('host');
    const port = interaction.options.getInteger('port') || 22;
    const username = interaction.options.getString('username');
    const password = interaction.options.getString('password');

    await interaction.deferReply({ ephemeral: MessageFlags.Ephemeral });
    try {
        if (!host && !username) {
            await autoConnectSession(uid);
        } else {
            await connectSession(uid, { host, port, username, password });
        }
        return interaction.editReply('Connected to the session successfully.');

    } catch (error) {
        console.error(error);
        return interaction.editReply({
            content: error.message,
            flags: MessageFlags.Ephemeral
        })
    }
}