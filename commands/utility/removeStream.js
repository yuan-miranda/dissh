import { sshStreams } from "../../index.js";

export function removeStream(uid) {
    delete sshStreams[uid];
}