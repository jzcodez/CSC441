-- MySQL schema for the coffee website: menu (categories, products) and orders.
-- Re-running this file DROPS and recreates every table. Run it with: npm run db:mysql (from backend/)

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(60)   NOT NULL,
  slug        VARCHAR(60)   NOT NULL,
  description VARCHAR(255)  NULL,
  sort_order  SMALLINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug)
);

CREATE TABLE products (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  category_id  INT UNSIGNED  NOT NULL,
  name         VARCHAR(100)  NOT NULL,
  slug         VARCHAR(100)  NOT NULL,
  description  TEXT          NULL,
  price        DECIMAL(6, 2) NOT NULL,
  image_url    VARCHAR(255)  NULL,
  is_featured  BOOLEAN       NOT NULL DEFAULT FALSE,
  is_available BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_category (category_id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id),
  CONSTRAINT chk_products_price CHECK (price >= 0)
);

CREATE TABLE orders (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  customer_name  VARCHAR(100)  NOT NULL,
  customer_email VARCHAR(255)  NOT NULL,
  customer_phone VARCHAR(20)   NOT NULL,
  pickup_time    DATETIME      NOT NULL,
  notes          VARCHAR(500)  NULL,
  total          DECIMAL(8, 2) NOT NULL,
  status         ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_status (status),
  CONSTRAINT chk_orders_total CHECK (total >= 0)
);

-- unit_price is copied from products at order time, so later price changes don't rewrite past orders.
CREATE TABLE order_items (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  order_id   INT UNSIGNED     NOT NULL,
  product_id INT UNSIGNED     NOT NULL,
  quantity   TINYINT UNSIGNED NOT NULL,
  unit_price DECIMAL(6, 2)    NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT chk_order_items_quantity CHECK (quantity BETWEEN 1 AND 20)
);
