/**
 * 
 * @returns {string} - The current date and time in the format YYYY-MM-DD HH:MM:SS.
 */
export function getCurrentTime() {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}