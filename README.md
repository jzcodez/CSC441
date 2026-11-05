# Ember & Bean ☕ Coffee Website

A coffee shop website for **CSC441**. Customers can browse the menu, read and write reviews, order for pickup and contact the café.

Data comes from **two databases**: **MySQL** for the menu and orders, and **MongoDB** for reviews and contact messages.

## How this project meets the rubric

| Criterion | Where to look |
|---|---|
| **Pulls data from SQL and NoSQL** | The menu, product details and orders come from MySQL ([productService.js](backend/src/services/productService.js), [orderService.js](backend/src/services/orderService.js)). Reviews, ratings and messages come from MongoDB ([reviewService.js](backend/src/services/reviewService.js)). [product.html](frontend/product.html) shows **both on one page**. |
| **Forms validated with HTML5 and JavaScript** | Three forms: [order](frontend/order.html), [review](frontend/reviews.html) and [contact](frontend/contact.html). Rules are declared with HTML5 attributes, and [validation.js](frontend/js/validation.js) adds inline messages plus custom rules (opening hours, at least one item). The server re-validates in [validators/index.js](backend/src/validators/index.js). |
| **At least five HTML/CSS pages** | Seven pages: Home, Menu, Product, Order, Reviews, Contact and About, plus a 404 page. Styling lives in three external stylesheets in [frontend/css/](frontend/css/). |
| **Reasoning and logical development** | A layered backend, a documented choice between SQL and NoSQL, and design notes in [docs/architecture.md](docs/architecture.md) and [database/README.md](database/README.md). |

## Project structure

```
coffee_website/
├── frontend/        HTML pages, CSS and browser JavaScript (no framework)
│   ├── css/         base.css (design tokens), layout.css, components.css
│   └── js/          api.js, validation.js, ui.js, main.js, pages/<page>.js
├── backend/         Node.js + Express: REST API under /api, and serves frontend/
│   ├── src/         routes → controllers → services → db
│   └── scripts/     database setup and seed scripts
├── database/
│   ├── sql/         MySQL schema and seed data
│   └── nosql/       MongoDB collection rules and seed data
└── docs/            Architecture and API reference
```

## Getting started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- MySQL 8: a local install or a cloud database
- A MongoDB connection string: [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier) or a local MongoDB

### 2. Install

```bash
cd backend
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

Open `backend/.env` and fill in your MySQL password and `MONGODB_URI`. **Never commit `.env`.** It holds passwords and is already in `.gitignore`.

### 3. Create the databases

```bash
npm run db:setup          # creates tables, collections and sample data in both databases
```

> ⚠️ This resets both databases. Run it once at the start, or whenever you want fresh sample data.

### 4. Run

```bash
npm run dev               # restarts automatically when you save a backend file
```

Open **http://localhost:3000**. Check **http://localhost:3000/api/health** to confirm both databases show `"up"`.

Open the site through the server URL. Opening the HTML files straight from disk won't work, because pages load their data from the API.

## Team workflow

1. **Never commit directly to `main`.** Create a branch for each feature:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/menu-filters
   ```
2. Commit small, focused changes with clear messages, e.g. `Add category filter to menu page`.
3. Push your branch and open a **pull request** on GitHub. A teammate reviews it, then it's merged into `main`.
4. `main` should always work, because it's what gets deployed.

### Who owns what

| Member | Pages | Backend and data |
|---|---|---|
| Member 1 | Home, About, shared CSS and layout | Server setup, deployment |
| Member 2 | Menu, Product, Order | MySQL schema, products and orders API |
| Member 3 | Reviews, Contact | MongoDB, reviews and contact API |

## API

See [docs/architecture.md](docs/architecture.md#api-endpoints) for every endpoint.

## Deployment

The plan is a single **Render** web service running `backend/`, which serves both the pages and the API. **Aiven for MySQL** and **MongoDB Atlas** provide the databases. All connection details come from environment variables, so no code changes are needed to deploy. See [docs/architecture.md](docs/architecture.md#deployment).
