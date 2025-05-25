import { Events } from "discord.js";

export const name = Events.MessageCreate;
export async function execute(message) {
    return message;
}