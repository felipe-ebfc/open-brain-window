import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/brain/atlas?limit=500&offset=0&search=term&era=IGLC-29&category=Safety
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 1500)
  const offset = parseInt(searchParams.get('offset') || '0')
  const search = searchParams.get('search') || ''
  const era = searchParams.get('era') || ''
  const category = searchParams.get('category') || ''

  try {
    // Fetch all atlas papers using pagination (Supabase default limit is 1000)
    const allData: any[] = []
    const pageSize = 1000
    let page = 0
    let totalCount = 0

    while (true) {
      let query = supabaseServer
        .from('thoughts')
        .select('id, content, thought_type, tags, source, metadata, created_at', { count: 'exact' })
        .eq('thought_type', 'atlas')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (search) {
        query = query.ilike('content', `%${search}%`)
      }

      if (era) {
        const eraNum = era.replace('IGLC-', '')
        query = query.ilike('source', `iglc-${eraNum}-%`)
      }

      const { data: pageData, error: pageError, count } = await query

      if (pageError) {
        console.error('[/api/brain/atlas] Supabase error:', pageError)
        return NextResponse.json({ error: pageError.message }, { status: 500 })
      }

      if (count != null) totalCount = count
      if (!pageData || pageData.length === 0) break

      allData.push(...pageData)
      if (pageData.length < pageSize) break
      page++
    }

    const data = allData

    // Map thoughts → AtlasPaper shape
    const papers = (data || []).map((row) => {
      const meta = (row.metadata || {}) as Record<string, unknown>
      const bullets = (meta.summary_bullets as string[]) || []
      const iglcNum = meta.iglc as number | undefined
      const theme = (meta.theme as string) || null
      const sector = (meta.sector as string) || null

      return {
        id: row.id,
        title: (meta.title as string) || 'Untitled',
        authors: null, // not captured in classifications
        year: (meta.year as number) || null,
        era: iglcNum ? `IGLC-${iglcNum}` : null,
        category: theme || sector || null,
        sector: sector || null,
        theme: theme || null,
        summary: bullets.length > 0 ? bullets.map(b => `• ${b}`).join('\n') : null,
        metrics: (meta.mentions_performance_metrics as boolean) || false,
        created_at: row.created_at,
      }
    })

    // Category filter (post-query since it's in metadata JSON)
    const filtered = category
      ? papers.filter(p => p.category === category || p.theme === category || p.sector === category)
      : papers

    return NextResponse.json({
      papers: filtered,
      count: filtered.length,
      total: totalCount ?? papers.length,
    })
  } catch (err) {
    console.error('[/api/brain/atlas] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
