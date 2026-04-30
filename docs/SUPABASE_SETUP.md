# Supabase Setup Guide

This guide will help you set up Supabase for your SIM-OPS application.

## Quick Fix for Current Error

The `fetch failed` error you're seeing is because Supabase credentials are not properly configured. Follow these steps:

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Publishable Key** (starts with `sb_publishable_`)

### Step 2: Update Your .env.local File

Replace the placeholder values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-actual-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 3: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Creating a New Supabase Project

If you don't have a Supabase project yet:

1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign in with GitHub
4. Click **New Project**
5. Fill in:
   - **Name**: simops (or any name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to you
6. Click **Create new project**
7. Wait 2-3 minutes for setup to complete

## Database Schema Setup

Once your project is ready, set up the database schema:

### Option 1: Using the SQL Editor (Recommended)

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Run the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'idle',
    last_action TEXT,
    actions_today INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_configs table
CREATE TABLE agent_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    thresholds JSONB DEFAULT '{}',
    triggers TEXT[] DEFAULT '{}',
    output_targets TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_decisions table
CREATE TABLE agent_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    output TEXT NOT NULL,
    severity TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    workflow_triggered TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_metrics table
CREATE TABLE agent_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    total_decisions INTEGER DEFAULT 0,
    avg_confidence DECIMAL(3,2) DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0,
    avg_response_time DECIMAL(5,2) DEFAULT 0,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_communications table
CREATE TABLE agent_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    to_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workflows table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    input_data JSONB NOT NULL,
    prediction JSONB NOT NULL,
    confidence DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agent_decisions_agent_id ON agent_decisions(agent_id);
CREATE INDEX idx_agent_decisions_created_at ON agent_decisions(created_at DESC);
CREATE INDEX idx_agent_communications_from ON agent_communications(from_agent_id);
CREATE INDEX idx_agent_communications_to ON agent_communications(to_agent_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on agents" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all operations on agent_configs" ON agent_configs FOR ALL USING (true);
CREATE POLICY "Allow all operations on agent_decisions" ON agent_decisions FOR ALL USING (true);
CREATE POLICY "Allow all operations on agent_metrics" ON agent_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations on agent_communications" ON agent_communications FOR ALL USING (true);
CREATE POLICY "Allow all operations on workflows" ON workflows FOR ALL USING (true);
CREATE POLICY "Allow all operations on predictions" ON predictions FOR ALL USING (true);
CREATE POLICY "Allow all operations on activity_logs" ON activity_logs FOR ALL USING (true);
```

4. Click **Run** or press `Ctrl+Enter`

### Option 2: Using the Migration Script

Run the setup script from your project:

```bash
npm run db:setup
```

## Seed Sample Data

To populate your database with sample agents:

```sql
-- Insert sample agents
INSERT INTO agents (id, name, role, description, status, actions_today) VALUES
('monitoring', 'Monitoring Agent', 'KPI deviation detection & threshold monitoring', 'Continuously monitors business KPIs against defined thresholds', 'active', 47),
('prediction', 'Prediction Agent', 'ML inference & risk scoring', 'Executes machine learning models to generate predictions', 'processing', 12),
('decision', 'Decision Agent', 'Severity classification & rule engine', 'Interprets predictions and monitoring alerts', 'active', 23),
('action', 'Action Agent', 'Workflow execution & automation triggers', 'Executes automated actions based on decisions', 'idle', 8),
('reporting', 'Reporting Agent', 'Summary generation & audit logging', 'Generates reports and maintains audit logs', 'active', 156),
('feedback', 'Feedback Agent', 'Outcome tracking & retraining triggers', 'Tracks outcomes and triggers model retraining', 'idle', 3);

-- Insert sample configs
INSERT INTO agent_configs (agent_id, enabled, thresholds, triggers, output_targets) VALUES
('monitoring', true, '{"churnRate": 3, "revenueDeviation": 5, "userGrowth": -2}', ARRAY['scheduled', 'event-based'], ARRAY['Decision Agent', 'Reporting Agent']),
('prediction', true, '{"minConfidence": 0.7, "anomalyScore": 0.8}', ARRAY['monitoring-agent', 'scheduled'], ARRAY['Decision Agent']),
('decision', true, '{"criticalThreshold": 0.8, "highThreshold": 0.6, "mediumThreshold": 0.4}', ARRAY['prediction-agent', 'monitoring-agent'], ARRAY['Action Agent', 'Reporting Agent']),
('action', true, '{"maxRetries": 3, "timeoutSeconds": 30}', ARRAY['decision-agent'], ARRAY['Reporting Agent', 'Feedback Agent']),
('reporting', true, '{"retentionDays": 90, "summaryFrequency": 1}', ARRAY['all-agents'], ARRAY['Dashboard', 'Email', 'Storage']),
('feedback', true, '{"driftThreshold": 0.1, "minSuccessRate": 0.7, "evaluationWindowDays": 7}', ARRAY['scheduled', 'manual'], ARRAY['Prediction Agent', 'Reporting Agent']);

-- Insert sample metrics
INSERT INTO agent_metrics (agent_id, total_decisions, avg_confidence, success_rate, avg_response_time) VALUES
('monitoring', 1247, 0.89, 0.96, 0.3),
('prediction', 456, 0.84, 0.91, 2.1),
('decision', 892, 0.91, 0.94, 0.5),
('action', 324, 0.98, 0.99, 1.2),
('reporting', 4521, 0.99, 1.0, 0.2),
('feedback', 89, 0.92, 0.97, 5.0);
```

## Troubleshooting

### Error: "fetch failed"

**Cause**: Invalid or missing Supabase credentials

**Solution**:

1. Verify your `.env.local` has correct values
2. Make sure the anon key is a JWT token (starts with `eyJ`)
3. Check that your Supabase project is active
4. Restart your dev server after changing `.env.local`

### Error: "Invalid API key"

**Cause**: Using the wrong key (service_role instead of anon)

**Solution**: Use the **Publishable** key, not the service_role key

### Error: "relation does not exist"

**Cause**: Database tables not created

**Solution**: Run the SQL schema setup from Step 1

### Error: "permission denied"

**Cause**: Row Level Security (RLS) policies not configured

**Solution**: Run the RLS policy SQL from the schema setup

### Connection Timeout

**Cause**: Network issues or Supabase project paused

**Solution**:

1. Check your internet connection
2. Verify project is active in Supabase dashboard
3. Try accessing Supabase dashboard directly
4. Check if you're behind a firewall/proxy

## Testing Your Connection

Create a test file to verify your setup:

```typescript
// test-supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function testConnection() {
  try {
    const { data, error } = await supabase.from("agents").select("count");

    if (error) {
      console.error("❌ Connection failed:", error.message);
    } else {
      console.log("✅ Connection successful!");
      console.log("Data:", data);
    }
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

testConnection();
```

Run it:

```bash
npx tsx test-supabase.ts
```

## Development Without Supabase

If you want to develop without Supabase temporarily, the middleware now fails open (allows access) when credentials are missing. However, data fetching will still fail.

To work completely offline, you can:

1. Use mock data (already available in `src/data/agentsData.ts`)
2. Comment out Supabase queries in hooks
3. Use local state management

## Production Checklist

Before deploying to production:

- [ ] Valid Supabase credentials in environment variables
- [ ] Database schema created
- [ ] RLS policies configured properly
- [ ] Indexes created for performance
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] Rate limiting configured
- [ ] API keys secured (not in git)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Support

If you continue to have issues:

1. Check the [Supabase Status Page](https://status.supabase.com/)
2. Review the [Supabase Discord](https://discord.supabase.com/)
3. Check your browser console for detailed errors
4. Review Next.js server logs
