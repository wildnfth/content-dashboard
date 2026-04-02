import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigError = !supabaseUrl || !supabaseAnonKey
  ? 'Supabase environment variables are missing.'
  : null

export const supabaseClient = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)

export function requireSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(supabaseConfigError ?? 'Supabase client could not be initialized.')
  }

  return supabaseClient
}
