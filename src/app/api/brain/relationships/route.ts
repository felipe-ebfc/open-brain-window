import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Parse legacy manual entry format:
// Name: Jane Doe
// Role: Product Manager
// Company: Acme Corp
// Notes: Met at IGLC 2024...
function parseContent(content: string): { name: string; role?: string; company?: string; notes?: string } {
  const lines = (content || '').split('\n')
  const map: Record<string, string> = {}
  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx > -1) {
      const key = line.slice(0, colonIdx).trim().toLowerCase()
      const value = line.slice(colonIdx + 1).trim()
      if (value) map[key] = value
    }
  }
  return {
    name: map['name'] || lines[0]?.trim() || 'Unknown',
    role: map['role'],
    company: map['company'],
    notes: map['notes'],
  }
}

function formatContent(name: string, role?: string, company?: string, notes?: string): string {
  const lines = [`Name: ${name}`]
  if (role) lines.push(`Role: ${role}`)
  if (company) lines.push(`Company: ${company}`)
  if (notes) lines.push(`Notes: ${notes}`)
  return lines.join('\n')
}

function toRelationship(row: any) {
  const meta = (row.metadata || {}) as Record<string, unknown>

  // New extraction pipeline format: metadata has name, company, position, sources, etc.
  if (meta.name) {
    return {
      id: row.id,
      name: (meta.name as string) || 'Unknown',
      position: (meta.position as string) || null,
      company: (meta.company as string) || null,
      warmth: typeof meta.warmth === 'number' ? (meta.warmth as number) : null,
      brain_mentions: (meta.brain_mentions as number) || 0,
      linkedin_interactions: (meta.linkedin_interactions as number) || 0,
      has_testimonial: (meta.has_testimonial as boolean) || false,
      has_endorsement: (meta.has_endorsement as boolean) || false,
      email: (meta.email as string) || null,
      linkedin_url: (meta.linkedin_url as string) || null,
      connected_on: (meta.connected_on as string) || null,
      sources: (meta.sources as string[]) || [],
      tags: row.tags || [],
      created_at: row.created_at,
    }
  }

  // Legacy manual entry format
  const parsed = parseContent(row.content || '')
  return {
    id: row.id,
    name: parsed.name,
    position: (meta.role as string) || parsed.role || null,
    company: (meta.company as string) || parsed.company || null,
    warmth: typeof meta.warmth === 'number' ? (meta.warmth as number) : null,
    brain_mentions: 0,
    linkedin_interactions: 0,
    has_testimonial: false,
    has_endorsement: false,
    email: null,
    linkedin_url: null,
    connected_on: (meta.last_contact as string) || null,
    sources: ['manual'],
    tags: row.tags || [],
    created_at: row.created_at,
  }
}

// GET /api/brain/relationships?search=&warmth=&source=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const warmthParam = searchParams.get('warmth')
  const warmthFilter = warmthParam ? parseInt(warmthParam) : null
  const sourceFilter = searchParams.get('source') || ''

  try {
    // Fetch all relationships using pagination (Supabase default limit is 1000)
    const allData: any[] = []
    const pageSize = 1000
    let page = 0
    let totalCount = 0

    while (true) {
      const { data: pageData, error: pageError, count } = await supabaseServer
        .from('thoughts')
        .select('id, content, tags, metadata, created_at', { count: 'exact' })
        .eq('thought_type', 'relationship')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (pageError) {
        console.error('[/api/brain/relationships] Supabase error:', pageError)
        return NextResponse.json({ error: pageError.message }, { status: 500 })
      }

      if (count != null) totalCount = count
      if (!pageData || pageData.length === 0) break

      allData.push(...pageData)
      if (pageData.length < pageSize) break
      page++
    }

    // Map rows to relationship shape (handles both new and legacy formats)
    let items = allData.map(toRelationship)

    // Optional server-side filters
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.position || '').toLowerCase().includes(q) ||
        (r.company || '').toLowerCase().includes(q)
      )
    }

    if (warmthFilter !== null && !isNaN(warmthFilter)) {
      items = items.filter(r => r.warmth === warmthFilter)
    }

    if (sourceFilter) {
      items = items.filter(r => (r.sources || []).includes(sourceFilter))
    }

    return NextResponse.json({
      items,
      count: items.length,
      total: totalCount,
    })
  } catch (err) {
    console.error('[/api/brain/relationships] Unexpected error:', err)
    return NextResponse.json({ items: [], count: 0, total: 0 }, { status: 500 })
  }
}

// POST /api/brain/relationships — legacy manual entry support
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, role, company, notes, tags, warmth, last_contact } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const clampedWarmth = warmth
      ? Math.max(1, Math.min(5, parseInt(String(warmth))))
      : 3

    const { data, error } = await supabaseServer
      .from('thoughts')
      .insert({
        content: formatContent(name.trim(), role?.trim(), company?.trim(), notes?.trim()),
        thought_type: 'relationship',
        tags: tags || [],
        metadata: {
          warmth: clampedWarmth,
          last_contact: last_contact || null,
          role: role?.trim() || null,
          company: company?.trim() || null,
          source: 'manual',
        },
      })
      .select('id, content, tags, metadata, created_at')
      .single()

    if (error) {
      console.error('[/api/brain/relationships] POST error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: toRelationship(data) }, { status: 201 })
  } catch (err) {
    console.error('[/api/brain/relationships] POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/brain/relationships  body: { id, name?, role?, company?, notes?, tags?, warmth?, last_contact? }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, role, company, notes, tags, warmth, last_contact } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabaseServer
      .from('thoughts')
      .select('content, metadata, tags')
      .eq('id', id)
      .eq('thought_type', 'relationship')
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const current = parseContent(existing.content || '')
    const currentMeta = existing.metadata || {}

    const newName = name !== undefined ? name.trim() : current.name
    const newRole = role !== undefined ? role.trim() || null : (currentMeta.role || current.role || null)
    const newCompany = company !== undefined ? company.trim() || null : (currentMeta.company || current.company || null)
    const newNotes = notes !== undefined ? notes.trim() || null : current.notes || null

    const updates: Record<string, any> = {
      content: formatContent(newName, newRole ?? undefined, newCompany ?? undefined, newNotes ?? undefined),
      metadata: {
        ...currentMeta,
        role: newRole,
        company: newCompany,
        warmth: warmth !== undefined
          ? Math.max(1, Math.min(5, parseInt(String(warmth))))
          : currentMeta.warmth,
        last_contact: last_contact !== undefined ? last_contact : currentMeta.last_contact,
      },
    }
    if (tags !== undefined) updates.tags = tags

    const { data, error } = await supabaseServer
      .from('thoughts')
      .update(updates)
      .eq('id', id)
      .select('id, content, tags, metadata, created_at')
      .single()

    if (error) {
      console.error('[/api/brain/relationships] PATCH error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: toRelationship(data) })
  } catch (err) {
    console.error('[/api/brain/relationships] PATCH unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/brain/relationships?id=uuid
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('thoughts')
      .delete()
      .eq('id', id)
      .eq('thought_type', 'relationship')

    if (error) {
      console.error('[/api/brain/relationships] DELETE error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/brain/relationships] DELETE unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
