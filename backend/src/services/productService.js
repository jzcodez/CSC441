// Menu data lives in MySQL: products belong to categories and are referenced by orders,
// so a relational model with foreign keys fits best.
import { pool } from '../db/mysql.js';

const PRODUCT_COLUMNS = `
  p.id, p.name, p.slug, p.description, p.price, p.image_url AS imageUrl,
  p.is_featured AS isFeatured, c.name AS category, c.slug AS categorySlug`;

const toProduct = (row) => ({ ...row, isFeatured: Boolean(row.isFeatured) });

export async function listCategories() {
  const [rows] = await pool.query('SELECT id, name, slug, description FROM categories ORDER BY sort_order, name');
  return rows;
}

export async function listProducts({ category, featured } = {}) {
  const where = ['p.is_available = 1'];
  const params = [];
  if (category) {
    where.push('c.slug = ?');
    params.push(category);
  }
  if (featured) where.push('p.is_featured = 1');

  const [rows] = await pool.query(
    `SELECT ${PRODUCT_COLUMNS}
       FROM products p
       JOIN categories c ON c.id = p.category_id
      WHERE ${where.join(' AND ')}
      ORDER BY c.sort_order, p.name`,
    params,
  );
  return rows.map(toProduct);
}

export async function getProductById(id) {
  const [rows] = await pool.query(
    `SELECT ${PRODUCT_COLUMNS}
       FROM products p
       JOIN categories c ON c.id = p.category_id
      WHERE p.id = ? AND p.is_available = 1`,
    [id],
  );
  return rows[0] ? toProduct(rows[0]) : null;
}
