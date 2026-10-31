import { HttpError } from '../utils/HttpError.js';

// Runs a validator on the request body before the controller sees it.
// Validators return an object of { field: message } for every problem found.
export const validate = (validator) => (req, res, next) => {
  const errors = validator(req.body ?? {});
  if (Object.keys(errors).length > 0) {
    return next(new HttpError(400, 'Please correct the highlighted fields.', errors));
  }
  next();
};
