import { HttpError } from '../utils/HttpError.js';

// Turns a URL segment like "/products/7" into the number 7, or rejects it with a 400.
export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'Invalid id.');
  return id;
}
