import { writeFileSync } from "fs";
import { __dirname } from "../../index.js";

/**
 * 
 * @param {string} uid - The user ID for which to save the credentials.
 * @param {Object} credentials - The credentials object to save for the user. 
 */
export function saveCredentials(uid, credentials) {
    writeFileSync(`${__dirname}/data/credentials/${uid}.json`, JSON.stringify(credentials));
}