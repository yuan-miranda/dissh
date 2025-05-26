import { messageLocations } from "../../index.js";

/**
 * 
 * @param {string} messageId - The ID of the message for which to get the location.
 * @returns 
 */
export function getMessageLocation(messageId) {
    return messageLocations[messageId];
}