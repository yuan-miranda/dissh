import { Events } from "discord.js";

export const name = Events.MessageDelete;
export async function execute(message) {
    return message;
}
