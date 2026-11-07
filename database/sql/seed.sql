-- Sample menu data. IDs are fixed so the MongoDB seed reviews can reference products by id.

INSERT INTO categories (id, name, slug, description, sort_order) VALUES
  (1, 'Hot Coffee',  'hot-coffee',  'Espresso classics, pulled to order.',              1),
  (2, 'Cold Drinks', 'cold-drinks', 'Slow-steeped and served over ice.',                2),
  (3, 'Bakery',      'bakery',      'Baked fresh every morning by our neighbours.',     3);

INSERT INTO products (id, category_id, name, slug, description, price, is_featured) VALUES
  (1,  1, 'Espresso',                'espresso',          'A rich, concentrated double shot of our house blend with a thick crema.',           3.00, FALSE),
  (2,  1, 'Cappuccino',              'cappuccino',        'Espresso topped with equal parts steamed milk and velvety foam.',                    4.25, TRUE),
  (3,  1, 'Caffè Latte',             'caffe-latte',       'Smooth espresso with plenty of steamed milk and a light layer of foam.',             4.50, FALSE),
  (4,  1, 'Flat White',              'flat-white',        'A double ristretto with silky micro-foamed milk. Strong and smooth.',                4.25, FALSE),
  (5,  1, 'Mocha',                   'mocha',             'Espresso, dark chocolate and steamed milk, finished with cocoa.',                    4.95, TRUE),
  (6,  1, 'Americano',               'americano',         'Espresso lengthened with hot water for a clean, full-bodied cup.',                   3.25, FALSE),
  (7,  2, 'Cold Brew',               'cold-brew',         'Steeped for 18 hours for a naturally sweet, low-acid coffee.',                      4.50, TRUE),
  (8,  2, 'Iced Latte',              'iced-latte',        'Espresso and cold milk poured over ice.',                                            4.75, FALSE),
  (9,  2, 'Iced Caramel Macchiato',  'iced-caramel-macchiato', 'Vanilla, cold milk and espresso, layered and drizzled with caramel.',           5.25, FALSE),
  (10, 3, 'Butter Croissant',        'butter-croissant',  'Flaky, golden and made with real butter.',                                           3.25, TRUE),
  (11, 3, 'Blueberry Muffin',        'blueberry-muffin',  'Soft and moist, packed with blueberries and topped with crumble.',                  3.00, FALSE),
  (12, 3, 'Chocolate Chip Cookie',   'chocolate-chip-cookie', 'Chewy in the middle, crisp at the edges.',                                       2.50, FALSE);

-- Each product's picture is frontend/images/menu/<slug>.svg.
UPDATE products SET image_url = CONCAT('/images/menu/', slug, '.svg');
