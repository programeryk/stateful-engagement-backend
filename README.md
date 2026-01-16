# Stateful Engagement Backend

A RESTful backend API for a **stateful engagement and rewards system**.

The system tracks users through **daily check-ins**, maintains persistent state such as **streaks and energy**, and unlocks **rewards based on deterministic rules**.  
All critical operations are enforced at the **database level** using constraints and handled **atomically** to prevent race conditions.

This project is being developed as a **learning-focused, production-style backend**, modeling real-world patterns such as idempotent user initialization, state transitions, and reward ownership.

> !! This project is under active development. APIs and internal logic may change.

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

This will start a local PostgreSQL instance.

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

The API will be available at:

```
http://localhost:3000
```

---

## Database Design Notes

* **Unique constraints** are used to prevent duplicate daily check-ins
* User state updates are performed inside **transactions**
* Business rules are enforced as close to the data layer as possible
* This minimizes reliance on in-memory logic and protects against race conditions

---

## Why This Project Exists

This project is not meant to be a demo-only CRUD app.

It exists to practice:

* Designing **stateful backend systems**
* Modeling **domain logic**
* Working with **relational data and constraints**
* Writing code that would still make sense in a real production environment

---

## Future Work

* Authentication layer
* Expanded reward logic
* Rate limiting
* Deployment (Render/Fly.io)
* API documentation (OpenAPI / Swagger)

---

## License

This project is for educational and portfolio purposes.