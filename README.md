# Stateful Engagement Backend

*(aka: Stateful Progression / Streak Engine API) updated project design on 1/20/26*

A RESTful backend API for a **stateful progression and engagement system**.

The system models a deterministic daily engagement loop:

> **Auth → Daily check-in → State updates (streak / energy / fatigue / loyalty) → Inventory tools → Use tools to affect state**

It is designed as a **rules-driven state machine**, not a toy CRUD app.

All critical operations are enforced at the **database level** using constraints and executed **atomically** using transactions to prevent race conditions and invalid state.

This project is being developed as a **learning-focused, production-style backend**, modeling real-world patterns such as:

* state transitions
* invariant enforcement
* idempotent operations
* transactional updates
* ownership tracking

> ⚠️ This project is under active development. APIs and internal logic may change.

---

## Core Idea

The backend implements a deterministic progression loop:

* Users perform **daily check-ins**
* Each user has a persistent **state**:

  * streak
  * energy
  * fatigue
  * loyalty
* Check-ins update state using fixed rules
* Rewards unlock automatically when conditions are met (e.g. streak milestones)
* Users can acquire **tools** into an inventory
* Tools can be **used to affect state** (e.g. reduce fatigue, gain energy, etc.)

There is **no randomness required** in the core loop.
All behavior is rules-based and testable.

---

## Core Invariants

The system enforces the following rules:

* A user can check in **at most once per calendar day** (UTC).
* Daily check-ins are unique per `(userId, date)`.
* All check-ins and state updates happen inside a **single transaction**.
* State values are clamped to valid ranges:

  * `energy ≥ 0`
  * `fatigue ≥ 0`
  * `streak ≥ 0`
* Inventory size is capped (e.g. max 5 tools).
* Tool usage is atomic:

  * state update + inventory update succeed or fail together.
* Rewards can only be claimed once.

These invariants are enforced using:

* database constraints
* transactions
* validation in the service layer

---

## Key Features

* REST API built with **NestJS**
* **Daily check-in system** with streak tracking
* Persistent per-user state stored in PostgreSQL
* Deterministic state transitions
* **Idempotent user bootstrapping**
* Protection against duplicate actions using **unique constraints**
* Atomic state updates using **database transactions**
* Reward unlock + claim tracking
* Designed to reflect **real production backend patterns**

---

## Tech Stack

* **TypeScript**
* **Node.js**
* **NestJS**
* **PostgreSQL**
* **Prisma ORM**
* **Docker** (local development)

---

## Current Project Status

### Implemented

* Database schema with constraints
* User bootstrap endpoint
* Daily check-in logic
* Streak calculation
* Unique check-in enforcement (`@@unique([userId, date])`)
* Atomic transactions for check-ins + state updates
* Reward definitions
* Reward unlock logic
* Reward claiming with duplicate-claim protection
* Custom dev-auth header guard (`X-User-Id`) for local testing

---

### In Progress / Planned (Safe Version Scope)

* JWT authentication (replace header-based dev auth)
* State updates on check-in:

  * energy
  * fatigue
  * loyalty
* Tool catalog (3 tools, seeded into DB)
* Inventory system
* Tool buy / use endpoints
* Inventory capacity limit
* Minimal e2e tests
* README + deployment

---

## Domain Flow

1. **Authentication**
   Users register and log in (JWT planned).
   All protected routes require authentication.

---

2. **Daily Check-in**

Users can check in **once per day (UTC)**.

On success:

* A `DailyCheckIn` row is created.
* The user’s state is updated in a transaction:

  * streak increment or reset
  * energy +X
  * fatigue +X
  * loyalty +X

Duplicate check-ins are blocked by a DB constraint.

---

3. **State**

Each user has a single persistent `UserState`:

* `streak`
* `energy`
* `fatigue`
* `loyalty`

State is updated only through controlled service logic.

---

4. **Rewards**

* Rewards are defined globally.
* Each reward has an unlock condition (e.g. streak ≥ 7).
* Unlocking is automatic and deterministic.
* Rewards can be claimed once.
* Claims are tracked in a join table.

---

5. **Tools & Inventory** *(Safe Version)*

* Tools are defined in a DB catalog (`ToolDefinition`).
* Users can buy tools using loyalty.
* Tools are stored in a per-user inventory.
* Inventory capacity is capped (e.g. max 5).
* Tools can be used to apply effects:

  * reduce fatigue
  * increase energy
  * increase loyalty

All tool usage is transactional.

---

## Database Design Notes

* Unique constraints prevent duplicate check-ins.
* User state is stored 1:1 with the user.
* Business rules are enforced as close to the data layer as possible.
* Transactions prevent partial state updates.
* Reward ownership is tracked via a join table.

---

## Getting Started (Local Development)

### Prerequisites

* Node.js (v18+ recommended)
* Docker & Docker Compose
* npm

---

### Clone the Repository

```bash
git clone https://github.com/programeryk/stateful-engagement-backend
cd stateful-engagement-backend
```

---

### Install Dependencies

```bash
npm install
```

---

### Start the Database

```bash
docker compose up -d
```

---

### Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stateful_engagement"
```

---

### Run Database Migrations

```bash
npx prisma migrate dev
```

---

### Start the Application

```bash
npm run start:dev
```

API available at:

```
http://localhost:3000
```

---

## Why This Project Exists

This is **not** a demo CRUD app.

It exists to practice:

* designing **stateful backend systems**
* modeling **domain rules and invariants**
* enforcing **correctness with constraints**
* working with **transactions**
* building APIs that behave deterministically under concurrency

---

## Future Work

* JWT authentication
* Tool system (catalog + inventory + use)
* Automatic reward unlocks without manual claiming
* Rate limiting
* API documentation (Swagger / OpenAPI)
* Deployment (Fly.io / Render)
* Background jobs (optional)

---

## License

This project is for educational and portfolio purposes.