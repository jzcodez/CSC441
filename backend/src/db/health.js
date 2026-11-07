import { pingMysql } from './mysql.js';
import { pingMongo } from './mongo.js';

// Short, secret-free description of why a database check failed, e.g. "ER_ACCESS_DENIED_ERROR".
const describe = (err) => err.code || err.cause?.code || err.message?.split('\n')[0] || 'unknown error';

// Reports whether each database is reachable, e.g. { mysql: 'up', mongodb: 'down' }.
// Failures are logged with their reason so a misconfigured deployment is easy to diagnose.
export async function checkDatabases() {
  const [mysql, mongodb] = await Promise.allSettled([pingMysql(), pingMongo()]);
  if (mysql.status === 'rejected') console.error(`MySQL check failed: ${describe(mysql.reason)}`);
  if (mongodb.status === 'rejected') console.error(`MongoDB check failed: ${describe(mongodb.reason)}`);
  return {
    mysql: mysql.status === 'fulfilled' ? 'up' : 'down',
    mongodb: mongodb.status === 'fulfilled' ? 'up' : 'down',
  };
}
