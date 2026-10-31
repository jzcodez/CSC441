// Contact messages live in MongoDB: they are independent documents with no relations to other data.
import { getMongoDb } from '../db/mongo.js';

export async function createMessage({ name, email, subject, message }) {
  const doc = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject.trim(),
    message: message.trim(),
    status: 'new',
    createdAt: new Date(),
  };
  const { insertedId } = await (await getMongoDb()).collection('messages').insertOne(doc);
  return { id: insertedId.toString(), createdAt: doc.createdAt };
}
