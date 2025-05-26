import { Events, MessageFlags } from "discord.js";
import { readFileSync } from "fs";
import { __dirname } from "../index.js";

export const name = Events.InteractionCreate;
export async function execute(interaction) {
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            }
        }
    } else if (interaction.isButton()) {
        if (interaction.customId !== "text_view") return;
        try {
            await interaction.deferReply({ ephemeral: true });
            let content = readFileSync(`${__dirname}/data/messages/${interaction.message.id}.txt`, 'utf8');

            if (content.length >= 2000) content = content.substring(content.length - 1900);
            await interaction.editReply({ content: `\`\`\`bash\n${content}\n\`\`\``});
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'There was an error while retrieving the message content.', flags: MessageFlags.Ephemeral });
        }
    }
}