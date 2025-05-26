import { saveStream } from './saveStream.js';
import { sshStreams } from '../../index.js';

/**
 * 
 * @param {string} uid - The user ID for which to get the SSH stream.
 * @param {import('ssh2').Client} session - The SSH session object. 
 * @returns 
 */
export async function getStream(uid, session) {
    if (sshStreams[uid]) return sshStreams[uid];

    return new Promise((resolve, reject) => {
        session.shell((err, stream) => {
            if (err) return reject(err);
            saveStream(uid, stream);
            resolve(stream);
        });
    });
}