import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type BrowserSupabaseClient = SupabaseClient<Database>;

/**
 * Module-level singleton so client components and hooks share a single browser
 * client instance instead of creating a new one on every render.
 */
let browserClient: BrowserSupabaseClient | null = null;

function createBrowserSupabaseClient(): BrowserSupabaseClient {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export function createClient(): BrowserSupabaseClient {
  // During SSR / prerender there is no browser singleton to share; fall back to
  // a throwaway client so the import stays safe on the server.
  if (typeof window === 'undefined') {
    return createBrowserSupabaseClient();
  }

  if (!browserClient) {
    browserClient = createBrowserSupabaseClient();
  }

  return browserClient;
}
