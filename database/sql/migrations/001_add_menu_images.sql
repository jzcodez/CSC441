-- Migration 001: give every menu item a picture.
-- Safe to run on the live database: it only fills in products that have no picture yet,
-- so it never overwrites a photo set by hand and never deletes data.
-- The "id > 0" condition keeps MySQL Workbench's safe-update mode happy.

UPDATE products
   SET image_url = CONCAT('/images/menu/', slug, '.svg')
 WHERE image_url IS NULL
   AND id > 0
   AND slug IN (
     'espresso', 'cappuccino', 'caffe-latte', 'flat-white', 'mocha', 'americano',
     'cold-brew', 'iced-latte', 'iced-caramel-macchiato',
     'butter-croissant', 'blueberry-muffin', 'chocolate-chip-cookie'
   );
