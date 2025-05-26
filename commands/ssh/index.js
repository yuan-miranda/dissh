import { SlashCommandBuilder, MessageFlags, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { getActiveMessage } from '../utility/getActiveMessage.js';
import { getMessageLocation } from '../utility/getMessageLocation.js';
import { saveActiveMessage } from '../utility/saveActiveMessage.js';
import { saveMessageLocation } from '../utility/saveMessageLocation.js';
import { saveMessageAuthor } from '../utility/saveMessageAuthor.js';
import { executeCommand } from '../utility/executeCommand.js';
import { client } from '../../index.js';
import { writeFileSync } from 'fs';
import { __dirname } from '../../index.js';

export const data = new SlashCommandBuilder()
    .setName('ssh')
    .setDescription('Execute a command in the current SSH session.')
    .addStringOption(option =>
        option.setName('command')
            .setDescription('The command to run on the remote server.')
            .setRequired(false));

export async function execute(interaction) {
    const uid = interaction.user.id;
    const channelId = interaction.channelId;
    const guildId = interaction.guildId;

    const command = interaction.options.getString('command');
    const button = new ButtonBuilder()
        .setCustomId('text_view')
        .setLabel('View in Text')
        .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(button);

    await interaction.deferReply();
    try {
        const result = await executeCommand(uid, command);
        let activeMessage = getActiveMessage(uid);
        let oldMessage;
        let message;

        if (activeMessage) {
            if (getMessageLocation(activeMessage.id).channelId === channelId) {
                // get the existing message if the command was executed in the same channel
                oldMessage = await interaction.fetchReply(activeMessage.id);
                oldMessage.delete();
            } else {
                // when in a different channel, fetch the message from the original channel
                oldMessage = client.channels.cache.get(getMessageLocation(activeMessage.id).channelId);
                oldMessage = await oldMessage.messages.fetch(activeMessage.id);
                oldMessage.delete();
            }
        }

        message = await interaction.editReply('loading...');
        writeFileSync(`${__dirname}/data/messages/${message.id}.txt`, result);
        message = await interaction.editReply({ content: "", files: [`${__dirname}/data/messages/${message.id}.txt`], components: [row] });

        saveActiveMessage(uid, message);
        saveMessageLocation(message.id, channelId, guildId);
        saveMessageAuthor(message.id, uid);
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: error.message,
            ephemeral: MessageFlags.Ephemeral
        });
    }
}
