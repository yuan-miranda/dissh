import { sshStreamOutputs } from "../../index.js";

export function removeStreamOutput(uid) {
    delete sshStreamOutputs[uid];
}