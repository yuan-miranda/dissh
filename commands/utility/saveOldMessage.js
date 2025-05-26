import { oldMessages } from "../../index.js";

export function saveOldMessage(messageId, messageObject) {
    oldMessages[messageId] = messageObject;
}