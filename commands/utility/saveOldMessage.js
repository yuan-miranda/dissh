import { oldMessages } from "../../index.js";

/**
 * 
 * @param {string} messageId - The ID of the message to save.
 * @param {Object} messageObject - The message object to save. 
 */
export function saveOldMessage(messageId, messageObject) {
    oldMessages[messageId] = messageObject;
}