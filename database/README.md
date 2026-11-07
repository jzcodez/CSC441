# Database

The site uses **two databases**, each for the kind of data it handles best.

| Data | Database | Why |
|---|---|---|
| Categories, products, orders, order items | **MySQL** | Highly structured and related to each other. Orders reference products, and an order plus its items must be saved together. Foreign keys, `CHECK` constraints and transactions guarantee that. |
| Customer reviews, contact messages | **MongoDB** | Self-contained documents with no joins, written once and read in bulk. Their shape can grow later (photos, staff replies) without a schema migration. MongoDB's aggregation pipeline computes average ratings. |

## MySQL schema

```
categories 1 ──< products 1 ──< order_items >── 1 orders
```

| Table | Key columns |
|---|---|
| `categories` | `id`, `name`, `slug` (unique), `sort_order` |
| `products` | `id`, `category_id → categories.id`, `name`, `slug` (unique), `price`, `is_featured`, `is_available` |
| `orders` | `id`, customer name/email/phone, `pickup_time`, `total`, `status` |
| `order_items` | `id`, `order_id → orders.id` (cascade delete), `product_id → products.id`, `quantity`, `unit_price` |

`order_items.unit_price` is a snapshot of the price at order time, so changing a menu price never alters past orders.

Files: [sql/schema.sql](sql/schema.sql) (tables) and [sql/seed.sql](sql/seed.sql) (sample menu).

## MongoDB collections

**`reviews`**

```json
{ "productId": 2, "productName": "Cappuccino", "name": "Sara K.", "rating": 5,
  "comment": "Perfect foam every single time.", "createdAt": ISODate("...") }
```

**`messages`**

```json
{ "name": "...", "email": "...", "subject": "...", "message": "...",
  "status": "new", "createdAt": ISODate("...") }
```

Even though MongoDB doesn't require a schema, both collections use `$jsonSchema` validators so bad data is rejected at the database level as well. Indexes support the main queries: reviews for one product, newest first. Definitions are in [nosql/collections.json](nosql/collections.json) and sample data in [nosql/seed-data.json](nosql/seed-data.json).

### Linking the two databases

`reviews.productId` refers to `products.id` in MySQL. There is no foreign key across two different databases, so the backend enforces it instead: `reviewService.createReview` checks that the product exists in MySQL before saving the review. `productName` is stored on the review too, so the reviews list can be shown without querying MySQL.

## Changing a live database: migrations

`schema.sql` and `seed.sql` rebuild everything from scratch, so they are only for new databases. Changes to a database that already holds real orders go in [sql/migrations/](sql/migrations/) as small, numbered SQL files that never delete data. Each one is run once against the live database (for example in MySQL Workbench), and `schema.sql`/`seed.sql` are updated to match, so fresh setups end up identical.

| Migration | What it does |
|---|---|
| [001_add_menu_images.sql](sql/migrations/001_add_menu_images.sql) | Sets each product's `image_url` to its illustration in `frontend/images/menu/` |

## Setting up

From the `backend/` folder, with `.env` filled in:

```bash
npm run db:mysql   # creates the database, tables and sample menu
npm run db:mongo   # creates collections, validators, indexes and sample reviews
npm run db:setup   # both
```

> These scripts **reset** the data: they drop and recreate tables and collections. Don't run them against the live (production) databases once real orders exist.
