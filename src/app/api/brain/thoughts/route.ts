import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/brain/thoughts?limit=50&offset=0&search=term
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 2000)
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''

  try {
    // Paginate past Supabase 1000-row limit
    const allRows: any[] = []
    let offset = 0
    const pageSize = 500

    while (allRows.length < limit) {
      let query = supabaseServer
        .from('thoughts')
        .select('id, content, thought_type, tags, people, source, metadata, created_at, user_id')
        .neq('thought_type', 'atlas')  // Atlas has its own specialized page
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (search) {
        query = query.ilike('content', `%${search}%`)
      }

      if (category) {
        query = query.eq('thought_type', category)
      }

      const { data, error } = await query
      if (error) {
        console.error('[/api/brain/thoughts] Supabase error:', error)
        break
      }

      allRows.push(...(data || []))
      if (!data || data.length < pageSize) break
      offset += pageSize
    }

    // Map thought_type → category to match the Thought type
    const thoughts = allRows.slice(0, limit).map((row) => ({
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
