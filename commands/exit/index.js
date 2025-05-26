import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { disconnectSession } from '../utility/disconnectSession.js';

export const data = new SlashCommandBuilder()
    .setName('exit')
    .setDescription('Close and disconnect from your current SSH session.');

export async function execute(interaction) {
    const uid = interaction.user.id;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
        await disconnectSession(uid);
        await interaction.editReply('You have been disconnected from the session.');
    } catch (error) {
        console.error(error);
        await interaction.editReply(error.message);
    }
}