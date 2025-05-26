import { writeFileSync } from "fs";
import { __dirname } from "../../index.js";

export function saveCredentials(uid, credentials) {
    writeFileSync(`${__dirname}/data/credentials/${uid}.json`, JSON.stringify(credentials));
}