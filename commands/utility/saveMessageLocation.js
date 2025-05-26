import { messageLocations } from '../../index.js';

/**
 * 
 * @param {string} messageId - The ID of the message for which to save the location.
 * @param {string} channelId - The ID of the channel where the message is located.
 * @param {string} serverId - The ID of the server where the message is located. 
 */
export function saveMessageLocation(messageId, channelId, serverId) {
    messageLocations[messageId] = { channelId: channelId, serverId: serverId };
}