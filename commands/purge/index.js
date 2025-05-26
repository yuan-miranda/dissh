import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete your saved SSH credentials from the bot.');

export async function execute(interaction) {
    await interaction.reply({
        content: 'Purge command is not yet implemented.',
        ephemeral: MessageFlags.Ephemeral
    });
}