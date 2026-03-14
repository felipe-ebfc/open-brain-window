import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for Open Brain tables
export type FeedItem = {
  id: string
  title: string
  body: string
  source: 'atlas' | 'relationships' | 'thoughts' | 'general'
  created_at: string
  link?: string
}

export type Thought = {
  id: string
  content: string
  category: string
  tags?: string[]
  people?: string[]
  created_at: string
  source?: string
  similarity?: number
}

export type AtlasPaper = {
  id: string
  title: string
  authors?: string
  year?: number
  era?: string // IGLC 29-34
  category?: string
  summary?: string
  url?: string
  created_at: string
}

export type Testimonial = {
  id: string
  quote: string
  author?: string
  session?: string
  rating?: number
  created_at: string
}

export type Relationship = {
  id: string
  name: string
  role?: string | null
  company?: string | null
  org?: string | null // alias for company
  last_contact?: string | null
  warmth?: number | null // 1-5
  tags?: string[]
  notes?: string | null
  source?: 'manual' | 'linkedin'
  created_at: string
}
