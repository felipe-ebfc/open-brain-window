'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { NavHeader } from '@/components/NavHeader'

type MemoryResult = {
  id: string
  content: string
  date: string | null
  memory_type: string | null
  source: string | null
  created_at: string
  similarity: number | null
}

export default function MemoryPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MemoryResult[]>([])
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<string>('')
  const [searched, setSearched] = useState(false)

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/brain/memory?q=${encodeURIComponent(query)}&limit=20`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setResults(data.results || [])
      setMode(data.mode || 'unknown')
    } catch (err) {
      console.error('Memory search failed:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="Memory" back />

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="search-input"
            type="search"
            placeholder="Search memories… (e.g. 'Qwen failover' or 'Gravity Moment')"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            style={{ flex: 1 }}
          />
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              background: 'var(--accent-teal)',
              color: '#0a0a0a',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              opacity: loading || !query.trim() ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            {loading ? '…' : 'Search'}
          </button>
        </div>

        {mode && (
          <div style={{
            marginTop: 8,
            fontSize: 11,
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}>
            {results.length} results via {mode} search
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {searched && results.length === 0 && !loading && (
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 14,
            padding: '20px 0',
            textAlign: 'center',
          }}>
            No memories found.
          </div>
        )}
        {results.map(mem => (
          <div
            key={mem.id}
            className="paper-card"
            style={{
              borderLeft: '3px solid var(--accent-teal)',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 8,
            }}>
              <div style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}>
                {mem.date || mem.created_at?.split('T')[0]}
                {mem.memory_type && ` · ${mem.memory_type}`}
              </div>
              {mem.similarity !== null && (
                <span style={{
                  fontSize: 10,
                  color: 'var(--accent-teal)',
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {Math.round(mem.similarity * 100)}% match
                </span>
              )}
            </div>
            <div style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
            }}>
              {mem.content}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
