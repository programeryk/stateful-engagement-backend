# Stateful Engagement Backend

A RESTful backend API for a **stateful engagement and rewards system**.

The system tracks users through **daily check-ins**, maintains persistent state such as **streaks and energy**, and unlocks **rewards based on deterministic rules**.  
All critical operations are enforced at the **database level** using constraints and handled **atomically** to prevent race conditions.

This project is being developed as a **learning-focused, production-style backend**, modeling real-world patterns such as idempotent user initialization, state transitions, and reward ownership.

> ⚠️ This project is under active development. APIs and internal logic may change.

---

## Core Concepts

- **Users** perform daily check-ins
- Each user has a persistent **state** (e.g. streak, energy)
- Check-ins affect state in a deterministic way
- **Rewards** are unlocked when conditions are met (e.g. streak milestones)
- A reward can only be claimed **once**
- All invariants are enforced at the **database level**

---

## Key Features

- REST API built with **NestJS**
- **Daily check-in system** with streak tracking
- Persistent user state stored in PostgreSQL
- **Idempotent user bootstrapping**
- Protection against duplicate actions using **unique constraints**
- Atomic state updates using **database transactions**
- Reward ownership tracking
- Designed to reflect **real production backend patterns**

---

## Tech Stack

- **TypeScript**
- **Node.js**
- **NestJS**
- **PostgreSQL**
- **Prisma ORM**
- **Docker** (local development)

---

## Project Status

- Core domain logic implemented
- Database schema with constraints in place
- Check-in and reward logic working
- API surface still evolving
- Deployment planned (not yet live)

---

## Getting Started (Local Development)

### Prerequisites

- Node.js (v18+ recommended)
- Docker & Docker Compose
- npm

---

### Clone the Repository

```bash
git clone https://github.com/programeryk/stateful-engagement-backend
cd stateful-engagement-backend
