# Stateful Engagement Backend

A NestJS + PostgreSQL backend for a deterministic engagement loop:

`register/login -> daily check-in -> state updates -> rewards -> buy/use tools`

The project emphasizes correctness under concurrency using transactions, unique constraints, and explicit invariants.

## Quick Start

```bash
# 1) Install deps
npm install

# 2) Configure env
cp .env.example .env
cp .env.docker.example .env.docker

# 3) Start DB + API containers (API runs migrate deploy on startup)
docker compose up -d --build
```

API: `http://localhost:3000`
Swagger: `http://localhost:3000/api`
Production API: `https://stateful-engagement-backend.onrender.com`
Production Swagger: `https://stateful-engagement-backend.onrender.com/api#/`

## Using Swagger

1. Open `http://localhost:3000/api`.
2. Call `POST /auth/register` (or `POST /auth/login`) with email + password.
3. Copy `accessToken` from response.
4. Click **Authorize** in Swagger UI and paste: `Bearer <accessToken>`.
5. Call protected endpoints (`/me`, `/checkins`, `/rewards`, `/tools/inventory`, ...).

Host-only API workflow (optional):

```bash
# Start only database in Docker
docker compose up -d db

# Run migrations from host and start API from host
npx prisma migrate dev
npm run start:dev
```

## Tech Stack

- TypeScript
- NestJS 11
- PostgreSQL
- Prisma ORM
- JWT auth + bcrypt
- Jest + Supertest
- GitHub Actions CI

## Domain Model

- `User`: auth identity
- `UserState` (1:1): `energy`, `fatigue`, `loyalty`, `streak`, `level`
- `DailyCheckIn`: unique per `(userId, UTC date)`
- `Reward`: reward catalog definitions
- `AppliedReward`: once-ever reward tracking
- `ToolDefinition`: tool catalog
- `UserTool`: user inventory rows with quantity

## Core Invariants

- At most one check-in per user per UTC day
- State-changing operations are transactional
- Rewards are applied once-ever per user
- Inventory has a max unique tool-type capacity
- Tool use is atomic (inventory + state mutation)
- State values are clamped by shared state rules
- Database checks enforce `energy/fatigue` ranges and non-negative values for key counters

## API Overview

Public:

- `POST /auth/register`
- `POST /auth/login`
- `GET /tools`

Protected (JWT bearer):

- `GET /me`
- `POST /checkins`
- `GET /rewards`
- `GET /tools/inventory`
- `POST /tools/inventory/buy/:toolId`
- `POST /tools/:toolId/use`

## Authentication

Register:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@x.com","password":"pass1234"}'
```

Login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@x.com","password":"pass1234"}'
```

Use returned token as:

```text
Authorization: Bearer <token>
```

## Local Testing

Unit tests:

```bash
npm test
```

E2E tests:

```bash
cp .env.test.example .env.test
npm run test:e2e:setup
npm run test:e2e
```

What e2e covers:

- Check-in conflicts (`409`) for duplicates
- Reward idempotence (once-ever semantics)
- Tool buy/use flows end-to-end
- Concurrency safety for check-in/tool endpoints
- Auth race safety and rate-limiting behavior
- DB-level check-constraint enforcement

## Code Quality

Lint:

```bash
npm run lint
```

Notes:

- Lint is type-aware and runs Prisma generate first (`prelint`) to avoid stale Prisma types.
- Test files intentionally allow limited unsafe patterns where Supertest response typing is impractical.
- TS/ESLint settings are strict in key areas but intentionally pragmatic (`noImplicitAny` is not fully strict).

## CI/CD

CI workflow: `.github/workflows/ci.yml`

On push/PR to `main`, it runs:

1. `npm ci`
2. `npx prisma generate`
3. `npm run lint`
4. `npm run build`
5. `npm run test:e2e:setup`
6. `npm test`
7. `npm run test:e2e`

CI uses a temporary PostgreSQL service (`engagement_test`).

## Project Structure

```text
src/
  auth/
  checkins/
  common/
  config/
  me/
  prisma/
  rewards/
  tools/
  users/
  app.module.ts
  main.ts

test/
  app.e2e-spec.ts
  checkins.e2e-spec.ts
  rewards.once-ever.e2e-spec.ts
  tools.e2e-spec.ts
  helpers/

prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Production Notes

Required env vars:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `NODE_ENV=production`
- `CORS_ORIGIN` (comma-separated allowlist, required in production)
- Optional: `ENABLE_DEV_SIMULATION=true` enables DEV-only endpoint `POST /me/dev/grant-loyalty/:amount` for local testing
- Optional: `RUN_SEED_ON_BOOT=true` to run `prisma db seed` during container startup

Logging/request correlation:

- Structured JSON logs are enabled via `nestjs-pino`.
- Every request gets/propagates `x-request-id` and returns it in response headers.
- Error payloads include `requestId` for easier trace correlation.

Run migrations in production:

```bash
npx prisma migrate deploy
```

Do not use `prisma migrate reset` in production.

## Non-goals

- Frontend UI
- Admin dashboard
- Background jobs/schedulers
- Realtime/WebSockets

## License

Educational / portfolio use.
