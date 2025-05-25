import { Events, ActivityType } from 'discord.js';
import { schedule } from 'node-cron';
import { saveSessions, sshSessions } from '../app.js';

export const name = Events.ClientReady;
export async function execute(client) {
    console.log(`${client.user.tag} is online.`);

    client.user.setActivity({
        name: `${Object.keys(sshSessions).length || 100} active session(s)`,
        type: ActivityType.Streaming
    });

    // every 30 seconds, save the variable to a file
    schedule('*/30 * * * * *', () => {
        saveSessions();
    });
}