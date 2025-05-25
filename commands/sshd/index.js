import { SlashCommandBuilder } from 'discord.js';

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
    await interaction.reply('SSH session handling is not yet implemented.');
}