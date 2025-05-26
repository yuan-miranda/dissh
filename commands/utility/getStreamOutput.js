import { sshStreamOutputs } from "../../index.js";

export function getStreamOutput(uid) {
    return sshStreamOutputs[uid];
}