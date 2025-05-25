import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('exit')
    .setDescription('Close and disconnect from your current SSH session.');

export async function execute(interaction) {
    await interaction.reply({
        content: 'Exit command is not yet implemented. Use `/purge` to delete saved credentials.',
        ephemeral: true
    });
}