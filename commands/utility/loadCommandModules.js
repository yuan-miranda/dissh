import { readdirSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * 
 * @param {string} basePath - The base path where the commands are located. 
 * @returns 
 */
export async function loadCommandModules(basePath) {
    const commands = [];
    const commandFolders = readdirSync(path.join(basePath, 'commands'));

    for (const folder of commandFolders) {
        if (folder === 'utility') continue;

        const commandPath = path.join(basePath, 'commands', folder, 'index.js');
        console.log(`Loading commands from: ${commandPath}`);
        
        try {
            const command = await import(pathToFileURL(commandPath).toString());

            if ('data' in command && 'execute' in command) {
                commands.push(command);
            } else {
                console.warn(`The command at ${commandPath} is missing a required "data" or "execute" property.`);
            }
        } catch (error) {
            console.error(error);
        }
    }

    return commands;
}