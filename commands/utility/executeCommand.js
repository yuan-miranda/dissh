import { getSession } from './getSession.js';
import { getStreamOutput } from './getStreamOutput.js';
import { getStream } from './getStream.js';
import { saveStreamOutput } from './saveStreamOutput.js';

export async function executeCommand(uid, command) {
    const stripAnsi = await import('strip-ansi');
    const session = getSession(uid);
    if (!session) throw new Error("No active session found.");

    let streamOutput = getStreamOutput(uid) || "";
    let stream;
    let outputStream = "";
    let timeout;

    try {
        stream = await getStream(uid, session);
    } catch (err) {
        throw new Error(err.message);
    }

    stream.on("error", (err) => {
        throw new Error(err.message);
    });
    stream.on("data", (data) => {
        clearTimeout(timeout);
        outputStream += stripAnsi.default(data.toString());
    });

    if (command) stream.write(`${command}\n`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        await new Promise((resolve, reject) => {
            if (outputStream.length === 0) {
                timeout = setTimeout(() => {
                    reject(new Error("No response received from the session."));
                }, 5000);
            } else {
                resolve();
            }
        });
    } catch (err) {
        throw new Error(err.message);
    }

    streamOutput += outputStream;
    if (streamOutput.length >= 32767) {
        streamOutput = streamOutput.substring(streamOutput.length - 32767);
    }
    saveStreamOutput(uid, streamOutput);
    return streamOutput;
}