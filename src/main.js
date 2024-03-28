/*
    Note from creator: Currently, dont run any that will indefinitely run a command and outputs
    a lot of text. This is because the bot will only output the last 32767 characters of the output in file mode,
    but only the last 1900 characters in text mode.

    Some commands that I recomment to refrain from using:
    - cmatrix
    - your mom's weight
    - htop ?
    - any command that will output a lot of text.
*/

const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);
const ssh2 = require('ssh2');

let sshSessions = {};
let sshStreams = {};
let interactionStreams = {};
let lastBotMessage = {};
let lastBotMessageNotDeleted = {};
let lastOutputStream = {};

// key: message id, value: { guildId, channelId }
let messageLocationStreams = {};

// create a new SSH session.
async function createShellSession(uid, host, port, username, password) {
    return new Promise((resolve, reject) => {
        const shell = new ssh2.Client();

        shell.on('error', (err) => {
            return reject(err);
        })

        shell.on('ready', () => {
            // save the credentials.
            saveShellCredentials(uid, { host, port, username, password }).then(() => {
                return resolve(shell);
            }).catch((err) => {
                return reject(err);
            });
        }).connect({
            host,
            port,
            username,
            password
        });
    });
}

// connect shell session by uid and credentials
async function findShellSession(uid) {
    return new Promise((resolve, reject) => {
        const session = sshSessions[uid];
        if (session) {
            return resolve(session);
        }
        return reject('Error: No active SSH session found. Please use /sshd to start a new session.');
    });
}

/*
    uid: the user id of the person who is trying to connect.
    credentials: the credentials to use to connect.
*/
async function connectShellSession(uid, credentials) {
    return new Promise((resolve, reject) => {
        const session = sshSessions[uid];
        // return error if the user has an active SSH session.
        /*
            originally, I intended to just return the session, but I dont like being able to use
            /ssh after /exit, feels like a bug to me. So now, it needs to use /sshd first to start a new session.
        */
        if (session) {
            return reject('Error: User already has an active SSH session.');
        }

        // else if the user has no active SSH session, create a new one.
        createShellSession(uid, credentials.host, credentials.port, credentials.username, credentials.password).then((shell) => {
            sshSessions[uid] = shell;
            return resolve(shell);

        // if the input credentials are wrong, then try to load the credentials from the file and use it to connect.
        }).catch((err) => {
            if (err.message.includes('getaddrinfo ENOTFOUND')) {
                return reject('Error: Invalid IP address.');
            }
            else if (err.message.includes('connect ECONNREFUSED')) {
                return reject('Error: Invalid Port, typically 8022 is used.');
            }
            else if (err.message.includes('All configured authentication methods failed')) {
                return reject('Error: Invalid Username or Password.');
            }
            else {
                if (credentials.host && credentials.port && credentials.username && credentials.password) {
                    return reject('Error: SSH specified might not exist or is not accessible.');
                }
                loadShellCredentials(uid).then((credentials) => {
                    connectShellSession(uid, credentials).then((shell) => {
                        return resolve(shell);
                    }).catch((err) => {
                        return reject(err);
                    });

                // else, error.
                }).catch((err) => {
                    return reject(err);
                });    
            }
        });
    });
}

async function executeShellCommand(uid, command) {
    return new Promise(async (resolve, reject) => {
        const stripAnsi = await import('strip-ansi');
        const shell = sshSessions[uid];

        let output = '';

        if (!sshStreams[uid]) {
            sshStreams[uid] = await new Promise((resolve, reject) => {
                shell.shell((err, stream) => {
                    if (err) return reject(err);
                    return resolve(stream);
                });
            });
        }

        const stream = sshStreams[uid];

        stream.on('data', (data) => {
            output += stripAnsi.default(data.toString());
            if (output.length >= 32767) {
                output = output.substring(output.length - 32767);
            }
        });

        // execute the command here.
        stream.write(`${command}\n`);

        setTimeout(() => {
            lastOutputStream[uid] += output;
            if (lastOutputStream[uid].length >= 32767) {
                lastOutputStream[uid] = lastOutputStream[uid].substring(lastOutputStream[uid].length - 32767);
            }
            return resolve(lastOutputStream[uid]);
        }, 2000);
    });
}

async function exitShellSession(uid) {
    return new Promise((resolve, reject) => {
        const session = sshSessions[uid];
        if (!session) return reject('Error: No active SSH session found.');
        
        session.end();
        delete sshSessions[uid];
        delete sshStreams[uid];
        return resolve('SSH session closed successfully.');

    });
}

function saveShellCredentials(uid, credentials) {
    return writeFile(`data/${uid}.json`, JSON.stringify(credentials))
        .then(() => 'SSH credentials saved successfully.')
        .catch(err => Promise.reject(err));
}

function loadShellCredentials(uid) {
    return readFile(`data/${uid}.json`)
        .then(data => JSON.parse(data))
        .catch(err => Promise.reject("Error: No saved SSH credentials found."));
}

function deleteShellCredentials(uid) {
    return unlink(`data/${uid}.json`)
        .then(() => {
            const session = sshSessions[uid];
            if (session) {
                session.end();
                delete sshSessions[uid];
                delete sshStreams[uid];
            }
            return 'SSH credentials deleted successfully.';
        })
        .catch(err => Promise.reject('Error: No saved SSH credentials found.'));
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

client.once("ready", () => {
    console.log("client is online.");
});

client.on("messageCreate", async (message) => {
});

client.on('messageDelete', async (message) => {
    try {
        await unlink(`output/${message.id}.txt`);
        if (lastBotMessageNotDeleted[message.id]) {
            console.log("deleted old " + message.id);
            delete messageLocationStreams[lastBotMessageNotDeleted[uid].id];
            delete lastBotMessageNotDeleted[message.id];
        }
        
        else if (lastBotMessage[interactionStreams[message.id]]) {
            console.log("deleted new " + message.id);
            delete messageLocationStreams[lastBotMessage[uid].id];
            lastBotMessage[interactionStreams[message.id]] = null;
        }
    } catch (err) {} // do nothing, this only occurs when updating the message.
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    const { commandName } = interaction;
    const uid = interaction.user.id;
    const guild = interaction.guild;
    const channel = interaction.channel;

    // avoid the bot from responding to itself.
    if (interaction.user.bot) return;

    if (commandName === 'sshd') {
        const host = interaction.options.getString('host');
        const port = interaction.options.getInteger('port');
        const username = interaction.options.getString('username');
        const password = interaction.options.getString('password');
        
        await interaction.deferReply({ ephemeral: true });

        connectShellSession(uid, { host, port, username, password }).then((client) => {
            interaction.editReply('SSH session started successfully.');
        }).catch((err) => {
            interaction.editReply(err);
        });
    }

    else if (commandName === 'exit') {
        exitShellSession(uid).then( async (result) => {
            lastBotMessageNotDeleted[lastBotMessage[uid].id] = lastBotMessage[uid];
            messageLocationStreams[lastBotMessageNotDeleted[uid].id] = { guildId: guild.id, channelId: channel.id };
            await writeFile(`output/${lastBotMessage[uid].id}.txt`, lastOutputStream[uid]);
            
            delete lastOutputStream[uid];
            delete lastBotMessage[uid];
            interaction.reply({ content: result, ephemeral: true });
        }).catch((err) => {
            interaction.reply({ content: err, ephemeral: true });
        });
    }

    else if (commandName === 'purge') {
        deleteShellCredentials(uid).then((result) => {
            interaction.reply({ content: result, ephemeral: true });
        }).catch((err) => {
            interaction.reply({ content: err, ephemeral: true });
        });
    }

    else if (commandName === 'ssh') {
        const command = interaction.options.getString('command');
        
        const viewInText = new ButtonBuilder()
            .setCustomId('view_in_text')
            .setLabel('View in Text')
            .setStyle('Primary');
        
        const row = new ActionRowBuilder().addComponents(viewInText);

        findShellSession(uid).then(async (shell) => {
            sshSessions[uid] = shell;
            try {
                await interaction.deferReply();
                let result = await executeShellCommand(uid, command);

                // TODO
                // doesnt work when in another server or channel, obv because of
                // different message id, anyway but ill still fix it.


                // user executed the command in serverA-channelA, then user move to serverA-channelB
                // in serverA=channelA, store the messageLocationStreams[message.id] = { guildId: guild.id, channelId: channel.id }

                // in serverA=channelB, delete the old message and file for it then, write on the new channel, store its informations.
                // delete the messageLocationStreams[message.id], then create a new one with the updated values.

                // note: comparing message ID is potentially used here.
                // the bot can delete messages anywhere as long as it has a messageId: guildId, channelId

                // if user changes server, serverB-channelA delete the old message from the old server, delete the messageLocationStreams[message.id]
                // then make a new messageLocationStreams with the updated value. vice versa.

                // same server interaction but different channel.
                if (lastBotMessage[uid] && messageLocationStreams[lastBotMessage[uid].id]) {
                    const guildId = messageLocationStreams[lastBotMessage[uid].id].guildId;
                    const channelId = messageLocationStreams[lastBotMessage[uid].id].channelId;
                    // same channel interaction.

                    if (guildId === guild.id && channelId === channel.id) {
                        await interaction.deleteReply();
                        await writeFile(`output/${lastBotMessage[uid].id}.txt`, result);
                        const message = await interaction.fetchReply(lastBotMessage[uid].id);
                        await message.edit({ files: [`output/${lastBotMessage[uid].id}.txt`], components: [row]});
                    }

                    // different channel interaction.
                    else if (guildId === guild.id && channelId !== channel.id) {

                        const oldChannel = client.channels.cache.get(channelId);

                        oldChannel.messages.fetch(lastBotMessage[uid].id)
                            .then(async (message) => {
                                
                                await writeFile("output/placeholder.txt", result);
                                const newMessage = await interaction.editReply({ files: ["output/placeholder.txt"], components: [row]});
                                await unlink("output/placeholder.txt");
                                await writeFile(`output/${newMessage.id}.txt`, result);

                                // delete messageLocationStreams[lastBotMessage[uid].id];
                                await message.delete();
                                delete lastBotMessage[uid];
                                lastBotMessage[uid] = newMessage;
                                messageLocationStreams[lastBotMessage[uid].id] = { guildId: guild.id, channelId: channel.id };
                            }).catch((err) => {
                                console.log(err);
                            });
                    }
                }
                else {
                    await writeFile("output/placeholder.txt", result);
                    lastBotMessage[uid] = await interaction.editReply({ files: ["output/placeholder.txt"], components: [row]});
                    await unlink("output/placeholder.txt");
                    await writeFile(`output/${lastBotMessage[uid].id}.txt`, result);
                    messageLocationStreams[lastBotMessage[uid].id] = { guildId: guild.id, channelId: channel.id };
                }

                // do the vice versa, also examine how messages nad obj are deleted.

                
                interactionStreams[lastBotMessage[uid].id] = uid;

            } catch (err) {
                interaction.editReply({ content: err.toString(), ephemeral: true });
            }
        }).catch((err) => {
            interaction.reply({ content: err, ephemeral: true });
        });
    }

    else if (interaction.isButton()) {
        if (interaction.customId === 'view_in_text') {
            try {
                await interaction.deferReply({ ephemeral: true });
                let content;

                if (lastBotMessageNotDeleted[interaction.message.id]) {
                    content = await readFile(`output/${interaction.message.id}.txt`, 'utf-8');
                } else {
                    content = await readFile(`output/${interaction.message.id}.txt`, 'utf-8');
                }
                
                if (content.length >= 2000) {
                    content = content.substring(content.length - 1900);
                }

                await interaction.editReply({ content: "```" + content + "```"});
            } catch (err) {
                interaction.editReply({ content: err.toString()});
            }
        }
    }
});

client.login(process.env.TOKEN);