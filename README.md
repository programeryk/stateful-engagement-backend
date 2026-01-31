# Stateful Engagement Backend

*(Stateful Progression / Streak Engine API)*

A RESTful backend API implementing a **deterministic, stateful progression system**.

The system models a closed daily engagement loop:

> **Auth → Daily check-in → State updates → Automatic rewards → Tool inventory → Tool usage → State changes**

This is **not** a generic CRUD API.
It is a **rules-driven state machine** where all state transitions are explicit, validated, and enforced transactionally.

The primary focus of the project is **correctness under concurrency**, not feature breadth.

---

## Core Principles

* State changes only through **explicit domain actions**
* No implicit mutations or client-side authority
* **Database constraints** back application logic
* All multi-step updates are **atomic**
* Behavior is deterministic and testable
* Concurrency safety is treated as a first-class concern

---

## Core Domain Model

### User

Authentication identity only.

### UserState (1:1 with User)

Persistent progression state:

* `streak`
* `energy` (0–100)
* `fatigue` (0–100)
* `loyalty` (currency)

UserState is **bootstrapped lazily and idempotently** inside the first state-changing transaction.

---

### DailyCheckIn

One row per user per UTC calendar day.

* Unique per `(userId, date)`
* Enforced at the database level
* Used to compute streak progression

---

### Reward

Static catalog (seeded).

* Unlock conditions (e.g. streak ≥ N)
* Deterministic effects
* Automatically applied when eligible
* Applied **once ever per user**

Ownership is tracked via a join table to prevent duplicate application.

---

### ToolDefinition

Static tool catalog (seeded).

* Price (loyalty cost)
* Deterministic effects on state

---

### UserTool (Inventory)

Per-user inventory of tools.

* Tracks ownership + quantity
* Unique per `(userId, toolId)`
* Inventory capacity capped (max 5 unique tools)
* Tools are **consumable**

---

## Core Invariants

The system enforces the following rules:

* A user may check in **at most once per UTC day**
* Daily check-ins are unique per `(userId, date)`
* All state mutations happen inside a **single transaction**
* State values are clamped:

  * `0 ≤ energy ≤ 100`
  * `0 ≤ fatigue ≤ 100`
  * `streak ≥ 0`
  * `loyalty ≥ 0`
* Rewards are automatically applied and **never applied twice**
* Tool usage is atomic:

  * inventory update + state update succeed or fail together
* Inventory capacity limits are enforced transactionally

These invariants are enforced using:

* database constraints
* transactional updates
* service-layer validation

---

## API Shape (Command-Based)

This API exposes **domain commands**, not CRUD.

Examples:

* `POST /checkins`
* `POST /tools/:toolId/buy`
* `POST /tools/:toolId/use`

There are intentionally:

* no delete endpoints
* no admin endpoints
* no arbitrary state mutation routes

State can only change through defined actions.

---

## Authentication

Authentication is implemented using **JWT access tokens**.

### Public endpoints

* `POST /auth/register`
* `POST /auth/login`
* `GET /tools` (tool catalog)

### Protected endpoints (JWT required)

* `GET /me`
* `POST /checkins`
* `GET /rewards`
* `GET /tools/inventory`
* `POST /tools/:toolId/buy`
* `POST /tools/:toolId/use`

JWT must be provided via:

```
Authorization: Bearer <access_token>
```

> In development only, a header-based dev auth (`X-User-Id`) may be enabled to simplify local testing. Production paths require JWT.

---

## Tool System (v1)

* Tools are defined globally and seeded
* Users buy tools using loyalty
* Inventory is capped at **5 unique tool types**
* Buying an already-owned tool increases quantity
* Using a tool:

  * consumes one unit
  * applies effects to UserState
  * clamps state values
  * deletes inventory row when quantity reaches zero
* All tool operations are transactional

---

## Level-Up Logic

Additional state rules (e.g. level-ups triggered by reaching energy thresholds) are handled deterministically inside the same transactional update pipeline as check-ins, rewards, and tool usage.

---

## Tech Stack

* TypeScript
* Node.js
* NestJS
* PostgreSQL
* Prisma ORM
* Docker (local development)

---

## Local Development

### Prerequisites

* Node.js (v18+)
* Docker & Docker Compose
* npm

---

### Clone the repository

```bash
git clone https://github.com/programeryk/stateful-engagement-backend
cd stateful-engagement-backend
```

---

### Install dependencies

```bash
npm install
```

---

### Start the database

```bash
docker compose up -d
```

---

### Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stateful_engagement"
JWT_SECRET="your_secret_here"
```

---

### Run migrations & seed

```bash
npx prisma migrate dev
```

---

### Start the application

```bash
npm run start:dev
```

API runs at:

```
http://localhost:3000
```

---

## Example Flow

```bash
# login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

```bash
# authenticated request
curl http://localhost:3000/me \
  -H "Authorization: Bearer <token>"
```

---

## Non-Goals

This project intentionally does **not** include:

* frontend UI
* admin panels or RBAC
* generic CRUD endpoints
* real-time updates
* probabilistic mechanics
* background schedulers

The focus is **correctness, determinism, and transactional safety**.

---

## Project Status

### Implemented

* JWT authentication
* Daily check-ins with UTC logic
* Stateful progression with clamped values
* Automatic rewards (once-ever)
* Tool catalog and inventory
* Tool buy & use transactions
* Inventory capacity enforcement
* Level-up rules

### Planned

* Integration tests (concurrency / invariants)
* API documentation
* Deployment
* Rate limiting

---

## Why This Project Exists

This project exists to practice:

* designing **stateful backend systems**
* modeling **domain invariants**
* enforcing correctness with **constraints**
* handling **concurrency safely**
* building APIs around **domain commands**

It is intended as a **portfolio-grade backend**, not a demo CRUD app.

---

## License

Educational and portfolio use.

---
