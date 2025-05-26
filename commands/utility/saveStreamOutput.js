import { sshStreamOutputs } from "../../index.js";

/**
 * 
 * @param {string} uid - The user ID for which to get the stream output.
 * @param {string} output - The output to save for the SSH stream. 
 */
export function saveStreamOutput(uid, output) {
    sshStreamOutputs[uid] = output;
}