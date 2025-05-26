import { messageAuthor } from '../../index.js';

/**
 * 
 * @param {string} messageId - The ID of the message for which to save the author.
 * @param {string} authorId - The ID of the author to save for the message. 
 */
export function saveMessageAuthor(messageId, authorId) {
    messageAuthor[messageId] = authorId;
}