import { activeMessages } from "../../index.js";

/**
 * 
 * @param {string} uid - The user ID for which to get the active message.
 * @param {Object} messageObject - The message object to save for the user. 
 */
export function saveActiveMessage(uid, messageObject) {
    activeMessages[uid] = messageObject;
}