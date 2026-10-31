import { pingMysql } from './mysql.js';
import { pingMongo } from './mongo.js';

// Reports whether each database is reachable, e.g. { mysql: 'up', mongodb: 'down' }.
export async function checkDatabases() {
  const [mysql, mongodb] = await Promise.allSettled([pingMysql(), pingMongo()]);
  return {
    mysql: mysql.status === 'fulfilled' ? 'up' : 'down',
    mongodb: mongodb.status === 'fulfilled' ? 'up' : 'down',
  };
}
