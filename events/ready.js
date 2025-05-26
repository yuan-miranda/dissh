import { Events, ActivityType } from 'discord.js';
import { schedule } from 'node-cron';
import { saveSessions } from '../commands/utility/saveSessions.js';
import { sshSessions } from '../index.js';
import { InitializeFolders } from '../commands/utility/initializeFolders.js';

export const name = Events.ClientReady;
export async function execute(client) {
    console.log(`${client.user.tag} is online.`);

    client.user.setActivity({
        name: `${Object.keys(sshSessions).length || 0} active session(s)`,
        type: ActivityType.Streaming
    });

    InitializeFolders();

    // every 30 seconds, save the variable to a file
    schedule('*/30 * * * * *', () => {
        saveSessions();
    });
}