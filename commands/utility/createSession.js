import { MessageFlags } from "discord.js";
import ssh2 from "ssh2";
import { disconnectSession } from "../utility/disconnectSession.js";
import { saveCredentials } from "../utility/saveCredentials.js";
import { saveSessions } from "../utility/saveSessions.js";
import { client } from "../../index.js";

export async function createSession(uid, credentials) {
    const session = new ssh2.Client();

    session.on("error", async (err) => {
        if (err.message === "Keepalive timeout" || err.message === "read ECONNRESET") {
            await disconnectSession(uid);
            await client.users.fetch(uid).then(async (user) => user.send({ content: "You have been disconnected from the session.", ephemeral: MessageFlags.Ephemeral }));
        } else if (err.message === "Timed out while waiting for handshake") {
            throw new Error("Session connection timed out. Please try again.");
        } else if (err.message === "getaddrinfo ENOTFOUND") {
            throw new Error("Invalid host. Please check the hostname or IP address.");
        } else if (err.message === "connect ECONNREFUSED") {
            throw new Error("Connection refused. Please check the port number.");
        } else if (err.message === 'All configured authentication methods failed') {
            throw new Error("Invalid password. Please check your credentials.");
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
    }).connect({
        host: credentials.host,
        port: credentials.port,
        username: credentials.username,
        password: credentials.password,
        keepaliveInterval: 100, // keepalive seems to be useless when "read ECONNRESET" occurs.
        keepaliveCountMax: 160
    });
}