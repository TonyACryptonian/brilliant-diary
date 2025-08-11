import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

export function getSupabaseClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Please set them in your environment.",
    )
  }

  client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: { params: { eventsPerSecond: 10 } },
  })
  return client
}
