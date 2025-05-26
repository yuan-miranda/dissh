import { sshSessions } from '../../index.js';

export function getSession(uid) {
    return sshSessions[uid];
}