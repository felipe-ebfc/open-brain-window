import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/brain/fyp?limit=20
 * 
 * "For You Page" — a curated mix of:
 * - Recent thoughts (last 7 days)
 * - Resurfaced older content (random selection from 7+ days ago)
 * 
 * Ratio: ~60% recent, ~40% resurfaced
 * Excludes linkedin* thought types — those have a dedicated page
 * Both recent and resurfaced arrays are shuffled for a fresh mix every load
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  const recentLimit = Math.ceil(limit * 0.6)
  const oldLimit = limit - recentLimit

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const cutoff = sevenDaysAgo.toISOString()

  try {
    // Recent: last 7 days, fetch a pool then shuffle for randomness
    const { data: recentPool, error: recentErr } = await supabaseServer
      .from('thoughts')
      .select('id, content, thought_type, tags, metadata, created_at')
      .gte('created_at', cutoff)
      .not('thought_type', 'like', 'linkedin%')
      .order('created_at', { ascending: false })
      .limit(200) // Fetch a pool to sample from

    if (recentErr) console.warn('[fyp] recent query error:', recentErr.message)

    // Shuffle recent pool and pick
    const recentShuffled = (recentPool || []).sort(() => Math.random() - 0.5)
    const recent = recentShuffled.slice(0, recentLimit)

    // Resurfaced: older than 7 days, random sample
    // Supabase doesn't have native random, so we fetch more and shuffle
    const { data: oldPool, error: oldErr } = await supabaseServer
      .from('thoughts')
      .select('id, content, thought_type, tags, metadata, created_at')
      .lt('created_at', cutoff)
      .not('thought_type', 'like', 'linkedin%')
      .order('created_at', { ascending: false })
      .limit(200) // Fetch a pool to sample from

    if (oldErr) console.warn('[fyp] old query error:', oldErr.message)

    // Shuffle and pick from old pool
    const resurfaced = (oldPool || []).sort(() => Math.random() - 0.5).slice(0, oldLimit)

    // Combine and format
    const items = [
      ...recent.map(r => ({ ...formatItem(r), section: 'recent' as const })),
      ...resurfaced.map(r => ({ ...formatItem(r), section: 'resurfaced' as const })),
    ]

    return NextResponse.json({
      items,
      counts: {
        recent: recent.length,
        resurfaced: resurfaced.length,
        total: items.length,
      },
    })
  } catch (err) {
    console.error('[fyp] Unexpected error:', err)
    return NextResponse.json({ items: [], counts: { recent: 0, resurfaced: 0, total: 0 } })
  }
}

function formatItem(row: any) {
  // Extract a title from content (first heading or first line)
  const lines = (row.content || '').split('\n')
  let title = lines[0]?.replace(/^#+\s*/, '').trim() || 'Untitled'
  if (title.length > 100) title = title.slice(0, 97) + '…'

  // Get body preview (skip first line/heading)
  const body = lines.slice(1).join('\n').trim().slice(0, 200)

  return {
    id: row.id,
    title,
    body,
    category: row.thought_type || 'general',
    tags: row.tags || [],
    date: row.metadata?.date || row.created_at,
    created_at: row.created_at,
  }
}
