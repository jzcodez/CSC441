// MongoDB connection. Connects lazily on first use and retries on the next request if it fails,
// so the site keeps serving MySQL-backed pages even while MongoDB is unreachable.
import { MongoClient } from 'mongodb';
import { config } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

let clientPromise;

function getClient() {
  if (!config.mongo.uri) {
    return Promise.reject(new HttpError(503, 'NoSQL database is not configured (MONGODB_URI is missing).'));
  }
  clientPromise ??= MongoClient.connect(config.mongo.uri, { serverSelectionTimeoutMS: 5000 }).catch((err) => {
    clientPromise = undefined;
    console.error(`MongoDB connection failed: ${err.message}`);
    throw new HttpError(503, 'NoSQL database is currently unavailable.');
  });
  return clientPromise;
}

export async function getMongoDb() {
  const client = await getClient();
  return client.db(config.mongo.dbName);
}

export async function pingMongo() {
  const db = await getMongoDb();
  await db.command({ ping: 1 });
}

export async function closeMongo() {
  if (clientPromise) await (await clientPromise).close();
}
