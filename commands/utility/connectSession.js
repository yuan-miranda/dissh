import { client, sshSessions, statusMessages } from '../../index.js';
import { getSession } from '../utility/getSession.js';
import { createSession } from '../utility/createSession.js';
import { saveSessions } from '../utility/saveSessions.js';
import { getCurrentTime } from '../utility/getCurrentTime.js';

/**
 * 
 * @param {string} uid - The user ID for which to connect the SSH session.
 * @param {Object} credentials - The credentials object containing host, port, username, and password. 
 * @returns 
 */
export async function connectSession(uid, credentials) {
    if (getSession(uid)) throw new Error(statusMessages.alreadyConnected);
    if (!credentials) throw new Error(statusMessages.noCredentials);

    try {
        const newSession = await createSession(uid, credentials);

        client.user.setActivity(`${Object.keys(sshSessions).length || 0} active session(s)`);
        client.users.fetch(uid).then(async (user) => console.log(`${getCurrentTime()} ${user.tag} connected to ${credentials.host}:${credentials.port} as ${credentials.username}`));

        saveSessions(uid, newSession);
        return newSession;
    } catch (error) {
        throw new Error(error.message);
    }
}
