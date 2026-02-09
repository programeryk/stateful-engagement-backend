# Stateful Engagement Backend

A RESTful backend API for a **deterministic, stateful engagement loop**:

**register/login -> daily check-in -> state updates -> automatic rewards -> buy/use tools (inventory)**

This project is backend-focused and designed to demonstrate **correctness under concurrency** using database constraints, transactions, and explicit invariants - not just CRUD endpoints.

---

## Quick Start

```bash
# 1. Install and start database
npm install
docker compose up -d

# 2. Set up environment
cp .env.example .env

# 3. Run migrations and seed
npx prisma migrate dev

# 4. Start development server
npm run start:dev
```

API runs at `http://localhost:3000`.

---

## Why this project exists

This is **not** a demo CRUD app.

It exists to practice and demonstrate:

* stateful backend design
* invariant enforcement
* transactional correctness
* race-condition handling
* ownership and once-ever guarantees
* CI/CD best practices

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

This project uses **Jest** for unit tests and **Supertest** + PostgreSQL for e2e tests. A separate test database ensures isolation.

### Unit Tests

```bash
npm test
```

Runs all `*.spec.ts` files. Tests cover:
- Authentication (register, login, JWT validation)
- Service layer logic
- DTO validation
- Guard behavior

### E2E Tests

E2E tests use a **separate test database** to ensure isolation from development data.

#### Setup (one-time)

```bash
cp .env.test.example .env.test
docker compose up -d  # Ensure engagement_test is created
npm run test:e2e:setup  # prisma migrate reset + seed
```

#### Run E2E Tests

```bash
npm run test:e2e
```

Tests cover:
- End-to-end workflows (register → checkin → rewards → tools)
- Concurrency and race conditions
- Inventory and state consistency
- Reward idempotence (once-ever guarantee)

### Code Quality

**Linting:**
```bash
npm run lint
```

Linting enforces TypeScript strict mode and ESLint rules. Test files use relaxed unsafe-member-access rules for practical test code (e.g., mocking, response casting).

---

## CI/CD

This project uses **GitHub Actions** for automated testing on every PR and push to `main`.

### Pipeline (`.github/workflows/ci.yml`)

On every push and PR:
1. Lint (`npm run lint`)
2. Build (`npm run build`)
3. Prisma generate (ensure types are current)
4. Unit tests (`npm test`)
5. E2E setup (migrate reset + seed on test DB)
6. E2E tests (`npm run test:e2e`)

The pipeline uses a temporary PostgreSQL service with `engagement_test` database. All steps must pass before merging.

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

### What the tests prove

* duplicate daily check-ins return **409**
* tool buy/use works end-to-end
* buy/use operations are **race-safe under concurrency**
* inventory and loyalty never go negative
* state remains consistent after concurrent requests

---

## Project Structure

```
src/
├── auth/              # Authentication (register, login, JWT strategy)
├── checkins/          # Daily check-in endpoint & logic
├── rewards/           # Reward queries & application
├── tools/             # Tool catalog & inventory management
├── me/                # User profile & state
├── users/             # User service
├── common/            # Decorators, guards, utilities
├── prisma/            # Prisma service
├── config/            # Environment validation
└── main.ts            # NestJS bootstrap

test/
├── app.e2e-spec.ts         # App initialization tests
├── checkins.e2e-spec.ts    # Check-in workflows
├── rewards.once-ever.e2e-spec.ts  # Reward idempotence
├── tools.e2e-spec.ts       # Tool buy/use flows
└── helpers/           # E2E test utilities

prisma/
├── schema.prisma      # Database schema
├── migrations/        # Migration history
└── seed.ts            # Seed script (2 rewards + 3 tools)
```

---

## Development Workflow

1. **Create a branch from `main`:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**, run tests locally:
   ```bash
   npm test                 # Unit tests
   npm run test:e2e:setup   # Reset test DB
   npm run test:e2e         # E2E tests
   npm run lint             # Lint & auto-fix
   npm run build            # Verify build
   ```

3. **Commit with conventional messages:**
   ```bash
   git commit -m "feat: add feature description"
   git push origin feature/your-feature-name
   ```

4. **Open a PR on GitHub.** CI will automatically:
   - Run lint, build, unit tests, and e2e tests
   - Report results on the PR

5. **Merge to `main` once CI passes and reviews are approved.**

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

## Production Deployment

### Docker Build

```bash
docker build -t engagement-backend:latest -f Dockerfile .
```

### Environment Variables

Ensure these are set in production:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong random secret (min 32 chars)
- `JWT_EXPIRES_IN` - Token expiry (e.g., "15m", "7d")
- `NODE_ENV=production`

### Database Migrations

Run migrations against production database:
```bash
npx prisma migrate deploy
```

**Do not use `prisma migrate reset`** on production (it wipes data).

### Health Check

```bash
curl http://localhost:3000
```

---

## Troubleshooting

### Tests fail with "Cannot find database 'engagement_test'"

```bash
# Create the test database manually:
docker exec -it engagement_db psql -U app -d postgres -c "CREATE DATABASE engagement_test;"

# Then reset:
npm run test:e2e:setup
```

### Lint errors in tests (no-unsafe-*)

Expected and accepted. Test files use loosely-typed response objects from Supertest. This is a pragmatic trade-off for maintainability.

### Port 5432 already in use

```bash
docker compose down  # Stop existing Postgres
docker compose up -d # Start fresh
```

---

## Non-goals

This project intentionally does **not** include:

* frontend UI
* admin panels or CRUD dashboards
* background jobs / schedulers
* real-time updates (WebSockets)
* probabilistic mechanics

---

## License

Educational / portfolio use.

---
