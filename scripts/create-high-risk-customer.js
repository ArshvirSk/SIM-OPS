const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createHighRiskCustomers() {
  // Get 3 random customers
  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .limit(3);

  console.log('Creating high-risk predictions for 3 customers...');

  for (const customer of customers) {
    // Insert high-risk churn prediction
    await supabase.from('ml_predictions').insert({
      customer_id: customer.id,
      prediction_type: 'churn',
      prediction_data: {
        churn_probability: 0.85, // 85% - critical risk
        risk_level: 'critical',
        confidence: 0.92,
        contributing_factors: [
          { factor: 'days_since_last_login', importance: 0.65, value: 45 },
          { factor: 'support_tickets', importance: 0.25, value: 8 },
          { factor: 'usage_frequency', importance: 0.10, value: 2 }
        ],
        recommended_actions: [
          'URGENT: Schedule immediate call with customer success manager',
          'Offer 30% discount for next 3 months',
          'Assign dedicated account manager'
        ]
      },
      model_version: '1.0.0'
    });

    console.log(`✅ Created critical risk prediction for ${customer.id.substring(0, 8)}`);
  }

  console.log('\n✅ Done! Now run the cron job to trigger the voice call.');
}

createHighRiskCustomers();
