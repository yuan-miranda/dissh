import { sshStreams } from "../../index.js";

/**
 * 
 * @param {string} uid - The user ID for which to remove the SSH stream.
 * @param {Object} stream - The SSH stream to save. 
 */
export function saveStream(uid, stream) {
    sshStreams[uid] = stream;
}