# Micro-Drama Server

Node.js + Express backend server for the micro-drama streaming application.

## Prerequisites

- **Node.js** (LTS version recommended)
- **PostgreSQL** (12+)
- **npm** or **yarn**
- **Mux account** (for video streaming)
  - Get credentials from [Mux Dashboard](https://dashboard.mux.com/settings/access-tokens)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

**Option A: Using psql (command line)**
```bash
createdb microdrama
```

**Option B: Using pgAdmin**
- Open pgAdmin
- Create a new database named `microdrama`

**Option C: Using SQL**
```sql
CREATE DATABASE microdrama;
```

### 3. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://username:password@localhost:5432/microdrama
JWT_SECRET=your_jwt_secret_here_change_in_production
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
CORS_ORIGIN=http://localhost:8081
```

**Important Notes:**
- Replace `username` and `password` with your PostgreSQL credentials
- Generate a secure random string for `JWT_SECRET` (e.g., use `openssl rand -hex 32`)
- Get Mux credentials from [Mux Dashboard](https://dashboard.mux.com/settings/access-tokens)
- For mobile development, you may need to update `CORS_ORIGIN` to include your Expo dev server origin

**Optional:** For signed playback URLs (Mux signed tokens):
```env
MUX_SIGNING_KEY_ID=your_signing_key_id
MUX_SIGNING_KEY_PRIVATE=your_base64_encoded_private_key
```

### 4. Run Database Migrations

```bash
npm run migrate:up
```

This creates all required tables:
- `shows` - Show metadata
- `episodes` - Episode information with Mux playback IDs
- `ratings` - Like/dislike ratings
- `watch_history` - Episode watch status

### 5. Seed the Database (Optional)

Populate with sample data:

```bash
npm run seed
```

**Note:** This requires Mux assets to be configured. See [MUX_SETUP_STEP_BY_STEP.md](./docs/MUX_SETUP_STEP_BY_STEP.md) for detailed Mux setup.

### 6. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

### 7. Verify Server is Running

Check the health endpoint:

```bash
curl http://localhost:4000/api/v1/health
```

Expected response:
```json
{ "status": "ok" }
```

## Running the Server

### Development Mode
```bash
npm run dev
```
Runs with `ts-node-dev` for hot reloading.

### Production Mode
```bash
npm run build
npm start
```
Builds TypeScript and runs compiled JavaScript.

### Test Database Connection
```bash
npm run test:connection
```

## Project Structure

```
server/
├── src/
│   ├── config/           # Configuration (env, database, logger)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware (CORS, errors, logging)
│   ├── repositories/    # Database access layer
│   ├── routes/          # Route definitions
│   ├── schemas/         # Zod validation schemas
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── server.ts        # Express app entry point
├── migrations/          # SQL migration files
├── scripts/            # Utility scripts (migrate, seed, etc.)
└── package.json
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Health Check
- `GET /api/v1/health` - Server health status

### Shows
- `GET /api/v1/shows` - Get all shows with like/dislike counts
- `GET /api/v1/shows/:id` - Get show by ID with episodes

### Episodes
- `GET /api/v1/shows/:id/episodes` - Get episodes for a show
  - Query params:
    - `filterBy`: `all` | `watched` | `unwatched` (default: `all`)
    - `sortBy`: `title` | `order` | `created_at` (default: `order`)
    - `orderBy`: `asc` | `desc` (default: `asc`)

### Ratings
- `POST /api/v1/shows/:id/like` - Like or dislike a show
  - Body: `{ "ratingValue": 0 | 1 }` (0 = dislike, 1 = like)

## Database Schema

### Shows
- `id` (UUID, primary key)
- `title` (VARCHAR)
- `description` (TEXT, nullable)
- `cover_url` (VARCHAR, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Episodes
- `id` (UUID, primary key)
- `show_id` (UUID, foreign key)
- `title` (VARCHAR)
- `order` (INTEGER)
- `mux_playback_id` (VARCHAR) - Mux playback ID for HLS streaming
- `duration_sec` (INTEGER)
- `thumbnail_url` (VARCHAR, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Ratings
- `id` (UUID, primary key)
- `show_id` (UUID, foreign key)
- `rating_value` (INTEGER, 0 or 1)
- `created_at` (TIMESTAMP)

### Watch History
- `id` (UUID, primary key)
- `episode_id` (UUID, foreign key, unique)
- `watched` (BOOLEAN, default false)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Environment Variables

Required variables (validated on startup):

- `NODE_ENV` - Environment (`development` | `test` | `production`)
- `PORT` - Server port (default: `4000`)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing (generate secure random string)
- `MUX_TOKEN_ID` - Mux access token ID
- `MUX_TOKEN_SECRET` - Mux access token secret
- `CORS_ORIGIN` - Allowed origin for CORS

Optional variables:

- `MUX_SIGNING_KEY_ID` - Mux signing key ID (for signed playback URLs)
- `MUX_SIGNING_KEY_PRIVATE` - Base64-encoded Mux signing private key

## Database Migrations

### Apply Migrations
```bash
npm run migrate:up
```

### Rollback Migrations
```bash
npm run migrate:down
```

**Warning:** Rollback drops all tables. Use with caution.

## Utility Scripts

### List Mux Assets
```bash
npm run list:mux-assets
```

### Update Mux Playback IDs
```bash
npm run update:mux-ids
```

### Seed Database
```bash
npm run seed
```

### Test Database Connection
```bash
npm run test:connection
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Troubleshooting

### Database Connection Issues

**Problem:** Cannot connect to database

**Solutions:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check `DATABASE_URL` format: `postgres://user:pass@host:port/dbname`
3. Verify credentials are correct
4. Check PostgreSQL is accepting connections (check `pg_hba.conf`)

### Mux Configuration Issues

**Problem:** Videos not streaming

**Solutions:**
1. Verify Mux credentials are correct in `.env`
2. Check Mux assets exist in your Mux dashboard
3. Verify `mux_playback_id` values in database match Mux asset playback IDs
4. See [MUX_SETUP_STEP_BY_STEP.md](./docs/MUX_SETUP_STEP_BY_STEP.md) for detailed setup

### Port Already in Use

**Problem:** Port 4000 already in use

**Solutions:**
1. Change `PORT` in `.env` file
2. Kill process using port 4000:
   - Windows: `netstat -ano | findstr :4000` then `taskkill /PID <pid> /F`
   - macOS/Linux: `lsof -ti:4000 | xargs kill`

### Migration Errors

**Problem:** Migrations fail

**Solutions:**
1. Ensure database exists
2. Check database user has CREATE TABLE permissions
3. Verify no conflicting tables exist
4. Try running migrations one by one

## Type Checking

Check TypeScript types:
```bash
npm run typecheck
```

## Linting

Run ESLint:
```bash
npm run lint
```

## Mux Setup

For detailed Mux streaming setup instructions, see:
- [MUX_SETUP_STEP_BY_STEP.md](./docs/MUX_SETUP_STEP_BY_STEP.md)
- [MUX_STREAMING_SETUP.md](./docs/MUX_STREAMING_SETUP.md)
- [MUX_QUICK_START.md](./docs/MUX_QUICK_START.md)

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Generate secure `JWT_SECRET`: `openssl rand -hex 32`
3. Use environment-specific `DATABASE_URL`
4. Configure proper `CORS_ORIGIN` for your domain
5. Build: `npm run build`
6. Start: `npm start`

## Security Notes

- Never commit `.env` file to version control
- Use strong, random `JWT_SECRET` in production
- Keep Mux credentials secure
- Configure CORS appropriately for your domain
- Use HTTPS in production
- Consider rate limiting for public endpoints
