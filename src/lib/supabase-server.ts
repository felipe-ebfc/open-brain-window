import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('[supabase-server] NEXT_PUBLIC_SUPABASE_URL is not set or is a placeholder')
}

if (!supabaseServiceRoleKey || supabaseServiceRoleKey === 'placeholder-service-role-key') {
  console.warn('[supabase-server] SUPABASE_SERVICE_ROLE_KEY is not set or is a placeholder')
}

// Server-side client with service role key — bypasses RLS.
// NEVER import this in client components.
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Tables that actually exist in Supabase
export const KNOWN_TABLES = new Set([
  'thoughts',
  'intakes',
  'inbox',
  'provision_queue',
  'user_schemas',
])
