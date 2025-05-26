import { saveStream } from './saveStream.js';
import { sshStreams } from '../../index.js';

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