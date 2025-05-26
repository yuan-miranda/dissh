import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { removeCredentials } from '../utility/removeCredentials.js';

export const data = new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete your saved SSH credentials from the bot.');

export async function execute(interaction) {
    const uid = interaction.user.id;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!removeCredentials(uid)) {
        await interaction.editReply('No saved credentials found.');
    } else {
        await interaction.editReply('Your saved SSH credentials have been deleted.');
    }
}