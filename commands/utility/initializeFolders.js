import { existsSync, mkdirSync } from 'fs';

/**
 * 
 */
export function initializeFolders() {
    if (!existsSync('data')) mkdirSync('data');
    if (!existsSync('data/credentials')) mkdirSync('data/credentials');
    if (!existsSync('data/messages')) mkdirSync('data/messages');
}