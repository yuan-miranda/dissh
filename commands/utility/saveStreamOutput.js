import { sshStreamOutputs } from "../../index.js";

export function saveStreamOutput(uid, output) {
    sshStreamOutputs[uid] = output;
}