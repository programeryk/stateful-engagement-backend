# Architecture

This document describes the current architecture of `stateful-engagement-backend`.

The system models a deterministic progression loop:

`auth -> checkin -> state transition -> reward application -> tools/inventory`

## Goals

- Deterministic state transitions
- Database-enforced invariants
- Transactional correctness under concurrency
- Clear module boundaries and testability

## Request Flow

```text
HTTP Request
  -> Controller (validation + auth boundary)
    -> Service (domain rules + invariants)
      -> Prisma (typed data access)
        -> PostgreSQL (constraints + transactions)
```

## Authentication and Identity

Authentication is JWT-based.

- `AuthModule` exposes register/login.
- `JwtStrategy` validates bearer tokens and binds identity to `req.user`.
- Controllers extract the authenticated user id via decorator.

Identity is never accepted from arbitrary request payloads.

## Module Responsibilities

### `src/auth`

- Register/login endpoints
- Password hashing with bcrypt
- JWT issuing and validation

### `src/me`

- Returns current user profile and state
- Ensures user state exists via upsert/bootstrap logic

### `src/checkins`

- Enforces one check-in per UTC date per user
- Computes streak changes and applies base/reward deltas
- Uses transactions and conflict handling for race safety

### `src/rewards`

- Returns reward definitions and applied state
- Supports once-ever reward semantics through `AppliedReward`

### `src/tools`

- Lists tool catalog
- Buys tools with loyalty/capacity constraints
- Uses tools atomically (inventory + state update)

### `src/users`

- User-related service/controller utilities used by auth/me flows

### `src/prisma`

- Prisma service/module and lifecycle management

### `src/common`

- Shared decorators and state rule utilities (`clamp`, state transition helpers)

## Data Model (Prisma)

Core entities:

- `User`
- `UserState` (1:1, unique `userId`)
- `DailyCheckIn` (unique `[userId, date]`)
- `Reward`
- `AppliedReward` (unique `[userId, rewardId]`)
- `ToolDefinition`
- `UserTool` (unique `[userId, toolId]`)

## Invariants

Database-level:

- Unique check-in per user/date
- Unique user state per user
- Unique applied reward per user/reward
- Unique user tool row per user/tool

Service-level:

- Check-ins are once per UTC day
- Reward application is idempotent/once-ever
- Tool buy/use operations are transactional and race-safe
- State values are clamped by shared state rules

## Transactions and Concurrency

All state mutations run in transactions.

Patterns used:

- Unique constraints for conflict detection
- Idempotent inserts where appropriate (`createMany` + `skipDuplicates`)
- Prisma error code mapping for domain-friendly HTTP responses (`409` on conflicts)

## Testing Strategy

- Unit tests verify service/controller behavior and guards.
- E2E tests verify full workflows and race conditions against PostgreSQL.
- E2E setup resets and seeds test DB to keep tests deterministic.

## CI Design

CI runs on pushes and PRs to `main` and executes:

1. Install dependencies
2. Prisma generate
3. Lint
4. Build
5. E2E DB setup (reset + seed)
6. Unit tests
7. E2E tests

This sequence ensures generated Prisma types exist before type-aware linting.
