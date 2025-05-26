import { activeMessages } from "../../index.js";

export function removeActiveMessage(uid) {
    delete activeMessages[uid];
}