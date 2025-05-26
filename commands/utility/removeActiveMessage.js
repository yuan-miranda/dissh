import { activeMessages } from "../../index.js";

/**
 * 
 * @param {string} uid - The user ID for which to get the active message. 
 */
export function removeActiveMessage(uid) {
    delete activeMessages[uid];
}