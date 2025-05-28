import { ActivityType } from "discord.js";
import { getSession } from "./getSession.js"
import { removeSession } from "./removeSession.js"
import { removeStream } from "./removeStream.js"
import { removeStreamOutput } from "./removeStreamOutput.js"
import { getActiveMessage } from "./getActiveMessage.js"
import { saveOldMessage } from "./saveOldMessage.js"
import { removeActiveMessage } from "./removeActiveMessage.js"
import { getCurrentTime } from "./getCurrentTime.js"
import { client, sshSessions, statusMessages } from "../../index.js";

/**
 * 
 * @param {string} uid - The user ID for which to disconnect the SSH session. 
 */
export async function disconnectSession(uid) {
    const session = getSession(uid);
    if (!session) throw new Error(statusMessages.noActiveSession);

    client.users.fetch(uid).then(async (user) => console.log(`${getCurrentTime()} ${user.tag} disconnected to ${session.config.host}:${session.config.port} as ${session.config.username}`));

    session.end();
    removeSession(uid);
    removeStream(uid);
    removeStreamOutput(uid);

    client.user.setActivity({
        name: `${Object.keys(sshSessions).length || 0} active session(s)`,
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/yuanezekielamiranda'
    });

    if (getActiveMessage(uid)) {
        saveOldMessage(getActiveMessage(uid).id, getActiveMessage(uid));
        removeActiveMessage(uid);
    }
}