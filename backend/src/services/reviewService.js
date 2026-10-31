// Reviews live in MongoDB: each review is a self-contained document that is written once and
// read in bulk, and its shape can grow (photos, replies) without schema migrations.
import { getMongoDb } from '../db/mongo.js';
import { getProductById } from './productService.js';
import { HttpError } from '../utils/HttpError.js';

const reviews = async () => (await getMongoDb()).collection('reviews');

const toReview = ({ _id, ...review }) => ({ id: _id.toString(), ...review });

export async function listLatestReviews(limit = 6) {
  const docs = await (await reviews()).find().sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map(toReview);
}

// Returns the reviews for one product plus its average rating, computed by MongoDB's
// aggregation pipeline rather than in JavaScript.
export async function getProductReviews(productId) {
  const collection = await reviews();
  const [docs, [summary]] = await Promise.all([
    collection.find({ productId }).sort({ createdAt: -1 }).toArray(),
    collection
      .aggregate([
        { $match: { productId } },
        { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);
  return {
    average: summary ? Math.round(summary.average * 10) / 10 : null,
    count: summary?.count ?? 0,
    reviews: docs.map(toReview),
  };
}

export async function createReview({ productId, name, rating, comment }) {
  // The two databases can't enforce a foreign key between them, so the code checks it:
  // a review must point at a product that really exists in MySQL.
  const product = await getProductById(productId);
  if (!product) throw new HttpError(400, 'That product does not exist.', { productId: 'Please choose a product from the list.' });

  const review = { productId, productName: product.name, name: name.trim(), rating, comment: comment.trim(), createdAt: new Date() };
  const { insertedId } = await (await reviews()).insertOne(review);
  return toReview({ _id: insertedId, ...review });
}
