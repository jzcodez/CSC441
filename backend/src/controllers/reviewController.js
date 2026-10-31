import * as reviewService from '../services/reviewService.js';

export async function listLatestReviews(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 50);
  res.json(await reviewService.listLatestReviews(limit));
}

export async function createReview(req, res) {
  const review = await reviewService.createReview(req.body);
  res.status(201).json(review);
}
