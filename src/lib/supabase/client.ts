import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Singleton client for client components
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}
