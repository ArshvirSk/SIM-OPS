#!/usr/bin/env node

/**
 * Apply Database Migrations
 * 
 * This script helps you apply migrations to your Supabase database.
 * Run this after setting up your .env.local file.
 */

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                  SIM-OPS DATABASE MIGRATION                      ║
╚══════════════════════════════════════════════════════════════════╝

📊 Your database schema includes:
   - 10 tables (agents, workflows, predictions, etc.)
   - 20 performance indexes
   - 36 security policies
   - 3 automatic triggers
   - Sample data for 6 agents and 4 workflows

⚠️  IMPORTANT: To apply these migrations:

Option 1 - Supabase Dashboard (Recommended):
───────────────────────────────────────────────
1. Open: https://supabase.com/dashboard/project/cqkixjoqanyjrxveycaa/sql/new

2. Copy and paste the entire contents of:
   supabase/migrations/20260208000000_initial_schema.sql

3. Click "Run" button

4. Copy and paste the entire contents of:
   supabase/migrations/20260208000001_seed_data.sql

5. Click "Run" button

Option 2 - Supabase CLI:
───────────────────────────────────────────────
1. Install Supabase CLI globally:
   npm install -g supabase

2. Link to your project:
   npx supabase link --project-ref cqkixjoqanyjrxveycaa

3. Push migrations:
   npx supabase db push

Option 3 - Manual SQL Client:
───────────────────────────────────────────────
Use any PostgreSQL client with your Supabase connection string.

After migration, verify with:
   npm run db:check

Expected output: "✅ Database connection successful! 📊 Found 6 agents"

╔══════════════════════════════════════════════════════════════════╗
║  Once migrations are complete, start the dev server:            ║
║  npm run dev                                                     ║
╚══════════════════════════════════════════════════════════════════╝
`);

process.exit(0);
