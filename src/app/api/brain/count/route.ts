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

  // Virtual table: atlas_papers → count thoughts where thought_type='atlas'
  if (table === 'atlas_papers') {
    try {
      const { count, error } = await supabaseServer
        .from('thoughts')
        .select('*', { count: 'exact', head: true })
        .eq('thought_type', 'atlas')

      if (error) {
        console.warn(`[/api/brain/count] Error counting atlas:`, error.message)
        return NextResponse.json({ table, count: 0 })
      }
      return NextResponse.json({ table, count: count ?? 0 })
    } catch (err) {
      console.error('[/api/brain/count] Unexpected error:', err)
      return NextResponse.json({ table, count: 0 })
    }
  }

  // Virtual table: memory → count thoughts where thought_type='memory'
  if (table === 'memory') {
    try {
      const { count, error } = await supabaseServer
        .from('thoughts')
        .select('*', { count: 'exact', head: true })
        .eq('thought_type', 'memory')

      if (error) {
        console.warn(`[/api/brain/count] Error counting memory:`, error.message)
        return NextResponse.json({ table, count: 0 })
      }
      return NextResponse.json({ table, count: count ?? 0 })
    } catch (err) {
      console.error('[/api/brain/count] Unexpected error:', err)
      return NextResponse.json({ table, count: 0 })
    }
  }

  // Virtual table: concepts → count thoughts where thought_type='concept'
  if (table === 'concepts') {
    try {
      const { count, error } = await supabaseServer
        .from('thoughts')
        .select('*', { count: 'exact', head: true })
        .eq('thought_type', 'concept')

      if (error) {
        console.warn(`[/api/brain/count] Error counting concepts:`, error.message)
        return NextResponse.json({ table, count: 0 })
      }
      return NextResponse.json({ table, count: count ?? 0 })
    } catch (err) {
      console.error('[/api/brain/count] Unexpected error:', err)
      return NextResponse.json({ table, count: 0 })
    }
  }

  // Virtual table: thoughts (non-atlas) — Knowledge Base count
  if (table === 'thoughts') {
    try {
      const { count, error } = await supabaseServer
        .from('thoughts')
        .select('*', { count: 'exact', head: true })
        .neq('thought_type', 'atlas')

      if (error) {
        console.warn(`[/api/brain/count] Error counting thoughts:`, error.message)
        return NextResponse.json({ table, count: 0 })
      }
      return NextResponse.json({ table, count: count ?? 0 })
    } catch (err) {
      console.error('[/api/brain/count] Unexpected error:', err)
      return NextResponse.json({ table, count: 0 })
    }
  }

  // Virtual table: testimonials → count thoughts where thought_type='testimonial'
  if (table === 'testimonials') {
    try {
      const { count, error } = await supabaseServer
        .from('thoughts')
        .select('*', { count: 'exact', head: true })
        .eq('thought_type', 'testimonial')
      if (error) return NextResponse.json({ table, count: 0 })
      return NextResponse.json({ table, count: count ?? 0 })
    } catch { return NextResponse.json({ table, count: 0 }) }
  }

  // Virtual table: linkedin_data → count thoughts where thought_type='linkedin'
  if (table === 'linkedin_data') {
    try {
      const { count, error } = await supabaseServer
        .from('thoughts')
        .select('*', { count: 'exact', head: true })
        .eq('thought_type', 'linkedin')
      if (error) return NextResponse.json({ table, count: 0 })
      return NextResponse.json({ table, count: count ?? 0 })
    } catch { return NextResponse.json({ table, count: 0 }) }
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
