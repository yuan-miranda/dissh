import { messageLocations } from '../../index.js';

export function saveMessageLocation(messageId, channelId, serverId) {
    messageLocations[messageId] = { channelId: channelId, serverId: serverId };
}