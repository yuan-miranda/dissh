import { getCredentials } from '../utility/getCredentials.js';
import { connectSession } from '../utility/connectSession.js';

/**
 * 
 * @param {string} uid - The user ID for which to auto-connect the session. 
 */
export async function autoConnectSession(uid) {
    await connectSession(uid, getCredentials(uid));
}