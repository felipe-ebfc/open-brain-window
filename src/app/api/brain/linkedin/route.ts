import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const TYPE_MAP: Record<string, string> = {
  connections: 'linkedin-connection',
  posts: 'linkedin-post',
  comments: 'linkedin-comment',
  endorsements: 'linkedin-endorsement',
  positions: 'linkedin-position',
}

// GET /api/brain/linkedin?type=posts&limit=50&offset=0
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'posts'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // Get counts per type
    const countPromises = Object.entries(TYPE_MAP).map(async ([key, dbType]) => {
      const { count } = await supabaseServer
        .from('thoughts')
        .select('*', { count: 'exact', head: true })
        .eq('thought_type', dbType)
      return [key, count ?? 0] as [string, number]
    })
    const countsArr = await Promise.all(countPromises)
    const counts = Object.fromEntries(countsArr) as Record<string, number>

    // Fetch items for the requested type
    let items: any[] = []

    if (type === 'all') {
      // Paginate through all linkedin-* types
      const allRows: any[] = []
      let batchOffset = offset
      const pageSize = 500

      while (allRows.length < limit) {
        const { data, error } = await supabaseServer
          .from('thoughts')
          .select('id, content, thought_type, tags, metadata, created_at')
          .like('thought_type', 'linkedin%')
          .order('created_at', { ascending: false })
          .range(batchOffset, batchOffset + pageSize - 1)

        if (error || !data) break
        allRows.push(...data)
        if (data.length < pageSize) break
        batchOffset += pageSize
      }
      items = allRows.slice(0, limit)
    } else {
      const dbType = TYPE_MAP[type]
      if (!dbType) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
      }

      // Paginate past 1000-row Supabase limit if needed
      const allRows: any[] = []
      let batchOffset = offset
      const pageSize = 500

      while (allRows.length < limit) {
        const { data, error } = await supabaseServer
          .from('thoughts')
          .select('id, content, thought_type, tags, metadata, created_at')
          .eq('thought_type', dbType)
          .order('created_at', { ascending: false })
          .range(batchOffset, batchOffset + pageSize - 1)

        if (error || !data) break
        allRows.push(...data)
        if (data.length < pageSize) break
        batchOffset += pageSize
      }
      items = allRows.slice(0, limit)
    }

    return NextResponse.json({ items, counts, type })
  } catch (err) {
    console.error('[/api/brain/linkedin] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
