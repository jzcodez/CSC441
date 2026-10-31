# Architecture

## Overview

```
 Browser                           Express server (backend/)                    Databases
┌──────────────────┐   HTTP    ┌───────────────────────────────────┐
│ HTML pages + CSS │ ────────► │ express.static → serves frontend/ │
│                  │           │                                   │    SQL   ┌─────────┐
│ js/pages/*.js    │  fetch()  │ /api/* → routes → controllers     │ ───────► │  MySQL  │ menu, orders
│   └─ js/api.js   │ ────────► │          → services → db          │          └─────────┘
│                  │ ◄──────── │                                   │  driver  ┌─────────┐
│                  │   JSON    │ errorHandler (one error format)   │ ───────► │ MongoDB │ reviews, messages
└──────────────────┘           └───────────────────────────────────┘          └─────────┘
```

The browser never talks to a database directly. Doing so would expose database passwords to every visitor. All data goes through the API, which validates it first.

## Backend layers

Each layer has one job and only talks to the layer below it.

| Layer | Folder | Responsibility | Example |
|---|---|---|---|
| Routes | `src/routes/` | Map URL + method to a handler, attach validation | `POST /api/orders → validate(validateOrder) → createOrder` |
| Validators | `src/validators/` | Reject bad input with per-field messages | "Pickup time must be within the next 7 days." |
| Controllers | `src/controllers/` | Read the request, call a service, send the response | Parse `:id`, return `201 Created` |
| Services | `src/services/` | Business rules and database queries | Look up real prices, compute the total, save the order in a transaction |
| DB | `src/db/` | Connections to MySQL and MongoDB | Connection pool, lazy Mongo connection |

This separation means the database could change without touching the controllers, and validation can't be forgotten because it's attached at the route.

## Key design decisions

1. **Two databases, chosen by data shape.** Orders are relational and must be consistent, so they go in MySQL with transactions and foreign keys. Reviews and messages are independent documents, so they go in MongoDB with aggregation for ratings. See [database/README.md](../database/README.md).
2. **Validation happens three times.** HTML5 attributes give instant feedback. JavaScript adds friendly messages and business rules. The server is the real gatekeeper, since browser checks can be bypassed. MongoDB `$jsonSchema` and MySQL `CHECK` constraints are a final safety net.
3. **The server decides prices.** The order form sends only product ids and quantities. The server looks up prices in MySQL, so a customer can't edit the price in their browser.
4. **Money is computed in cents.** This avoids floating-point errors like `0.1 + 0.2 = 0.30000000000000004`.
5. **The site degrades gracefully.** If MongoDB is down, product pages still show details from MySQL, and only the reviews section shows an error. The API returns `503 Service Unavailable` instead of crashing.
6. **User content is always escaped.** Review text is escaped before being inserted into the page, which prevents cross-site scripting (XSS).
7. **There is no frontend framework.** Plain HTML, CSS and JavaScript keep every page's markup and styles visible and graded as written.
8. **Configuration comes from the environment.** Passwords and connection strings live in `.env` locally and in Render's settings in production. They are never in git.

## API endpoints

All responses are JSON. Errors always look like `{ "error": "message", "details": { "field": "message" } }`, where `details` is only present for validation errors.

| Method | Path | Database | Description |
|---|---|---|---|
| GET | `/api/health` | both | `{ status, databases: { mysql: "up"/"down", mongodb: "up"/"down" } }` |
| GET | `/api/categories` | MySQL | All menu categories |
| GET | `/api/products` | MySQL | Available products. Query: `?category=<slug>`, `?featured=true` |
| GET | `/api/products/:id` | MySQL | One product |
| POST | `/api/orders` | MySQL | Body: `{ customerName, customerEmail, customerPhone, pickupTime (ISO), notes?, items: [{ productId, quantity }] }`. Returns `201` with the order id and total. |
| GET | `/api/products/:id/reviews` | MongoDB | `{ average, count, reviews[] }` for one product |
| GET | `/api/reviews` | MongoDB | Latest reviews. Query: `?limit=1..50` (default 6) |
| POST | `/api/reviews` | MongoDB (+ MySQL check) | Body: `{ productId, name, rating (1–5), comment }` |
| POST | `/api/contact` | MongoDB | Body: `{ name, email, subject, message }` |

Status codes used: `200` OK, `201` Created, `400` bad input, `404` not found, `503` a database is unavailable, `500` unexpected error.

## Deployment

| Piece | Service | Configuration |
|---|---|---|
| Web server + pages | Render (Web Service) | Root directory `backend`, build `npm install`, start `npm start` |
| MySQL | Aiven for MySQL | Set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_SSL_CA` on Render |
| MongoDB | MongoDB Atlas | Set `MONGODB_URI` and `MONGODB_DB` on Render; allow Render's IP addresses in Atlas Network Access |

Render redeploys automatically when `main` changes on GitHub. Render sets `PORT` itself.
