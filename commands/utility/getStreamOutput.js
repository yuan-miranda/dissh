import { sshStreamOutputs } from "../../index.js";

/**
 * 
 * @param {string} uid - The user ID for which to get the stream output. 
 * @returns 
 */
export function getStreamOutput(uid) {
    return sshStreamOutputs[uid];
}