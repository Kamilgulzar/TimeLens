# TimeLens

Productivity intelligence platform that helps you understand how you spend your time.

## Tech Stack

- **Client**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Recharts, Framer Motion
- **Server**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Clerk (authentication & email verification) + JWT (API sessions)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Neon)

### Setup

1. **Clone and install dependencies:**

```bash
# Server
cd server
npm install

# Client
cd client
npm install
```

2. **Configure environment:**

```bash
# server/.env
DATABASE_URL="postgresql://user:password@localhost:5432/timelens"
JWT_SECRET="your-secret-key"            # signs API session JWTs
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_JWT_ISSUER="https://your-clerk-subdomain.clerk.accounts.dev"
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
PORT=5000

# client/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

3. **Set up database:**

```bash
cd server
npx prisma db push
```

4. **Run development servers:**

```bash
# Server (terminal 1)
cd server
npm run dev

# Client (terminal 2)
cd client
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
TImeLens/
├── client/          # Next.js frontend
│   └── src/
│       ├── app/         # Pages and layouts
│       ├── components/  # Reusable UI components
│       └── lib/         # Utilities, API client, auth
├── extension/       # Browser extension (time tracking)
├── server/          # Express backend
│   └── src/
│       ├── routes/       # Route definitions (versioned under /v1)
│       ├── controllers/  # Request handling / response shaping
│       ├── services/     # Business logic (auth, activity, extension, token)
│       ├── middleware/   # Auth (Clerk verify), validation, error handling
│       ├── lib/          # Prisma client, HTTP helpers, domain utils
│       ├── utils/        # Small pure helpers (e.g. mask)
│       ├── config/       # Env validation/access
│       ├── constants/    # App constants (categories)
│       └── prisma/       # Schema + migrations
└── README.md
```

## Backend Architecture

- **Layered design**: routes → controllers → services. Controllers only shape requests/responses; all business logic lives in services.
- **Auth**: Clerk handles authentication and email verification on the client; the server verifies the Clerk JWT (`middleware/auth.ts`) and issues its own short-lived API session JWT (`services/token.service.ts`).
- **Validation**: `express-validator` chains in routes, with a shared `handleValidationErrors` middleware.
- **Error handling**: services throw `AppError`; `lib/http.ts` provides `handleError` and `asyncHandler`, and `app.ts` registers a central 404 + error handler.
- **Config**: `config/env.ts` validates required env vars at boot and exposes typed accessors.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user (protected) |
| GET | `/api/health` | Health check |
=======
# TimeLens
>>>>>>> b66f5abbdc20a918b4860c946d9761c99d27f427
