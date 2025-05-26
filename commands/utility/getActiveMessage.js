import { activeMessages } from "../../index.js";

export function getActiveMessage(uid) {
    return activeMessages[uid];
}