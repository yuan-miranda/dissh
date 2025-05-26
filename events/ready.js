import { Events, ActivityType } from 'discord.js';
import { schedule } from 'node-cron';
import { saveSessions } from '../commands/utility/saveSessions.js';
import { sshSessions } from '../index.js';
import { initializeFolders } from '../commands/utility/initializeFolders.js';

export const name = Events.ClientReady;
export async function execute(client) {
    console.log(`${client.user.tag} is online.`);

    client.user.setActivity({
        name: `${Object.keys(sshSessions).length || 0} active session(s)`,
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/yuanezekielamiranda'
    });

    initializeFolders();

    // every 30 seconds, save the variable to a file
    schedule('*/30 * * * * *', () => {
        saveSessions();
    });
}