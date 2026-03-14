import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://brain-api.ebfc.ai'

/**
 * GET /api/brain/memory?q=search+term&type=daily_log&limit=10&days=30
 * 
 * Search memories stored in Open Brain. Supports:
 * - Semantic search via embeddings (if Ollama is available)
 * - Text fallback via ilike (if embeddings fail)
 * - Filter by memory_type, date range
 * - Ranked by relevance (semantic) or recency (text fallback)
 * 
 * Query params:
 *   q       - search query (required)
 *   type    - filter by metadata.memory_type (optional: daily_log, lesson, decision)
 *   limit   - max results (default 10, max 50)
 *   days    - only search last N days (optional)
 *   mode    - "semantic" (default) or "text" (skip embedding)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const memoryType = searchParams.get('type') || ''
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
  const days = parseInt(searchParams.get('days') || '0')
  const mode = searchParams.get('mode') || 'semantic'

  if (!query) {
    return NextResponse.json({ error: 'Missing q param' }, { status: 400 })
  }

  // Try semantic search first
  if (mode === 'semantic') {
    try {
      const embedding = await generateEmbedding(query)
      if (embedding) {
        const results = await semanticSearch(embedding, limit, memoryType, days)
        return NextResponse.json({
          results,
          mode: 'semantic',
          count: results.length,
        })
      }
    } catch (err) {
      console.warn('[memory] Semantic search failed, falling back to text:', err)
    }
  }

  // Text fallback
  const results = await textSearch(query, limit, memoryType, days)
  return NextResponse.json({
    results,
    mode: 'text',
    count: results.length,
  })
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        input: text,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.embeddings?.[0] || null
  } catch {
    return null
  }
}

async function semanticSearch(
  embedding: number[],
  limit: number,
  memoryType: string,
  days: number
) {
  // Use match_thoughts RPC for vector similarity
  const { data, error } = await supabaseServer.rpc('match_thoughts', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: limit * 2, // fetch extra, filter after
  })

  if (error) throw error

  let results = (data || [])
    .filter((r: any) => r.thought_type === 'memory')

  // Filter by memory_type if specified
  if (memoryType) {
    results = results.filter((r: any) =>
      r.metadata?.memory_type === memoryType
    )
  }

  // Filter by date range if specified
  if (days > 0) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    results = results.filter((r: any) =>
      new Date(r.created_at) >= cutoff
    )
  }

  return results.slice(0, limit).map(formatResult)
}

async function textSearch(
  query: string,
  limit: number,
  memoryType: string,
  days: number
) {
  let q = supabaseServer
    .from('thoughts')
    .select('id, content, metadata, created_at, tags, source')
    .eq('thought_type', 'memory')
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (days > 0) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    q = q.gte('created_at', cutoff.toISOString())
  }

  const { data, error } = await q

  if (error) throw error

  let results = data || []

  if (memoryType) {
    results = results.filter((r: any) =>
      r.metadata?.memory_type === memoryType
    )
  }

  return results.map(formatResult)
}

function formatResult(row: any) {
  return {
    id: row.id,
    content: row.content,
    date: row.metadata?.date || null,
    memory_type: row.metadata?.memory_type || null,
    source: row.source || null,
    created_at: row.created_at,
    similarity: row.similarity ?? null,
  }
}
