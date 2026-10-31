// Creates the MongoDB collections with schema validation and indexes, then loads sample data
// from database/nosql/. WARNING: this drops the existing collections first.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getMongoDb, closeMongo } from '../src/db/mongo.js';

const nosqlDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../database/nosql');
const readJson = async (file) => JSON.parse(await fs.readFile(path.join(nosqlDir, file), 'utf8'));

const collections = await readJson('collections.json');
const seedData = await readJson('seed-data.json');

try {
  const db = await getMongoDb();
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));

  for (const [name, { validator, indexes }] of Object.entries(collections)) {
    if (existing.has(name)) await db.collection(name).drop();
    await db.createCollection(name, { validator });
    for (const { key, options } of indexes) await db.collection(name).createIndex(key, options);

    // JSON has no date type, so dates are stored as strings in the seed file and converted here.
    const docs = (seedData[name] ?? []).map((doc) => ({ ...doc, createdAt: new Date(doc.createdAt) }));
    if (docs.length > 0) await db.collection(name).insertMany(docs);
    console.log(`${name}: ${docs.length} documents`);
  }
  console.log('MongoDB database is ready.');
} finally {
  await closeMongo();
}
