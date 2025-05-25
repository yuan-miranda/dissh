import { readdirSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export async function loadEventModules(basePath) {
    const events = [];
    const eventFiles = readdirSync(path.join(basePath, 'events')).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        if (file === 'utility') continue;
        
        const filePath = path.join(basePath, 'events', file);
        const event = await import(pathToFileURL(filePath).toString());

        if ('name' in event && 'execute' in event) {
            events.push(event);
        } else {
            console.warn(`The event at ${filePath} is missing a required "name" or "execute" property.`);
        }
    }

    return events;
}