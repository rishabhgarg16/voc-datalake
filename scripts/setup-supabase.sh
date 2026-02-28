#!/usr/bin/env bash
# ==============================================================================
# Supabase Setup Script for VoC Datalake
# ==============================================================================
# This script prints step-by-step instructions for setting up Supabase as the
# managed PostgreSQL backend for the VoC Datalake project.
# ==============================================================================

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BOLD}==========================================================${NC}"
echo -e "${BOLD}  VoC Datalake - Supabase Setup Guide${NC}"
echo -e "${BOLD}==========================================================${NC}"
echo ""

echo -e "${CYAN}Step 1: Create a Supabase Project${NC}"
echo "  - Go to https://supabase.com/dashboard"
echo "  - Click 'New Project'"
echo "  - Choose your organization"
echo "  - Name: voc-datalake"
echo "  - Region: Pick the region closest to your Fly.io deployment (ap-southeast-1 for Singapore)"
echo "  - Set a strong database password and save it securely"
echo ""

echo -e "${CYAN}Step 2: Enable pgvector Extension${NC}"
echo "  - Go to your project's SQL Editor in the Supabase dashboard"
echo "  - Run the following SQL:"
echo ""
echo -e "${GREEN}    CREATE EXTENSION IF NOT EXISTS vector;${NC}"
echo ""

echo -e "${CYAN}Step 3: Run the Schema Migration${NC}"
echo "  - In the SQL Editor, paste and run the contents of:"
echo "    backend/app/schema.sql"
echo ""
echo "  Or via CLI with psql:"
echo ""
echo -e "${GREEN}    psql \"postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres\" \\\\${NC}"
echo -e "${GREEN}      -f backend/app/schema.sql${NC}"
echo ""

echo -e "${CYAN}Step 4: Run Materialized Views${NC}"
echo "  - In the SQL Editor, paste and run the contents of:"
echo "    backend/app/materialized_views.sql"
echo ""
echo "  Or via CLI:"
echo ""
echo -e "${GREEN}    psql \"postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres\" \\\\${NC}"
echo -e "${GREEN}      -f backend/app/materialized_views.sql${NC}"
echo ""

echo -e "${CYAN}Step 5: Get Your Connection String${NC}"
echo "  - Go to Project Settings > Database in Supabase dashboard"
echo "  - Copy the 'Connection string' (URI format)"
echo "  - It looks like:"
echo ""
echo -e "${GREEN}    postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres${NC}"
echo ""
echo -e "${YELLOW}  NOTE: For asyncpg (used by the backend), use this format:${NC}"
echo -e "${GREEN}    postgresql+asyncpg://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres${NC}"
echo ""

echo -e "${CYAN}Step 6: Set Fly.io Secrets${NC}"
echo "  - Set the DATABASE_URL (asyncpg variant) and ANTHROPIC_API_KEY as Fly.io secrets:"
echo ""
echo -e "${GREEN}    flyctl secrets set DATABASE_URL=\"postgresql+asyncpg://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres\"${NC}"
echo ""
echo -e "${GREEN}    flyctl secrets set DATABASE_URL_SYNC=\"postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres\"${NC}"
echo ""
echo -e "${GREEN}    flyctl secrets set ANTHROPIC_API_KEY=\"sk-ant-...\"${NC}"
echo ""

echo -e "${BOLD}==========================================================${NC}"
echo -e "${BOLD}  Running Data Ingestion Against Supabase${NC}"
echo -e "${BOLD}==========================================================${NC}"
echo ""
echo "  To run the ingestion pipeline against your Supabase database:"
echo ""
echo -e "${GREEN}    cd backend${NC}"
echo -e "${GREEN}    DATABASE_URL_SYNC=\"postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres\" \\\\${NC}"
echo -e "${GREEN}    ANTHROPIC_API_KEY=\"sk-ant-...\" \\\\${NC}"
echo -e "${GREEN}    python -m app.ingestion.run_ingestion${NC}"
echo ""

echo -e "${BOLD}==========================================================${NC}"
echo -e "${BOLD}  Verification${NC}"
echo -e "${BOLD}==========================================================${NC}"
echo ""
echo "  After setup, verify the connection by running:"
echo ""
echo -e "${GREEN}    flyctl ssh console -C \"python -c \\\"from app.config import settings; print(settings.database_url[:30] + '...')\\\"\"${NC}"
echo ""
echo "  Or check the health endpoint:"
echo ""
echo -e "${GREEN}    curl https://voc-datalake-api.fly.dev/api/health${NC}"
echo ""
echo -e "${BOLD}Setup guide complete.${NC}"
