# Micro-Drama Server - Phases 1 & 2A

Phase 1 (Data Layer) is implemented, and Phase 2A (Backend API) has been added: Express server with routes, controllers, services, validation, and middleware.

## Setup

### Prerequisites

- Node.js (LTS)
- PostgreSQL (Windows version already installed)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Install server runtime dependencies (Express, security, CORS, logging):
```bash
npm i express cors helmet pino pino-http pino-pretty
npm i -D @types/express @types/cors @types/helmet
```

3. Create the database (or use pgAdmin/psql):
```bash
createdb microdrama
```

4. Set environment variables:
- Option A (PowerShell session):
```powershell
$env:NODE_ENV="development"
$env:PORT="4000"
$env:DATABASE_URL="postgres://user:pass@localhost:5432/microdrama"
$env:JWT_SECRET="change_me"
$env:MUX_TOKEN_ID="your_mux_id"
$env:MUX_TOKEN_SECRET="your_mux_secret"
$env:CORS_ORIGIN="http://localhost:8081"
```
- Option B (dotenv): create a `.env` file in `server/` with the same keys above and run dev with `-r dotenv/config` (see Run section).

### Running Migrations

Apply database migrations:
```bash
npm run migrate:up
```

Rollback migrations (drops all tables):
```bash
npm run migrate:down
```

### Seeding the Database

Populate the database with sample data:
```bash
npm run seed
```

### Run the Server (Phase 2A)

Start in dev mode (if envs set in shell):
```bash
npm run dev
```

Start in dev mode using `.env` (dotenv preload):
```bash
npx ts-node-dev --respawn --transpile-only -r dotenv/config src/server.ts
```

Health check:
```bash
curl http://localhost:4000/api/v1/health
```
Expected: `{ "status": "ok" }`

## Environment Variables

The server validates required environment variables via Zod in `src/config/env.ts`. Ensure these are set in your shell or a local `.env` file (see the setup section above for options).

- `NODE_ENV` — `development` | `test` | `production` (default: `development`)
- `PORT` — server port (default: `4000`)
- `DATABASE_URL` — PostgreSQL connection string (required)
- `JWT_SECRET` — secret for JWT signing (required)
- `MUX_TOKEN_ID` — Mux access token ID (required)
- `MUX_TOKEN_SECRET` — Mux access token secret (required)
- `CORS_ORIGIN` — allowed origin for CORS (required)

Example `.env`:
```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://user:pass@localhost:5432/microdrama
JWT_SECRET=change_me
MUX_TOKEN_ID=your_mux_id
MUX_TOKEN_SECRET=your_mux_secret
CORS_ORIGIN=http://localhost:8081
```

### API Endpoints

- GET `/api/v1/health`
- GET `/api/v1/shows`
- GET `/api/v1/shows/:id`
- GET `/api/v1/shows/:id/episodes?filterBy=all|watched|unwatched&sortBy=title|order|created_at&orderBy=asc|desc`
- POST `/api/v1/shows/:id/like` body: `{ "ratingValue": 0 | 1 }`

## Project Structure

```
server/
├── src/
│   ├── types/             # TypeScript type definitions
│   │   ├── show.ts
│   │   ├── episode.ts
│   │   ├── rating.ts
│   │   └── filters.ts
│   ├── repositories/      # Database query functions
│   │   ├── shows.ts
│   │   ├── episodes.ts
│   │   ├── ratings.ts
│   │   └── watchHistory.ts
│   ├── services/          # Business logic
│   │   ├── shows.ts
│   │   └── ratings.ts
│   ├── controllers/       # Thin controllers with Zod validation
│   │   ├── shows.ts
│   │   └── ratings.ts
│   ├── routes/            # Express routes (mounted under /api/v1)
│   │   ├── health.routes.ts
│   │   ├── shows.routes.ts
│   │   └── ratings.routes.ts
│   ├── schemas/           # Zod schemas for params, query, responses
│   │   ├── shows.schema.ts
│   │   ├── episodes.schema.ts
│   │   └── ratings.schema.ts
│   ├── middleware/        # Security, CORS, logging, error handling
│   │   ├── errorHandler.ts
│   │   ├── cors.ts
│   │   ├── helmet.ts
│   │   └── requestLogger.ts
│   ├── config/            # Env, database, logger
│   │   ├── env.ts
│   │   ├── database.ts
│   │   └── logger.ts
│   └── server.ts          # Express app bootstrap
├── migrations/          # SQL migration files
│   ├── 001_create_shows_table.sql
│   ├── 002_create_episodes_table.sql
│   ├── 003_create_ratings_table.sql
│   └── 004_create_watch_history_table.sql
├── scripts/
│   ├── migrate-up.ts    # Apply migrations
│   ├── migrate-down.ts # Rollback migrations
│   └── seed.ts          # Seed sample data
└── package.json
```

## Database Schema

### Shows Table
- `id` (UUID, primary key)
- `title` (VARCHAR)
- `description` (TEXT, nullable)
- `cover_url` (VARCHAR, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Episodes Table
- `id` (UUID, primary key)
- `show_id` (UUID, foreign key to shows)
- `title` (VARCHAR)
- `order` (INTEGER)
- `mux_playback_id` (VARCHAR)
- `duration_sec` (INTEGER)
- `thumbnail_url` (VARCHAR, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- Unique constraint on (`show_id`, `order`)

### Ratings Table
- `id` (UUID, primary key)
- `show_id` (UUID, foreign key to shows)
- `rating_value` (INTEGER, 0 or 1)
- `created_at` (TIMESTAMP)

### Watch History Table
- `id` (UUID, primary key)
- `episode_id` (UUID, foreign key to episodes, UNIQUE)
- `watched` (BOOLEAN, default false)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Repository Functions

### Shows Repository (`src/repositories/shows.ts`)

- `getAllShows(pool)` - Get all shows with computed likes/dislikes
- `getShowById(pool, id)` - Get show with episodes list

### Episodes Repository (`src/repositories/episodes.ts`)

- `getEpisodesByShowId(pool, showId, filters?, sortOptions?)` - Get episodes with filtering and sorting

### Ratings Repository (`src/repositories/ratings.ts`)

- `createRating(pool, showId, ratingValue)` - Create a rating (like or dislike)
- `getRatingCounts(pool, showId)` - Get likes/dislikes counts for a show

### Watch History Repository (`src/repositories/watchHistory.ts`)

- `markEpisodeAsWatched(pool, episodeId)` - Mark episode as watched (upsert)
- `getWatchStatus(pool, episodeId)` - Get watch status for an episode

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Tests require a database connection. Set `TEST_DATABASE_URL` environment variable if you want to use a separate test database, otherwise tests will use `DATABASE_URL`.

Notes:
- API health route has a smoke test using `supertest` at `src/__tests__/health.test.ts`. It runs as part of `npm test`.
- To run only the health test:
```bash
npx jest src/__tests__/health.test.ts
```

## Type Checking

Check TypeScript types:
```bash
npm run typecheck
```

## Next Steps

Completed:
- Phase 1: Data Layer (migrations, repositories, types)
- Phase 2A: Backend API (Express server, routes, controllers, services, schemas, middleware)

Upcoming:
- Phase 2B: Mobile App Foundation (Expo setup, navigation, state management)
- Phase 3: Mobile App UI & Video Playback
- Phase 4: Integration & Polish

