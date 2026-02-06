/**
 * Deletes all users from the database so you can sign up again with any email.
 * Run: node db/clear-users.js (from backend folder)
 */
import db from './index.js';

const result = db.prepare('DELETE FROM users').run();
console.log('Cleared', result.changes, 'user(s) from the database. You can sign up again.');
process.exit(0);
