import { MessageFlags, ActivityType } from "discord.js";
import ssh2 from "ssh2";
import { disconnectSession } from "../utility/disconnectSession.js";
import { saveCredentials } from "../utility/saveCredentials.js";
import { saveSessions } from "../utility/saveSessions.js";
import { client, statusMessages, sshSessions } from "../../index.js";

/**
 * 
 * @param {string} uid - The user ID for which to create the SSH session.
 * @param {Object} credentials - The credentials object containing host, port, username, and password. 
 */
export async function createSession(uid, credentials) {
    const session = new ssh2.Client();

    session.on("error", async (err) => {
        if (err.message === "Keepalive timeout" || err.message === "read ECONNRESET") {
            await disconnectSession(uid);
            await client.users.fetch(uid).then(async (user) => user.send({ content: "You have been disconnected from the session.", ephemeral: MessageFlags.Ephemeral }));
        } else if (err.message === "Timed out while waiting for handshake") {
            throw new Error(statusMessages.sessionTimeout);
        } else if (err.message === "getaddrinfo ENOTFOUND") {
            throw new Error(statusMessages.invalidHost);
        } else if (err.message === "connect ECONNREFUSED") {
            throw new Error(statusMessages.invalidPort);
        } else if (err.message === 'All configured authentication methods failed') {
            throw new Error(statusMessages.invalidPassword);
        } else {
            throw err;
        }
    });
    session.on("end", async () => {
        await client.users.fetch(uid).then(async (user) => user.send({ content: "You have been disconnected from the session.", ephemeral: MessageFlags.Ephemeral }));
    });
    session.once("ready", () => {
        saveSessions(uid, session);
        saveCredentials(uid, credentials);

        client.user.setActivity({
            name: `${Object.keys(sshSessions).length || 0} active session(s)`,
            type: ActivityType.Streaming,
            url: 'https://www.twitch.tv/yuanezekielamiranda'
        });
    }).connect({
        host: credentials.host,
        port: credentials.port,
        username: credentials.username,
        password: credentials.password,
        keepaliveInterval: 100, // keepalive seems to be useless when "read ECONNRESET" occurs.
        keepaliveCountMax: 160
    });
}