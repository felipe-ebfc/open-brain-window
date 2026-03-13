import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, KNOWN_TABLES } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/brain/count?table=thoughts
// Returns 0 gracefully for tables that don't exist yet
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table') || ''

  if (!table) {
    return NextResponse.json({ error: 'Missing table param' }, { status: 400 })
  }

  // Tables that haven't been created yet → return 0, no error
  if (!KNOWN_TABLES.has(table)) {
    return NextResponse.json({ table, count: 0 })
  }

  try {
    const { count, error } = await supabaseServer
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      // If table just doesn't exist or access is denied, return 0 gracefully
      console.warn(`[/api/brain/count] Error counting ${table}:`, error.message)
      return NextResponse.json({ table, count: 0 })
    }

    return NextResponse.json({ table, count: count ?? 0 })
  } catch (err) {
    console.error('[/api/brain/count] Unexpected error:', err)
    return NextResponse.json({ table, count: 0 })
  }
}
