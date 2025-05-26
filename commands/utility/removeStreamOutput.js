import { sshStreamOutputs } from "../../index.js";

/**
 * 
 * @param {string} uid - The user ID for which to get the stream output. 
 */
export function removeStreamOutput(uid) {
    delete sshStreamOutputs[uid];
}