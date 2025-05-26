import { sshStreams } from "../../index.js";

/**
 * 
 * @param {string} uid - The user ID for which to remove the SSH stream. 
 */
export function removeStream(uid) {
    delete sshStreams[uid];
}