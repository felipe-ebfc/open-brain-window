import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const OLLAMA_EMBED_URL = process.env.OLLAMA_EMBED_URL || 'https://brain-api.ebfc.ai'
const EMBED_MODEL = 'nomic-embed-text'

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_EMBED_URL}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  })

  if (!res.ok) {
    throw new Error(`Ollama embed failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return data.embeddings?.[0] || data.embedding
}

// GET /api/brain/search?q=lean+construction&limit=20&threshold=0.3
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const threshold = parseFloat(searchParams.get('threshold') || '0.3')

  if (!query.trim()) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 })
  }

  try {
    // 1. Generate embedding for the search query
    const queryEmbedding = await getEmbedding(query)

    // 2. Call Supabase RPC match_thoughts (pgvector cosine similarity)
    const { data, error } = await supabaseServer.rpc('match_thoughts', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: threshold,
      match_count: limit,
    })

    if (error) {
      console.error('[/api/brain/search] Supabase RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const thoughts = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      content: row.content,
      category: row.thought_type || null,
      tags: row.tags || [],
      people: row.people || [],
      source: row.source || null,
      metadata: row.metadata || null,
      similarity: row.similarity,
      created_at: row.created_at,
    }))

    return NextResponse.json({ thoughts, count: thoughts.length, query })
  } catch (err) {
    console.error('[/api/brain/search] Unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
