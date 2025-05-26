import { sshSessions } from '../../index.js';

/**
 * 
 * @param {string} uid - The user ID for which to get the SSH session.
 * @param {Object} session - The SSH session object to save. 
 */
export function saveSessions(uid, session) {
    sshSessions[uid] = session;
}