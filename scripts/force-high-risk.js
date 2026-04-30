const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

if (!process.env.CRON_SECRET) {
  console.error('❌ Error: Missing CRON_SECRET in .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function forceHighRisk() {
  // Get 5 random customers
  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .limit(5);

  console.log('Updating 5 customers to HIGH RISK (85% churn)...\n');

  for (const customer of customers) {
    // Delete existing prediction
    await supabase
      .from('ml_predictions')
      .delete()
      .eq('customer_id', customer.id)
      .eq('prediction_type', 'churn');

    // Insert HIGH RISK prediction with current timestamp
    await supabase.from('ml_predictions').insert({
      customer_id: customer.id,
      prediction_type: 'churn',
      prediction_data: {
        churn_probability: 0.85,
        risk_level: 'critical',
        confidence: 0.92,
        contributing_factors: [
          { factor: 'days_since_last_login', importance: 0.65, value: 45 },
          { factor: 'support_tickets', importance: 0.25, value: 8 },
          { factor: 'usage_frequency', importance: 0.10, value: 2 }
        ],
        recommended_actions: [
          'URGENT: Schedule immediate call',
          'Offer 30% discount',
          'Assign dedicated account manager'
        ]
      },
      model_version: '1.0.0',
      created_at: new Date().toISOString()
    });

    console.log(`✅ ${customer.id.substring(0, 8)} → 85% CRITICAL RISK`);
  }

  console.log('\n🚨 5 customers now at CRITICAL RISK (85% churn)');
  console.log('\nNow trigger aggregate check:');
  console.log(`curl -X POST http://localhost:3000/api/cron/predictions -H "Authorization: Bearer ${process.env.CRON_SECRET}" -H "Content-Type: application/json"`);
}

forceHighRisk();
