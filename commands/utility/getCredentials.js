import { existsSync, readFileSync } from 'fs';
import { __dirname } from '../../index.js';

/**
 * 
 * @param {string} uid - The user ID for which to get the credentials.
 * @returns 
 */
export function getCredentials(uid) {
    const dataPath = `${__dirname}/data/credentials/${uid}.json`;
    if (!existsSync(dataPath)) return;
    return JSON.parse(readFileSync(dataPath));
}