const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { count: customers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });
  const { count: transactions } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true });
  const { count: incidents } = await supabase
    .from("incidents")
    .select("*", { count: "exact", head: true });
  const { count: predictions } = await supabase
    .from("predictions")
    .select("*", { count: "exact", head: true });

  console.log(
    JSON.stringify(
      { customers, transactions, incidents, predictions },
      null,
      2,
    ),
  );
}

check().catch(console.error);
