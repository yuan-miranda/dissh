import { existsSync, unlinkSync } from 'fs';
import { __dirname } from '../../index.js';

/**
 * 
 * @param {string} uid - The user ID for which to remove the credentials. 
 * @returns 
 */
export function removeCredentials(uid) {
    if (!existsSync(`${__dirname}/data/credentials/${uid}.json`)) return;
    unlinkSync(`${__dirname}/data/credentials/${uid}.json`);
    return true;
}