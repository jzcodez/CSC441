import * as orderService from '../services/orderService.js';

export async function createOrder(req, res) {
  const order = await orderService.createOrder(req.body);
  res.status(201).json(order);
}
