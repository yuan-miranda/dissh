import { activeMessages } from "../../index.js";

export function saveActiveMessage(uid, messageObject) {
    activeMessages[uid] = messageObject;
}