import { activeMessages } from "../../index.js";

/**
 * 
 * @param {string} uid - The user ID for which to get the active message.
 * @returns 
 */
export function getActiveMessage(uid) {
    return activeMessages[uid];
}