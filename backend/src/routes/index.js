// All API routes, mounted under /api in app.js.
// Express 5 forwards errors from async handlers to the error handler automatically.
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { validateOrder, validateReview, validateContact } from '../validators/index.js';
import { checkDatabases } from '../db/health.js';
import * as products from '../controllers/productController.js';
import * as orders from '../controllers/orderController.js';
import * as reviews from '../controllers/reviewController.js';
import * as contact from '../controllers/contactController.js';

const router = Router();

router.get('/health', async (req, res) => {
  const databases = await checkDatabases();
  const healthy = Object.values(databases).every((status) => status === 'up');
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', databases });
});

// MySQL-backed
router.get('/categories', products.listCategories);
router.get('/products', products.listProducts);
router.get('/products/:id', products.getProduct);
router.post('/orders', validate(validateOrder), orders.createOrder);

// MongoDB-backed
router.get('/products/:id/reviews', products.getProductReviews);
router.get('/reviews', reviews.listLatestReviews);
router.post('/reviews', validate(validateReview), reviews.createReview);
router.post('/contact', validate(validateContact), contact.createMessage);

export default router;
