// Orders live in MySQL: an order and its line items must be saved together or not at all,
// which is exactly what a SQL transaction guarantees.
import { pool } from '../db/mysql.js';
import { HttpError } from '../utils/HttpError.js';

export async function createOrder({ customerName, customerEmail, customerPhone, pickupTime, notes, items }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Prices come from the database, never from the browser, so customers can't change them.
    const productIds = [...new Set(items.map((item) => item.productId))];
    const [products] = await conn.query(
      'SELECT id, name, price FROM products WHERE id IN (?) AND is_available = 1',
      [productIds],
    );
    const productsById = new Map(products.map((p) => [p.id, p]));
    const missing = productIds.filter((id) => !productsById.has(id));
    if (missing.length > 0) {
      throw new HttpError(400, 'Some items are no longer available.', { items: 'Please refresh the menu and try again.' });
    }

    const lines = items.map((item) => {
      const product = productsById.get(item.productId);
      return { ...item, name: product.name, unitPrice: product.price };
    });
    // Work in cents to avoid floating-point rounding errors with money.
    const totalCents = lines.reduce((sum, line) => sum + Math.round(line.unitPrice * 100) * line.quantity, 0);
    const total = totalCents / 100;

    const [result] = await conn.query(
      `INSERT INTO orders (customer_name, customer_email, customer_phone, pickup_time, notes, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customerName.trim(), customerEmail.trim(), customerPhone.trim(), new Date(pickupTime), notes?.trim() || null, total],
    );
    await conn.query(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ?',
      [lines.map((line) => [result.insertId, line.productId, line.quantity, line.unitPrice])],
    );

    await conn.commit();
    return {
      id: result.insertId,
      status: 'pending',
      pickupTime,
      total,
      items: lines.map(({ productId, name, quantity, unitPrice }) => ({ productId, name, quantity, unitPrice })),
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
