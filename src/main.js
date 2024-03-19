const { rejects } = require('assert');
const { connect } = require('http2');
const { resolve } = require('path');

const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

const ssh2 = require('ssh2');
const { exit } = require('process');
const { stream } = require('undici-types');

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
                // console.log('hint: Make sure the host, port, username, and password are correct.');
                // console.log('hint: If its your first time connecting, you may need to enter your credentials manually.')
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
                if (err) {
                    return reject(err);
                }

                stream.on('close', () => {
                    console.log('stream closed');
                    client.end();
                }).on('data', (data) => {
                    console.log(data.toString());
                });

                // execute the command here.
                stream.write(`${command}\n`);

                return resolve('Command executed successfully.');
            })
        } catch (err) {
            return reject(err);
        }
    });
}

// deletes
async function exitShellSession(uid) {
    return new Promise((resolve, reject) => {
        const session = sshSessions.find(session => session.uid === uid);
        if (session) {
            session.client.end();
            sshSessions = sshSessions.filter(session => session.uid !== uid);
            return resolve('SSH session closed successfully.');
        }
        else {
            return reject('Error: No active SSH session found.');
        }
    });
}

function saveShellCredentials(uid, credentials) {
    return writeFile(`${uid}.json`, JSON.stringify(credentials)
        .then(() => 'SSH credentials saved successfully.')
        .catch(err => Promise.reject(err)));
}

function loadShellCredentials(uid) {
    return readFile(`${uid}.json`)
        .then(data => JSON.parse(data))
        .catch(err => Promise.reject(err));
}

function deleteShellCredentials(uid) {
    // convert this similar to saveShellCredentials() and loadShellCredentials()?
    return new Promise((resolve, reject) => {
        const session = sshSessions.find(session => session.uid === uid);
        if (!session) {
            return reject('Error: No saved SSH credentials found.');
        }
        else {
            // delete the credentials in the file.
            unlink(`${uid}.json`).then(() => {
                // delete the credentials in the array.
                exitShellSession(uid).then((result) => {
                    return resolve(result);

                }).catch((err) => {
                    // failed to delete the credentials in the array.
                    return reject(err);
                });

            }).catch((err) => {
                // failed to delete the credentials in the file.
                return reject(err);
            });
        }
    });
}