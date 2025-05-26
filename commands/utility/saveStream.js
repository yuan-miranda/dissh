import { sshStreams } from "../../index.js";

export function saveStream(uid, stream) {
    sshStreams[uid] = stream;
}