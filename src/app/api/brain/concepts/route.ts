import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/brain/concepts?limit=500&search=term
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 1000)
  const search = searchParams.get('search') || ''

  // Paginate past Supabase 1000-row limit
  const allConcepts: any[] = []
  let offset = 0
  const pageSize = 500

  while (true) {
    let query = supabaseServer
      .from('thoughts')
      .select('id, content, metadata, tags, created_at')
      .eq('thought_type', 'concept')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (search) {
      query = query.ilike('content', `%${search}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error('[concepts] Query error:', error.message)
      break
    }

    allConcepts.push(...(data || []))
    if (!data || data.length < pageSize || allConcepts.length >= limit) break
    offset += pageSize
  }

  return NextResponse.json({
    concepts: allConcepts.slice(0, limit),
    count: allConcepts.length,
  })
}
