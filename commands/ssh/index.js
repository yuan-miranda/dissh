import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ssh')
    .setDescription('Execute a command in the current SSH session.')
    .addStringOption(option =>
        option.setName('command')
            .setDescription('The command to run on the remote server.')
            .setRequired(false));

export async function execute(interaction) {
    await interaction.reply('SSH command execution is not yet implemented.');
}
