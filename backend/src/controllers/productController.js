import * as productService from '../services/productService.js';
import * as reviewService from '../services/reviewService.js';
import { parseId } from './parseId.js';
import { HttpError } from '../utils/HttpError.js';

export async function listCategories(req, res) {
  res.json(await productService.listCategories());
}

export async function listProducts(req, res) {
  const products = await productService.listProducts({
    category: req.query.category,
    featured: req.query.featured === 'true',
  });
  res.json(products);
}

export async function getProduct(req, res) {
  const product = await productService.getProductById(parseId(req.params.id));
  if (!product) throw new HttpError(404, 'Product not found.');
  res.json(product);
}

export async function getProductReviews(req, res) {
  res.json(await reviewService.getProductReviews(parseId(req.params.id)));
}
