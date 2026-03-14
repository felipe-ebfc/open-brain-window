import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Content is stored as labeled lines:
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
  const parsed = parseContent(row.content || '')
  const meta = row.metadata || {}
  return {
    id: row.id,
    name: parsed.name,
    role: meta.role || parsed.role || null,
    company: meta.company || parsed.company || null,
    org: meta.company || parsed.company || null,
    warmth: meta.warmth ?? null,
    last_contact: meta.last_contact ?? null,
    tags: row.tags || [],
    notes: parsed.notes || null,
    source: meta.source || 'manual',
    created_at: row.created_at,
  }
}

// GET /api/brain/relationships?limit=200&search=&warmth=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500)
  const search = searchParams.get('search') || ''
  const warmthParam = searchParams.get('warmth')
  const warmthFilter = warmthParam ? parseInt(warmthParam) : null

  try {
    const { data, error } = await supabaseServer
      .from('thoughts')
      .select('id, content, tags, metadata, created_at')
      .eq('thought_type', 'relationship')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[/api/brain/relationships] GET error:', error)
      return NextResponse.json({ items: [] })
    }

    let items = (data || []).map(toRelationship)

    if (search) {
      const q = search.toLowerCase()
      items = items.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.role || '').toLowerCase().includes(q) ||
        (r.company || '').toLowerCase().includes(q) ||
        (r.tags || []).some((t: string) => t.toLowerCase().includes(q))
      )
    }

    if (warmthFilter !== null) {
      items = items.filter(r => r.warmth === warmthFilter)
    }

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[/api/brain/relationships] Unexpected error:', err)
    return NextResponse.json({ items: [] })
  }
}

// POST /api/brain/relationships
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
