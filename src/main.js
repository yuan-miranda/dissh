const { rejects } = require('assert');
const { connect } = require('http2');
const { resolve } = require('path');
const { exit } = require('process');
const { stream } = require('undici-types');

const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

const ssh2 = require('ssh2');


let sshSessions = [];

// create a new SSH session.
async function createShellSession(host, port, username, password) {
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

// connect or create a new SSH session.
/*
    uid: the user id of the person who is trying to connect.
    credentials: the credentials to use to connect.
*/
async function connectShellSession(uid, credentials) {
    return new Promise((resolve, reject) => {
        const session = sshSessions.find(session => session.uid === uid);
        if (!session || !session.client) {
            createShellSession(credentials.host, credentials.port, credentials.username, credentials.password).then((client) => {
                sshSessions.push({ uid, client });
                return resolve(client);

            }).catch((err) => {
                return reject(err);
            });
        } else {
            return resolve(session.client);
        }
    });
}


async function executeShellCommand(uid, command) {
    return new Promise(async (resolve, reject) => {
        let credentials;

        try {
            credentials = await loadShellCredentials(uid);
        } catch (err) {
            return reject(err);
        }
        
        try {
            const client = await connectShellSession(uid, credentials);
            
            client.shell((err, stream) => {
                if (err) return reject(err);

                stream.on('close', () => client.end());
                stream.on('data', (data) => console.log(data.toString()) );

                // execute the command here.
                stream.write(`${command}\n`);

                return resolve('Command executed successfully.');
            })
        } catch (err) {
            return reject(err);
        }
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
        .catch(err => Promise.reject(err));
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
        .catch(err => Promise.reject(err));
}