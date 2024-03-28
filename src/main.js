const fs = require('fs');
const ssh2 = require('ssh2');


// store all the shell session.
// key: uid, value: ssh2.Client()
let shellSessionArray = {};

// store all shell stream.
// key: uid, value: ssh2.Client().shell((stream))
let shellStreamArray = {};

// store all the shell stream final output.
// key: uid, value: string
let shellStreamOutputArray = {};

// store all the messages after /exit was excuted.
// key: message.id, value: message
let oldMessageArray = {};
function saveOldMessage(messageId, message) {
    oldMessageArray[messageId] = message;
}
function loadOldMessage(messageId) {
    return oldMessageArray[messageId];
}
function deleteOldMessage(messageId) {
    delete oldMessageArray[messageId];
}

// store all the messages after /ssh was excuted.
// key: uid, value: message
let activeMessageArray = {};
function saveActiveMessage(uid, message) {
    activeMessageArray[uid] = message;
}
function loadActiveMessage(uid) {
    return activeMessageArray[uid];
}
function deleteActiveMessage(uid) {
    delete activeMessageArray[uid];
}

// store the location of each messages.
// key: message.id, value: { channelId, guildId }
let messageLocationArray = {};
function saveMessageLocation(messageId, channelId, guildId) {
    messageLocationArray[messageId] = { channelId, guildId };
}
function loadMessageLocation(messageId) {
    return messageLocationArray[messageId];
}
function deleteMessageLocation(messageId) {
    delete messageLocationArray[messageId];
}

// store all the message id.
// key: uid, value: message.id
let messageIdArray = {};
function saveMessageId(uid, messageId) {
    if (!messageIdArray[uid]) messageIdArray[uid] = [];
    messageIdArray[uid].push(messageId);
}
function loadMessageId(uid) {
    return messageIdArray[uid];
}
function deleteMessageId(uid, messageId) {
    if (!messageIdArray[uid]) return;
    const index = messageIdArray[uid].indexOf(messageId);
    if (index > -1) messageIdArray[uid].splice(index, 1);
}

// store all the message author.
// key: message.id, value: message.author.id
let messageAuthorArray = {};
function saveMessageAuthor(messageId, authorId) {
    messageAuthorArray[messageId] = authorId;
}
function loadMessageAuthor(messageId) {
    return messageAuthorArray[messageId];
}
function deleteMessageAuthor(messageId) {
    delete messageAuthorArray[messageId];
}

// store all the interaction (still down know if ill use this).
let interactionArray = {};

function createSession(uid, credentials) {
    return new Promise((resolve, reject) => {
        const session = new ssh2.Client();
        
        session.on("error", (err) => {
            return reject(err);
        });

        session.on("ready", () => {
            try {
                saveCredentials(uid, credentials);
                saveSession(uid, session);
                return resolve(session);
            } catch (err) {
                return reject(err);
            }
        }).connect({
            host: credentials.host,
            port: credentials.port,
            username: credentials.username,
            password: credentials.password
        });
    });
}
// hardcode if no credentials in discord part.
// if there is, use this function to connect.
async function connectShellSession(uid, credentials) {
    return new Promise(async (resolve, reject) => {
        let session = loadSession(uid);

        // return immediately if session already exists.
        if (session) return reject("Error: SSH session already exists.");

        // create a new session if not exists.
        try {
            session = await createSession(uid, credentials);
            saveSession(uid, session);
            return resolve(session);
        } catch (err) {
            if (err.message.includes('getaddrinfo ENOTFOUND')) {
                return reject('Error: Invalid IP address.');
            }
            else if (err.message.includes('connect ECONNREFUSED')) {
                return reject('Error: Invalid Port, typically 8022 is used.');
            }
            else if (err.message.includes('All configured authentication methods failed')) {
                return reject('Error: Invalid Username or Password.');
            }
        }
    });
}
function disconnectSession(uid) {
    return new Promise((resolve, reject) => {
        const session = loadSession(uid);
        if (!session) return reject("Error: No saved SSH session found.");

        session.end();
        deleteSession(uid);
        return resolve("SSH session disconnected.");
    });
}

async function executeCommand(uid, command) {
    return new Promise(async (resolve, reject) => {
        const stripAnsi = await import('strip-ansi');
        const session = loadSession(uid);
        let streamOutput = loadStreamOutput(uid) || "";
        let stream;
        let output = "";
        
        if (!session) return reject(new Error("Error: No active SSH session found. Please use /sshd to start a new session."));

        try {
            stream = await loadStream(uid, session)
        } catch (err) {
            return reject(err)
        }

        stream.on("error", (err) => {
            return reject(err);
        });

        stream.on("data", (data) => {
            output += stripAnsi.default(data.toString());
            if (output.length >= 32767) {
                output = output.substring(output.length - 32767);
            }
        })

        stream.write(`${command}\n`);

        setTimeout(() => {
            streamOutput += output;
            if (streamOutput.length >= 32767) {
                streamOutput = streamOutput.substring(streamOutput.length - 32767);
            }
            saveStreamOutput(uid, streamOutput);
            return resolve(streamOutput);
        }, 1000);

    });
}

function saveCredentials(uid, credentials) {
    try {
        fs.writeFileSync(`data/${uid}.json`, JSON.stringify(credentials));
        return true;
    } catch (err) {
        return false;
    }
}
function loadShellCredentials(uid) {
    try {
        const data = fs.readFileSync(`data/${uid}.json`);
        return JSON.parse(data);
    } catch (err) {
        return false;
    }
}
function deleteCredentials(uid) {
    try {
        fs.unlinkSync(`data/${uid}.json`);
        return true;
    } catch (err) {
        return false;
    }
}

function saveSession(uid, session) {
    shellSessionArray[uid] = session;
}
function loadSession(uid) {
    return shellSessionArray[uid];
}
function deleteSession(uid) {
    delete shellSessionArray[uid];
}

function saveStream(uid, stream) {
    shellStreamArray[uid] = stream;
}
function loadStream(uid, session) {
    return new Promise((resolve, reject) => {
        // return resolved immediately if stream already exists.
        if (shellStreamArray[uid]) return resolve(shellStreamArray[uid]);

        // else create a new stream
        session.shell((err, stream) => {
            if (err) return reject(err);
            saveStream(uid, stream);
            return resolve(stream);
        });
    });
}
function deleteStream(uid) {
    delete shellStreamArray[uid];
}

function saveStreamOutput(uid, output) {
    shellStreamOutputArray[uid] = output;
}
function loadStreamOutput(uid) {
    return shellStreamOutputArray[uid];
}
function deleteStreamOutput(uid) {
    delete shellStreamOutputArray[uid];
}

/* ==================================================================================================== */
// The following code is for the Discord bot.

const { Client, GatewayIntentBits, ButtonBuilder, ActionRowBuilder } = require('discord.js');
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
});

client.on('messageCreate', async (message) => {
    
});

client.on('messageDelete', async (message) => {
    try {
        // try to forcibly delete the file lmao.
        fs.unlinkSync(`output/${message.id}.txt`);
        
        const authorId = loadMessageAuthor(message.id);
        if (loadOldMessage(message.id)) {
            deleteOldMessage(message.id);
            deleteMessageLocation(message.id);
            deleteMessageId(authorId, message.id);
        }
        else {
            saveActiveMessage(authorId, null);
            deleteMessageLocation(message.id);
            deleteMessageId(authorId, message.id);
        }
    } catch (err) {
        // ignore this, its just the deferReply being deleted.
        console.log(err.message);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    const { commandName } = interaction;
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const channelId = interaction.channel.id;

    // avoid the bot from responding to itself.
    if (interaction.user.bot) return;

    if (commandName === "sshd") {
        const host = interaction.options.getString('host');
        const port = interaction.options.getInteger('port');
        const username = interaction.options.getString('username');
        const password = interaction.options.getString('password');
        
        await interaction.deferReply({ ephemeral: true });

        try {
            // try to auto login if no credentials provided.
            if (!host && !port && !username && !password) {
                const newCredentials = loadShellCredentials(userId);
                await connectShellSession(userId, newCredentials);
            }

            // if credentials are provided, use it to connect.
            else {
                await connectShellSession(userId, { host, port, username, password });
            }
            await interaction.editReply("SSH session connected.");
        } catch (err) {
            await interaction.editReply(err);
        }
    }

    else if (commandName === "exit") {
        await interaction.deferReply({ ephemeral: true });
        try {
            const status = await disconnectSession(userId);
            deleteStream(userId);
            deleteStreamOutput(userId);
            saveOldMessage(loadActiveMessage(userId).id, loadActiveMessage(userId));
            deleteActiveMessage(userId);
            await interaction.editReply(status);
        } catch (err) {
            await interaction.editReply(err);
        }
    }

    else if (commandName === "purge") {
        await interaction.deferReply({ ephemeral: true });
        if (!deleteCredentials(userId)) {
            await interaction.editReply("Error: No saved credentials found.");
        } else {
            await interaction.editReply("Credentials purged.");
        }
    }

    else if (commandName === "ssh") {
        // currently doesnt place the message at the most recent.
        const command = interaction.options.getString('command');
        
        const button = new ButtonBuilder()
            .setCustomId("text_mode")
            .setLabel("View in Text")
            .setStyle("Primary");

        const row = new ActionRowBuilder().addComponents(button);

        // there's no currently the implementation of the deleted message view in text mode.
        try {
            await interaction.deferReply({ ephemeral: false});
            const result = await executeCommand(userId, command);
            let message;

            // serverA/B-channelA/B
            if (loadActiveMessage(userId)) {
                // channelA
                if (loadMessageLocation(activeMessageArray[userId].id).channelId === channelId) {
                    await interaction.deleteReply();
                    
                    fs.writeFileSync(`output/${activeMessageArray[userId].id}.txt`, result);
                    message = await interaction.fetchReply(loadActiveMessage(userId).id);
                    message = await message.edit({ files: [`output/${message.id}.txt`], components: [row] });

                    saveMessageId(userId, message.id);
                    saveActiveMessage(userId, message);
                    saveMessageLocation(message.id, channelId, guildId);
                }
                // channelB
                else {
                    const oldChannel = client.channels.cache.get(loadMessageLocation(loadActiveMessage(userId).id).channelId);
                    const oldMessage = await oldChannel.messages.fetch(loadActiveMessage(userId).id);
                    await oldMessage.delete();

                    message = await interaction.editReply("loading...");
                    fs.writeFileSync(`output/${message.id}.txt`, result);
                    message = await interaction.editReply({ content: "", files: [`output/${message.id}.txt`], components: [row] });

                    saveMessageId(userId, message.id);
                    saveActiveMessage(userId, message);
                    saveMessageLocation(message.id, channelId, guildId);
                }
            }
            // initial message.
            else {
                message = await interaction.editReply("loading...");
                fs.writeFileSync(`output/${message.id}.txt`, result);
                message = await interaction.editReply({ content: "", files: [`output/${message.id}.txt`], components: [row] });

                saveMessageId(userId, message.id);
                saveActiveMessage(userId, message);
                saveMessageLocation(message.id, channelId, guildId);
            }
            
            // save the userId of the user who run the command.
            saveMessageAuthor(message.id, userId);
        } catch (err) {
            await interaction.editReply(err.message);
        }
    }

    // button interaction.
    else if (interaction.isButton()) {
        if (interaction.customId !== "text_mode") return;

        try {
            await interaction.deferReply({ ephemeral: true });

            // read the content of the message file sent.
            let content = fs.readFileSync(`output/${interaction.message.id}.txt`, 'utf8');

            // limit the content to the last 1900 characters as for the discord token limit.
            if (content.length >= 2000) content = content.substring(content.length - 1900);

            await interaction.editReply({ content: "```bash\n" + content + "```" });
        } catch (err) {
            await interaction.editReply(err.message);
        }
    }
});

client.login(process.env.TOKEN);