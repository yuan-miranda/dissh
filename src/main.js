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

// create a new SSH session.
async function createShellSession(uid, host, port, username, password) {
    return new Promise((resolve, reject) => {
        const client = new ssh2.Client();

        client.on('error', (err) => {
            return reject(err);
        })

        client.on('ready', () => {
            // save the credentials.
            saveShellCredentials(uid, { host, port, username, password }).then(() => {
                return resolve(client);
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
        createShellSession(uid, credentials.host, credentials.port, credentials.username, credentials.password).then((client) => {
            sshSessions[uid] = client;
            return resolve(client);

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
                    connectShellSession(uid, credentials).then((client) => {
                        return resolve(client);
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
        const client = sshSessions[uid];

        let output = '';

        if (!sshStreams[uid]) {
            sshStreams[uid] = await new Promise((resolve, reject) => {
                client.shell((err, stream) => {
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
    for (let uid in lastBotMessage) {

        // TODO
        // other users can also delete the message.
        // fix this later.

        if (lastBotMessage[uid].id === message.id) {
            lastBotMessage[uid] = null;
            break;
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    const { commandName } = interaction;
    const uid = interaction.user.id;

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

        findShellSession(uid).then(async (client) => {
            sshSessions[uid] = client;
            try {
                await interaction.deferReply();
                let result = await executeShellCommand(uid, command);

                if (lastBotMessage[uid]) {
                    await lastBotMessage[uid].delete();
                }

                // TODO
                // currently will create a new file for each command, it would not overwrite the previous file.
                // fix this later.

                // placeholder file to be sent to the user.
                await writeFile("output/placeholder.txt", result);
                
                lastBotMessage[uid] = await interaction.editReply({ files: ["output/placeholder.txt"], components: [row]});
                
                // delete the placeholder file after sending it to the user and make the actual file.
                await unlink("output/placeholder.txt");
                await writeFile(`output/${lastBotMessage[uid].id}.txt`, result);
                
                // key-val pair of the message id and the user id for the correct button interaction.
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