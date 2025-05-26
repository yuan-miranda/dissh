import { sshSessions } from '../../index.js';

export function saveSessions(uid, session) {
    sshSessions[uid] = session;
}