import { existsSync, readFileSync } from 'fs';
import { __dirname } from '../../index.js';


export function getCredentials(uid) {
    const dataPath = `${__dirname}/data/credentials/${uid}.json`;
    if (!existsSync(dataPath)) return;
    return JSON.parse(readFileSync(dataPath));
}