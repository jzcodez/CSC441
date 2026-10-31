import * as contactService from '../services/contactService.js';

export async function createMessage(req, res) {
  const message = await contactService.createMessage(req.body);
  res.status(201).json(message);
}
