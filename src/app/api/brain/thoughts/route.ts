import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/brain/thoughts?limit=50&offset=0&search=term
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
  const offset = parseInt(searchParams.get('offset') || '0')
  const search = searchParams.get('search') || ''

  try {
    // Exclude embedding column — it's a huge vector, kills performance
    let query = supabaseServer
      .from('thoughts')
      .select('id, content, thought_type, tags, people, source, metadata, created_at, user_id')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      // Full-text-style search on content (ilike is good enough for now)
      query = query.ilike('content', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[/api/brain/thoughts] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map thought_type → category to match the Thought type
    const thoughts = (data || []).map((row) => ({
      id: row.id,
      content: row.content,
      category: row.thought_type || null,
      tags: row.tags || [],
      people: row.people || [],
      source: row.source || null,
      metadata: row.metadata || null,
      created_at: row.created_at,
      user_id: row.user_id,
    }))

    return NextResponse.json({ thoughts, count: thoughts.length })
  } catch (err) {
    console.error('[/api/brain/thoughts] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
