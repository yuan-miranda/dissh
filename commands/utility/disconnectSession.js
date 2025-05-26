import { getSession } from "./getSession.js"
import { removeSession } from "./removeSession.js"
import { removeStream } from "./removeStream.js"
import { removeStreamOutput } from "./removeStreamOutput.js"
import { getActiveMessage } from "./getActiveMessage.js"
import { saveOldMessage } from "./saveOldMessage.js"
import { removeActiveMessage } from "./removeActiveMessage.js"
import { getCurrentTime } from "./getCurrentTime.js"
import { client, sshSessions } from "../../index.js";

export async function disconnectSession(uid) {
    const session = getSession(uid);
    if (!session) throw new Error("No active session found.");

    session.end();
    removeSession(uid);
    removeStream(uid);
    removeStreamOutput(uid);

    client.user.setActivity(`${Object.keys(sshSessions).length || 0} active session(s)`);
    client.users.fetch(uid).then(async (user) => console.log(`${getCurrentTime()} ${user.tag} disconnected to ${session.host}:${session.port} as ${session.username}`));
    
    if (getActiveMessage(uid)) {
        saveOldMessage(getActiveMessage(uid).id, getActiveMessage(uid));
        removeActiveMessage(uid);
    }
}