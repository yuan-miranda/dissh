const fs = require('fs');
const ssh2 = require('ssh2');
const cron = require('node-cron');

// possible error messages that can occur on this program.
const programMessageLists = {
    "ALLREADYCONNECTED": "Already connected to the session.",
    "NOCREDENTIALS": "No saved credentials found.",
    "INVALIDHOST": "IP address provided is invalid or does not exist.",
    "INVALIDPORT": "Port number provided is invalid or the session is offline. default port is 22.",
    "INVALIDPASSWORD": "Password provided is invalid.",
    "NOACTIVESESSION": "No active session found.",
    "CONNECTED": "Connected to the session.",
    "DISCONNECTED": "Disconnected from the session.",
    "CREDENTIALDELETED": "Credential deleted.",
    "NORESPONSE": "Session did not respond.",
    "SESSIONTIMEOUT": "Session took too long to connect.",
}

// get the current time.
// YYYY:MM:DD HH:MM:SS
function getCurrentTime() {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

// store the ssh sessions.
// key: uid, value: ssh2.Client()
let sshSessions = {};

// store the ssh connections.
// key: uid, value: ssh2.Client().shell((stream))
let sshStreams = {};

// store the last ssh stream output. (STDOUT)
// key: uid, value: stream.on("data", (data.toString()))
let sshStreamOutputs = {};

// store the message contents after using /exit command.
// key: messageId, value: messageObject
let oldMessages = {};

// store the active message contents. (active ssh sessions)
// key: uid, value: messageObject
let activeMessages = {};

// store the location of the message.
// key: messageId, value: [channelId, serverId]
let messageLocations = {};

// actually, the message is sent by the bot, the use of this is to keep track of the author and the
// active messages that are deleted by the user or the others.
// key: messageId, value: message.author.id
let messageAuthor = {};

function saveVariables() {
    console.log(`${getCurrentTime()} autosaving data.`);
    fs.writeFileSync('./data/sshSessions.json', JSON.stringify(sshSessions));
    fs.writeFileSync('./data/sshStreams.json', JSON.stringify(sshStreams));
    fs.writeFileSync('./data/sshStreamOutputs.json', JSON.stringify(sshStreamOutputs));
    fs.writeFileSync('./data/oldMessages.json', JSON.stringify(oldMessages));
    fs.writeFileSync('./data/activeMessages.json', JSON.stringify(activeMessages));
    fs.writeFileSync('./data/messageLocations.json', JSON.stringify(messageLocations));
    fs.writeFileSync('./data/messageAuthor.json', JSON.stringify(messageAuthor));
}

function loadVariables() {
    console.log(`${getCurrentTime()} loading data`);
    if (fs.existsSync('./data/sshSessions.json')) sshSessions = JSON.parse(fs.readFileSync('./data/sshSessions.json'));
    if (fs.existsSync('./data/sshStreams.json')) sshStreams = JSON.parse(fs.readFileSync('./data/sshStreams.json'));
    if (fs.existsSync('./data/sshStreamOutputs.json')) sshStreamOutputs = JSON.parse(fs.readFileSync('./data/sshStreamOutputs.json'));
    if (fs.existsSync('./data/oldMessages.json')) oldMessages = JSON.parse(fs.readFileSync('./data/oldMessages.json'));
    if (fs.existsSync('./data/activeMessages.json')) activeMessages = JSON.parse(fs.readFileSync('./data/activeMessages.json'));
    if (fs.existsSync('./data/messageLocations.json')) messageLocations = JSON.parse(fs.readFileSync('./data/messageLocations.json'));
    if (fs.existsSync('./data/messageAuthor.json')) messageAuthor = JSON.parse(fs.readFileSync('./data/messageAuthor.json'));
}

function saveMessageAuthor(messageId, authorId) {
    messageAuthor[messageId] = authorId;
}
function getMessageAuthor(messageId) {
    return messageAuthor[messageId];
}
// function removeMessageAuthor(messageId) {
//     delete messageAuthor[messageId];
// }
function saveMessageLocation(messageId, channelId, serverId) {
    messageLocations[messageId] = { channelId: channelId, serverId: serverId };
}
function getMessageLocation(messageId) {
    return messageLocations[messageId];
}
function removeMessageLocation(messageId) {
    delete messageLocations[messageId];
}
function saveCredentials(uid, credentials) {
    fs.writeFileSync(`./data/credentials/${uid}.json`, JSON.stringify(credentials));
}
function getCredentials(uid) {
    if (!fs.existsSync(`./data/credentials/${uid}.json`)) return;
    return JSON.parse(fs.readFileSync(`./data/credentials/${uid}.json`));
}
function removeCredentials(uid) {
    if (!fs.existsSync(`./data/credentials/${uid}.json`)) return;
    fs.unlinkSync(`./data/credentials/${uid}.json`);
    return true;
}
function saveActiveMessage(uid, messageObject) {
    activeMessages[uid] = messageObject;
}
function getActiveMessage(uid) {
    return activeMessages[uid];
}
function removeActiveMessage(uid) {
    delete activeMessages[uid];
}
function saveOldMessage(messageId, messageObject) {
    oldMessages[messageId] = messageObject;
}
function getOldMessage(messageId) {
    return oldMessages[messageId];
}
function removeOldMessage(messageId) {
    delete oldMessages[messageId];
}
function saveStreamOutput(uid, output) {
    sshStreamOutputs[uid] = output;
}
function getStreamOutput(uid) {
    return sshStreamOutputs[uid];
}
function removeStreamOutput(uid) {
    delete sshStreamOutputs[uid];
}
function saveStream(uid, stream) {
    sshStreams[uid] = stream;
}
async function getStream(uid, session) {
    return new Promise((resolve, reject) => {
        if (sshStreams[uid]) return resolve(sshStreams[uid]);
        session.shell((err, stream) => {
            if (err) return reject(err);
            saveStream(uid, stream);
            return resolve(stream);
        });
    });
}
function removeStream(uid) {
    delete sshStreams[uid];
}
function saveSession(uid, session) {
    sshSessions[uid] = session;
}
function getSession(uid) {
    return sshSessions[uid];
}
function removeSession(uid) {
    delete sshSessions[uid];
}


// manage the ssh connections.
async function createSession(uid, credentials) {
    return new Promise((resolve, reject) => {
        const session = new ssh2.Client();
        session.on("error", async (err) => {
            if (err.message === "Keepalive timeout" || err.message === "read ECONNRESET") {
                await disconnectSession(uid);
                await client.users.fetch(uid).then(async (user) => user.send({ content: programMessageLists["DISCONNECTED"], ephemeral: true}));
            }
            else if (err.message === "Timed out while waiting for handshake") return reject(new Error(programMessageLists["SESSIONTIMEOUT"]));
            else if (err.message === "getaddrinfo ENOTFOUND") return reject(new Error(programMessageLists["INVALIDHOST"]));
            else if (err.message === "connect ECONNREFUSED") return reject(new Error(programMessageLists["INVALIDPORT"]));
            else if (err.message === 'All configured authentication methods failed') return reject(new Error(programMessageLists["INVALIDPASSWORD"]));
            else return reject(err);
        });
        session.on("end", async () => { await client.users.fetch(uid).then(async (user) => user.send(programMessageLists["DISCONNECTED"])); });
        session.once("ready", () => {
            saveSession(uid, session);
            saveCredentials(uid, credentials);
            return resolve(session);
        }).connect({
            host: credentials.host,
            port: credentials.port,
            username: credentials.username,
            password: credentials.password,
            keepaliveInterval: 100, // keepalive seems to be useless when "read ECONNRESET" occurs.
            keepaliveCountMax: 160
        });
    })
}
async function connectSession(uid, credentials) {
    return new Promise(async (resolve, reject) => {
        if (getSession(uid)) return reject(new Error(programMessageLists["ALLREADYCONNECTED"]));
        if (!credentials) return reject(new Error(programMessageLists["NOCREDENTIALS"]));
        try {
            const newSession = await createSession(uid, credentials);

            client.user.setActivity(`${Object.keys(sshSessions).length || 0} active session(s)`);
            client.users.fetch(uid).then(async (user) => console.log(`${getCurrentTime()} ${user.tag} connected to the session.`));

            saveSession(uid, newSession);
            return resolve(newSession);
        } catch (err) { return reject(err); }
    });
}
async function disconnectSession(uid) {
    return new Promise(async (resolve, reject) => {
        const session = getSession(uid);
        if (!session) return reject(new Error(programMessageLists["NOACTIVESESSION"]));
        session.end();
        removeSession(uid);
        removeStream(uid);
        removeStreamOutput(uid);

        client.user.setActivity(`${Object.keys(sshSessions).length || 0} active session(s)`);
        client.users.fetch(uid).then(async (user) => console.log(`${getCurrentTime()} ${user.tag} disconnected from the session.`));
        
        if (getActiveMessage(uid)) {
            saveOldMessage(getActiveMessage(uid).id, getActiveMessage(uid));
            removeActiveMessage(uid);
        }
        return resolve();
    });
}

// execute the command in the ssh session.
async function executeCommand(uid, command) {
    return new Promise(async (resolve, reject) => {
        const stripAnsi = await import('strip-ansi');
        const session = getSession(uid);
        if (!session) return reject(new Error(programMessageLists["NOACTIVESESSION"]));
        let streamOutput = getStreamOutput(uid) || "";
        let stream;
        let outputStream = "";
        let timeout;

        try { stream = await getStream(uid, session);
        } catch (err) { return reject(err); }

        stream.on("error", (err) => { return reject(err); });
        stream.on("data", (data) => {
            clearTimeout(timeout);
            outputStream += stripAnsi.default(data.toString());
        });
        if (command) stream.write(`${command}\n`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // set a delay of 5 seconds to wait for the response. If no response is received, the program will
        // assume that the session did not respond. This might also be followed by the session being offline
        // if the session did not respond to the keepaliveInterval.
        try {
            await new Promise((resolve, reject) => {
                // this will be omitted if the session did not respond and didnt throw "read ECONNRESET".
                if (outputStream.length === 0) timeout = setTimeout(() => { reject(new Error(programMessageLists["NORESPONSE"])); }, 5000);
                else resolve();
            })
        } catch (err) { return reject(err); }

        streamOutput += outputStream;
        if (streamOutput.length >= 32767) streamOutput = streamOutput.substring(streamOutput.length - 32767);
        saveStreamOutput(uid, streamOutput);
        return resolve(streamOutput);
    });
}

function InitializeFolders() {
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    if (!fs.existsSync('./data/credentials')) fs.mkdirSync('./data/credentials');
    if (!fs.existsSync('./data/command_logs')) fs.mkdirSync('./data/command_logs');
}

/* ==================================================================================================== */
// The following code is for the Discord bot.

const { Client, GatewayIntentBits, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`${client.user.tag} is online.`);
    client.user.setActivity(`${Object.keys(sshSessions).length || 0} active session(s)`);
    
    InitializeFolders();
    loadVariables();

    // evry 1 minute, save the variables.
    cron.schedule("*/1 * * * *", () => { saveVariables(); });
});

client.on('messageCreate', async (message) => {
});

client.on("messageDelete", async (message) => {
    if (!fs.existsSync(`./data/command_logs/${message.id}.txt`)) return;
    fs.unlinkSync(`./data/command_logs/${message.id}.txt`);
    const uid = getMessageAuthor(message.id);
    if (getOldMessage(message.id)) {
        removeOldMessage(message.id);
        removeMessageLocation(message.id);
    }
    else {
        saveActiveMessage(uid, null);
        removeMessageLocation(message.id);
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    const { commandName, options } = interaction;
    const uid = interaction.user.id;
    const channelId = interaction.channel.id;
    const serverId = interaction.guild.id;

    // avoid the bot from responding to itself.
    if (interaction.user.bot) return;

    if (commandName === "sshd") {
        await interaction.deferReply({ ephemeral: true });
        const host = options.getString("host");
        const port = options.getInteger("port");
        const username = options.getString("username");
        const password = options.getString("password");

        try {
            // use auto login if no credentials provided.
            if (!host || !port || !username || !password) await connectSession(uid, getCredentials(uid));
            else await connectSession(uid, { host, port, username, password });
            await interaction.editReply(programMessageLists["CONNECTED"]);
        } catch (err) { await interaction.editReply(err.message); }
    }
    else if (commandName === "ssh") {
        const command = options.getString("command");
        const button = new ButtonBuilder()
            .setCustomId("text_view")
            .setLabel("View in Text")
            .setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder().addComponents(button);

        try {
            await interaction.deferReply({ ephemeral: false });
            const result = await executeCommand(uid, command);
            let activeMessage = getActiveMessage(uid);
            let oldMessage;
            let message;

            // check if the user has an active message, then replace the message if exists.
            if (getActiveMessage(uid)) {
                // check if the message is in the same channel.
                if (getMessageLocation(activeMessage.id).channelId === channelId) {
                    oldMessage = await interaction.fetchReply(activeMessage.id);
                    oldMessage.delete();
                }
                // different channel, fetch the message from the channel, then replace it into the new channel.
                else {
                    oldMessage = client.channels.cache.get(getMessageLocation(activeMessage.id).channelId);
                    oldMessage = await oldMessage.messages.fetch(activeMessage.id);
                    oldMessage.delete();
                }
            }
            message = await interaction.editReply("loading...");
            fs.writeFileSync(`./data/command_logs/${message.id}.txt`, result);
            message = await interaction.editReply({ content: "", files: [`./data/command_logs/${message.id}.txt`], components: [row] });

            saveActiveMessage(uid, message);
            saveMessageLocation(message.id, channelId, serverId);
            saveMessageAuthor(message.id, uid);
        } catch (err) { await interaction.editReply(err.message); }
    }
    else if (commandName === "exit") {
        await interaction.deferReply({ ephemeral: true });
        try {
            await disconnectSession(uid);
            await interaction.editReply(programMessageLists["DISCONNECTED"]);
        } catch (err) { await interaction.editReply(err.message); }
    }
    else if (commandName === "purge") {
        await interaction.deferReply({ ephemeral: true });
        if (!removeCredentials(uid)) await interaction.editReply(programMessageLists["NOCREDENTIALS"])
        else await interaction.editReply(programMessageLists["CREDENTIALDELETED"]);
    }
    else if (interaction.isButton()) {
        if (!interaction.customId === "text_view") return;
        try {
            await interaction.deferReply({ ephemeral: true });
            let content = fs.readFileSync(`./data/command_logs/${interaction.message.id}.txt`, "utf-8");

            // limit the content to the last 1900 characters due to the discord send limit.
            if (content.length >= 2000) content = content.substring(content.length - 1900);
            await interaction.editReply({ content: `\`\`\`bash\n${content}\n\`\`\``});
        } catch (err) { await interaction.editReply(err.message); }
    }
});

client.login(process.env.TOKEN);