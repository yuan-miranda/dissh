import { sshSessions } from '../../index.js';

/**
 * 
 * @param {string} uid - The user ID for which to get the SSH session. 
 * @returns 
 */
export function getSession(uid) {
    return sshSessions[uid];
}