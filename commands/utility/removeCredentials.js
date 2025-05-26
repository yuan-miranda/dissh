import { existsSync, unlinkSync } from 'fs';
import { __dirname } from '../../index.js';

export function removeCredentials(uid) {
    if (!existsSync(`${__dirname}/data/credentials/${uid}.json`)) return;
    unlinkSync(`${__dirname}/data/credentials/${uid}.json`);
    return true;
}