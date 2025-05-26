import { sshSessions } from "../../index.js";

export function removeSession(uid) {
    delete sshSessions[uid];
}