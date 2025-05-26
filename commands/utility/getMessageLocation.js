import { messageLocations } from "../../index.js";

export function getMessageLocation(messageId) {
    return messageLocations[messageId];
}