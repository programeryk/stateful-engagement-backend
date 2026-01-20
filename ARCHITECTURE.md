# Architecture

This document describes the architecture of **stateful-engagement-backend** — a rules-driven backend API that implements a deterministic daily progression loop (check-ins → state updates → rewards → tools).

The project is intentionally designed to model **production-style backend concerns**:

* deterministic state transitions
* database-enforced invariants
* transactional correctness under concurrency
* clean module boundaries
* testable domain logic

> Note: Authentication is currently implemented via a development header guard.
> JWT-based authentication is planned.

---

## High-Level Overview

The system is a **state machine API**.

User actions are limited, explicit, and deterministic:

* **Daily Check-in** → one state transition per day
* **Read Rewards** → derived from current state
* **Buy Tool / Use Tool** → inventory → state transition

At a high level:

```
HTTP Request
  -> Controller (validation + auth context)
    -> Service (domain rules + invariants)
      -> Prisma (DB reads/writes)
        -> Postgres (constraints + transactions)
```

The database is treated as the **final authority** for correctness:

* uniqueness
* idempotency
* ownership
* atomicity

---

## Modules and Responsibilities

This section maps directly to the current repository layout.

---

### Auth (dev version)

**Location:** `src/common`
**Purpose:** identify the caller and provide a `userId` to downstream logic.

* Current implementation:

  * custom `X-User-Id` header guard + decorator
* Planned:

  * JWT + bcrypt (register/login)
  * auth guard populates request user context

**Key rule:**
Domain services never trust raw request input for identity — they only use the authenticated `userId`.

---

### Users / Me Module

**Location:**

* `src/users`
* `src/me`

**Purpose:**

* bootstrap users during development
* return the current user + state
* act as the identity entry point

Responsibilities:

* ensure a `User` and `UserState` exist
* expose a `GET /me`-style endpoint
* avoid embedding domain rule changes here

---

### State Module

**Location:** `src/state`
**Purpose:** expose read-only access to current progression state.

Responsibilities:

* return the authenticated user’s `UserState`
* never mutate state directly

All mutations are owned by:

* check-ins
* tools

This separation keeps state queries safe and simple.

---

### Check-ins Module

**Location:** `src/checkins`
**Purpose:** enforce “once per day” progression and apply deterministic state transitions.

Responsibilities:

* determine “today” (rule: **UTC date**)
* create a `DailyCheckIn` row
* compute streak based on yesterday’s presence
* update `UserState` meters
* wrap all of the above in a single transaction

**Correctness is the priority here.**

---

### Rewards Module (Computed Unlocks Only)

**Location:** `src/rewards`
**Purpose:** expose milestone-based progression unlocks.

Important design choice:

> Rewards are **not claimed or owned**.
> They are derived automatically from the current state.

Responsibilities:

* store reward definitions (e.g. `streak >= 7`)
* compute `unlocked: boolean` from `UserState`
* return reward status to the client

There is no `UserReward` table and no claim endpoint.

This keeps rewards:

* deterministic
* stateless
* idempotent
* race-condition-proof

---

### Tools Module

**Location:** `src/tools`
**Purpose:** define state-changing items.

Responsibilities:

* store tool definitions (`ToolDefinition`)
* expose tool catalog
* define cost + effects
* provide metadata used by inventory + use flows

Tool definitions are seeded into the database.

---

### Inventory Module

**Location:** `src/inventory`
**Purpose:** track per-user owned tools and apply tool effects.

Responsibilities:

* store per-user tool instances
* enforce inventory capacity (e.g. max 5)
* buy tools (spend loyalty → add to inventory)
* use tools (apply effect → remove tool)
* ensure tool usage is atomic

---

## Data Model (Conceptual)

Target “safe version” model:

* `User`
* `UserState` (1:1 with User)

  * streak
  * energy
  * fatigue
  * loyalty
* `DailyCheckIn`

  * `(userId, date)` unique
* `RewardDefinition`

  * unlock conditions (e.g. `streak >= 7`)
* `ToolDefinition`

  * name
  * cost
  * effect type
  * effect parameters
* `UserTool`

  * per-user inventory rows

---

## Invariants and Where They Live

The system is designed around explicit invariants and layered enforcement.

---

### Database-level invariants (hard guarantees)

Enforced in Postgres via Prisma schema constraints:

* **Daily check-in uniqueness**

  * `@@unique([userId, date])`
  * prevents double check-ins under concurrency

* **UserState 1:1 with User**

  * `@unique(userId)`

* **Tool ownership uniqueness** (if using quantity model)

  * unique `(userId, toolDefinitionId)`

These constraints guarantee correctness even if two requests race.

---

### Service-level invariants (business rules)

Enforced in service logic:

* check-in is allowed only once per UTC day
* streak increments or resets deterministically
* meters change by fixed deltas
* clamps:

  * `energy ≥ 0`
  * `fatigue ≥ 0`
  * `streak ≥ 0`
* inventory capacity limit (max N tools)
* cannot buy tools without enough loyalty
* cannot use tools you don’t own

---

## Transaction Boundaries

Any endpoint that mutates state uses a transaction.

---

### Check-in Transaction

One atomic unit:

1. create `DailyCheckIn (userId, today)`
2. check for yesterday’s check-in
3. compute new streak
4. update `UserState` (streak + meters)

If any step fails → nothing commits.

---

### Buy Tool Transaction

One atomic unit:

1. read `UserState.loyalty`
2. validate cost + capacity
3. decrement loyalty
4. add tool to inventory

---

### Use Tool Transaction

One atomic unit:

1. verify user owns tool
2. apply effect to `UserState`
3. decrement/remove tool from inventory

If effect validation fails → inventory is unchanged.

---

## Deterministic Rule Engine Approach

This project avoids a generic rules-engine framework.

Instead, rules are implemented as small, explicit functions:

* `computeStreak(hasYesterdayCheckIn, currentStreak)`
* `applyCheckInDelta(state)`
* `applyToolEffect(state, toolDefinition)`

Benefits:

* easy to unit test
* easy to reason about
* easy to extend
* no hidden side effects

---

## Project Structure (Actual Repo Layout)

```
src/
  checkins/
  common/
  entities/        (legacy, being removed)
  inventory/
  me/
  prisma/
    prisma.module.ts
    prisma.service.ts
  rewards/
  state/
  tools/
  users/

  app.module.ts
  main.ts
```

Prisma:

```
prisma/
  migrations/
  schema.prisma
  seed.ts
  migrate-entity-to-userstate.ts
```

---

## Error Handling Strategy

Consistent domain-level HTTP errors:

* `401 Unauthorized` — missing/invalid auth
* `404 Not Found` — missing user/state/tool
* `409 Conflict` — duplicate check-in, capacity exceeded
* `400 Bad Request` — validation failed
* `500 Internal Server Error` — unexpected

Prisma errors (e.g. `P2002`) are mapped to domain errors.

---

## Testing Strategy (Minimal but High-Signal)

### E2E Tests (highest value)

* duplicate check-in blocked
* streak increments and resets correctly
* tool buy fails without enough loyalty
* inventory capacity enforced
* tool use is atomic

---

### Unit Tests

* streak computation
* meter clamping
* tool effect application

---

## Security Notes

Current dev auth:

* `X-User-Id` header guard

Planned:

* register/login with bcrypt
* JWT access tokens
* auth guard populates `userId`

All protected endpoints depend only on authenticated identity.

---

## Summary

This backend is designed around a single principle:

> **State transitions must be deterministic, atomic, and protected by invariants.**

It uses:

* database constraints
* transactions
* explicit service-layer rules
* clean module boundaries

…to model a production-style state machine backend.