# Stateful Engagement Backend

A RESTful backend API for a **deterministic, stateful engagement loop**:

**register/login -> daily check-in -> state updates -> automatic rewards -> buy/use tools (inventory)**

This project is backend-focused and designed to demonstrate **correctness under concurrency** using database constraints, transactions, and explicit invariants — not just CRUD endpoints.

---

## Why this project exists

This is **not** a demo CRUD app.

It exists to practice and demonstrate:

* stateful backend design
* invariant enforcement
* transactional correctness
* race-condition handling
* ownership and once-ever guarantees

The emphasis is **correct behavior under concurrent requests**, not feature breadth.

---

## Tech Stack

* TypeScript
* Node.js
* NestJS
* PostgreSQL
* Prisma ORM
* Docker / Docker Compose
* JWT authentication
* bcrypt (password hashing)

---

## High-level Domain Model

* **User** – authentication identity
* **UserState (1:1)** – `energy`, `fatigue`, `loyalty`, `streak`, `level`
* **DailyCheckIn** – one row per `(userId, UTC date)` (unique)
* **Reward** – seeded catalog with JSON effects
* **AppliedReward** – join table enforcing once-ever reward application
* **ToolDefinition** – seeded tool catalog
* **UserTool** – per-user inventory rows with quantity

---

## Core Invariants

The system enforces the following rules:

* A user can check in **at most once per UTC day**
* Daily check-ins are unique per `(userId, date)`
* All state-changing operations occur inside **database transactions**
* Rewards are **automatically applied once per user**
* Inventory capacity is capped (max **5 unique tool types**)
* Tool usage is atomic (inventory + state update succeed or fail together)
* State values are clamped:

  * `0 ≤ energy ≤ 100`
  * `0 ≤ fatigue ≤ 100`
  * `streak ≥ 0`

These invariants are enforced using:

* database constraints
* transactional writes
* explicit service-layer validation

---

## API Overview

### Public Endpoints

* `POST /auth/register`
* `POST /auth/login`
* `GET /tools` – tool catalog

### Protected Endpoints (JWT required)

* `GET /me`
* `POST /checkins`
* `GET /rewards`
* `GET /tools/inventory`
* `POST /tools/inventory/buy/:toolId`
* `POST /tools/:toolId/use`

All mutating endpoints require a valid JWT.

---

## Authentication

Authentication uses **JWT access tokens**.

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@x.com","password":"pass1234"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@x.com","password":"pass1234"}'
```

Response includes an `accessToken`.

Use it as:

```bash
Authorization: Bearer <token>
```

---

## Daily Check-in

```bash
curl -X POST http://localhost:3000/checkins \
  -H "Authorization: Bearer <token>"
```

Behavior:

* Creates a `DailyCheckIn` for the current UTC date
* Updates user state atomically
* Returns **409 Conflict** if already checked in today

---

## Tools & Inventory

### List tools (public)

```bash
curl http://localhost:3000/tools
```

### View inventory

```bash
curl http://localhost:3000/tools/inventory \
  -H "Authorization: Bearer <token>"
```

### Buy tool

```bash
curl -X POST http://localhost:3000/tools/inventory/buy/coffee \
  -H "Authorization: Bearer <token>"
```

Rules:

* Costs loyalty
* Max 5 unique tool types
* Race-safe under concurrent requests

### Use tool

```bash
curl -X POST http://localhost:3000/tools/coffee/use \
  -H "Authorization: Bearer <token>"
```

Rules:

* Consumes 1 quantity
* Applies effects atomically
* Returns **409 Conflict** if tool not available

---

## Local Development

### Prerequisites

* Node.js 18+
* Docker + Docker Compose
* npm

### Install dependencies

```bash
npm install
```

### Start database

```bash
docker compose up -d
```

### Environment variables

Create `.env` from the template:

```bash
cp .env.example .env
```

Then adjust values as needed:

```env
DATABASE_URL="postgresql://app:apppass@localhost:5432/engagement"
JWT_SECRET="super-secret-dev-key"
JWT_EXPIRES_IN="15m"
```

### Run migrations + seed

```bash
npx prisma migrate dev
```

### Start API

```bash
npm run start:dev
```

API runs at:

```
http://localhost:3000
```

---

## Testing

This project uses a **separate test database**.

### `.env.test`

Create `.env.test` from the template:

```bash
cp .env.test.example .env.test
```

Then adjust values as needed:

```env
DATABASE_URL="postgresql://app:apppass@localhost:5432/engagement_test"
NODE_ENV=test
JWT_SECRET="super-secret-test-key"
JWT_EXPIRES_IN="15m"
```

### Create test database (once)

```bash
docker exec -it engagement_db \
  psql -U app -d postgres \
  -c "CREATE DATABASE engagement_test;"
```

### Reset + seed test DB

```bash
npm run test:e2e:setup
```

### Run tests

```bash
npm run test:e2e
```

### What the tests prove

* duplicate daily check-ins return **409**
* tool buy/use works end-to-end
* buy/use operations are **race-safe under concurrency**
* inventory and loyalty never go negative
* state remains consistent after concurrent requests

---

## Design Notes

* Correctness is enforced primarily via:

  * database constraints
  * transactions
  * serializable isolation where needed
* State updates are centralized and clamped
* Business conflicts return **409**, not 500
* The system is deterministic and testable by design

---

## Non-goals

This project intentionally does **not** include:

* frontend UI
* admin panels or CRUD dashboards
* background jobs / schedulers
* real-time updates
* probabilistic mechanics

---

## License

Educational / portfolio use.

---
