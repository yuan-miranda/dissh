/*
    Note from creator: Currently, dont run any that will indefinitely run a command or output a lot of output message.
    Theres still no issue other than a very long output message that will be stored on my machine. But stil lmao.

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

let sshSessions = [];

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
        const session = sshSessions.find(session => session.uid === uid);
        if (session && session.client) {
            return resolve(session.client);
        }
        return reject('Error: No active SSH session found. Please use /sshd to start a new session.');
    });
}

// connect to an existing SSH session. ?
/*
    uid: the user id of the person who is trying to connect.
    credentials: the credentials to use to connect.
*/
async function connectShellSession(uid, credentials) {
    return new Promise((resolve, reject) => {
        const session = sshSessions.find(session => session.uid === uid);
        // return error if the user has an active SSH session.
        /*
            originally, I intended to just return the session, but I dont like being able to use
            /ssh after /exit, feels like a bug to me. So now, it needs to use /sshd first to start a new session.
        */
        if (session && session.client) {
            return reject('Error: User already has an active SSH session.');
        }

        // else if the user has no active SSH session, create a new one.
        createShellSession(uid, credentials.host, credentials.port, credentials.username, credentials.password).then((client) => {
            sshSessions.push({ uid, client });
            return resolve(client);

        // if the input credentials are wrong, then try to load the credentials from the file and use it to connect.
        }).catch((err) => {
            if (err.message.includes('getaddrinfo ENOTFOUND' && !credentials.host)) {
                return reject('Error: Invalid IP address.');
            }
            else if (err.message.includes('connect ECONNREFUSED')) {
                return reject('Error: Invalid Port, typically 8022 is used.');
            }
            else if (err.message.includes('All configured authentication methods failed')) {
                return reject('Error: Invalid Username or Password.');
            }
            else {
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

// idk what to name the SSH, so its 'client' for now.
async function executeShellCommand(client, command) {
    return new Promise(async (resolve, reject) => {
        const stripAnsi = await import('strip-ansi');

        client.shell((err, stream) => {
            if (err) return reject(err);
            
            let output = '';

            stream.on('close', () => client.end());
            stream.on('data', async (data) => {
                output += stripAnsi.default(data.toString());
                await writeFile('output.txt', output);
                return resolve(output);
            });

            // execute the command here.
            stream.write(`${command}\n`);
            
        });
    });
}

async function exitShellSession(uid) {
    return new Promise((resolve, reject) => {
        const sessionIndex = sshSessions.findIndex(session => session.uid === uid);
        if (sessionIndex == -1) return reject('Error: No active SSH session found.');
        
        sshSessions[sessionIndex].client.end();
        sshSessions.splice(sessionIndex, 1);
        return resolve('SSH session closed successfully.');

    });
}

function saveShellCredentials(uid, credentials) {
    return writeFile(`${uid}.json`, JSON.stringify(credentials))
        .then(() => 'SSH credentials saved successfully.')
        .catch(err => Promise.reject(err));
}

function loadShellCredentials(uid) {
    return readFile(`${uid}.json`)
        .then(data => JSON.parse(data))
        .catch(err => Promise.reject("Error: No SSH credentials found."));
}

function deleteShellCredentials(uid) {
    return unlink(`${uid}.json`)
        .then(() => {
            const sessionIndex = sshSessions.findIndex(session => session.uid === uid);
            if (sessionIndex == -1) return 'Error: No active SSH session found.';

            return exitShellSession(uid)
                .then(() => 'SSH credentials deleted successfully.')
                .catch(err => Promise.reject(err));
        })
        .catch(err => Promise.reject("Error: No SSH credentials found."));
}

/* ==================================================================================================== */
// The following code is for the Discord bot.

const { Client, GatewayIntentBits, DiscordAPIError } = require('discord.js');
const { FileNotFound } = require('discord.js/src/errors/ErrorCodes');
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

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const userId = interaction.user.id;

    if (commandName === 'sshd') {
        const host = interaction.options.getString('host');
        const port = interaction.options.getInteger('port');
        const username = interaction.options.getString('username');
        const password = interaction.options.getString('password');

        connectShellSession(userId, { host, port, username, password }).then((client) => {
            interaction.reply({ content: 'SSH session started successfully.', ephemeral: true });
        }).catch((err) => {
            interaction.reply({ content: err, ephemeral: true });
        });
    }

    else if (commandName === 'exit') {
        exitShellSession(userId).then((result) => {
            interaction.reply(result);
        }).catch((err) => {
            interaction.reply(err);
        });
    }

    else if (commandName === 'purge') {
        deleteShellCredentials(userId).then((result) => {
            interaction.reply(result);
        }).catch((err) => {
            interaction.reply(err);
        });
    }

    else if (commandName === 'ssh') {
        const command = interaction.options.getString('command');

        findShellSession(userId).then((client) => {
            executeShellCommand(client, command).then((result) => {
                interaction.reply(result);
            }).catch((err) => {
                interaction.reply(err);
            });
        }).catch((err) => {
            interaction.reply(err);
        });
    }
});

client.login(process.env.TOKEN);