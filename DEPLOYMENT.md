# VoC Datalake - Deployment Guide

## Architecture Overview

| Component  | Service   | Details                              |
|-----------|-----------|--------------------------------------|
| Frontend  | Vercel    | React + Vite static site             |
| Backend   | Fly.io    | FastAPI (Docker), region: Singapore  |
| Database  | Supabase  | Managed PostgreSQL with pgvector     |

---

## Local Development

```bash
# Start all services locally
docker-compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# Postgres: localhost:5432
```

Set your Anthropic key in the environment before starting:
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
docker-compose up --build
```

---

## Setting Up Supabase (Production Database)

1. **Create a project** at [supabase.com/dashboard](https://supabase.com/dashboard)
   - Region: `ap-southeast-1` (Singapore) for proximity to Fly.io
   - Save your database password securely

2. **Enable pgvector** in the SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Run schema migration**:
   ```bash
   psql "postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" \
     -f backend/app/schema.sql
   ```

4. **Run materialized views**:
   ```bash
   psql "postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" \
     -f backend/app/materialized_views.sql
   ```

Or run the guided setup script:
```bash
bash scripts/setup-supabase.sh
```

---

## Deploying Backend to Fly.io

### First-time Setup

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Authenticate
flyctl auth login

# Launch the app (creates the app on Fly.io)
flyctl launch --no-deploy --config fly.toml

# Set secrets (do NOT put these in fly.toml)
flyctl secrets set DATABASE_URL="postgresql+asyncpg://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
flyctl secrets set DATABASE_URL_SYNC="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
flyctl secrets set ANTHROPIC_API_KEY="sk-ant-..."

# Deploy
flyctl deploy --remote-only --config fly.toml
```

### Subsequent Deploys

```bash
flyctl deploy --remote-only --config fly.toml
```

Or push to `main` and let GitHub Actions handle it (when `backend/**` files change).

### Useful Commands

```bash
flyctl status                  # Check app status
flyctl logs                    # Stream logs
flyctl ssh console             # SSH into the machine
flyctl secrets list            # List configured secrets
flyctl scale show              # Show current scaling config
```

---

## Deploying Frontend to Vercel

### First-time Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Link project (run from repo root)
cd frontend
vercel link

# Set environment variable in Vercel dashboard:
# VITE_API_URL = https://voc-datalake-api.fly.dev
```

### Manual Deploy

```bash
vercel --prod
```

### Automatic Deploy

Pushes to `main` that change `frontend/**` files trigger the GitHub Actions workflow automatically.

---

## GitHub Actions Secrets

Configure these in your repository settings under **Settings > Secrets and variables > Actions**:

| Secret               | Description                              | Where to find it                          |
|----------------------|------------------------------------------|-------------------------------------------|
| `VERCEL_TOKEN`       | Vercel personal access token             | Vercel Dashboard > Settings > Tokens      |
| `VERCEL_ORG_ID`      | Vercel organization/team ID              | `.vercel/project.json` after `vercel link`|
| `VERCEL_PROJECT_ID`  | Vercel project ID                        | `.vercel/project.json` after `vercel link`|
| `FLY_API_TOKEN`      | Fly.io deploy token                      | `flyctl tokens create deploy`             |

---

## Running Data Ingestion (Production)

To run the ingestion pipeline against the production Supabase database:

```bash
cd backend

DATABASE_URL_SYNC="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" \
ANTHROPIC_API_KEY="sk-ant-..." \
python -m app.ingestion.run_ingestion
```

---

## Environment Variables Reference

### Backend (Fly.io Secrets)

| Variable              | Description                        | Required |
|-----------------------|------------------------------------|----------|
| `DATABASE_URL`        | Async PostgreSQL connection string | Yes      |
| `DATABASE_URL_SYNC`   | Sync PostgreSQL connection string  | Yes      |
| `ANTHROPIC_API_KEY`   | Anthropic API key for Claude       | Yes      |
| `ENVIRONMENT`         | `development` or `production`      | No       |
| `CORS_ORIGINS`        | Comma-separated allowed origins    | No       |
| `ENRICHMENT_CONCURRENCY` | Concurrent enrichment tasks     | No       |
| `ENRICHMENT_MODEL`    | Claude model for enrichment        | No       |

### Frontend (Vercel Environment Variables)

| Variable       | Description                  | Required |
|---------------|------------------------------|----------|
| `VITE_API_URL` | Backend API base URL         | Yes      |

---

## Monitoring

- **Backend health**: `curl https://voc-datalake-api.fly.dev/api/health`
- **Backend logs**: `flyctl logs --config fly.toml`
- **Fly.io dashboard**: [fly.io/apps/voc-datalake-api](https://fly.io/apps/voc-datalake-api)
- **Vercel dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Supabase dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
