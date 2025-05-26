import { sshSessions } from "../../index.js";

/**
 * 
 * @param {string} uid - The user ID for which to remove the SSH session. 
 */
export function removeSession(uid) {
    delete sshSessions[uid];
}