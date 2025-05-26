import { messageAuthor } from '../../index.js';

export function saveMessageAuthor(messageId, authorId) {
    messageAuthor[messageId] = authorId;
}