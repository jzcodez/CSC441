// Single place where environment variables are read. The rest of the code imports `config`.
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const config = {
  port: Number(process.env.PORT) || 3000,
  // Prints one line per request. On by default; set LOG_REQUESTS=false in .env to hide it.
  logRequests: process.env.LOG_REQUESTS !== 'false',
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'coffee_shop',
    sslCa: process.env.MYSQL_SSL_CA || '',
  },
  mongo: {
    uri: process.env.MONGODB_URI || '',
    dbName: process.env.MONGODB_DB || 'coffee_shop',
  },
};
