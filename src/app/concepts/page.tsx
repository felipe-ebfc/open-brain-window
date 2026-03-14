'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { NavHeader } from '@/components/NavHeader'

type Concept = {
  id: string
  content: string
  metadata: {
    title?: string
    filename?: string
  } | null
  tags: string[]
  created_at: string
}

export default function ConceptsPage() {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/brain/concepts')
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        setConcepts(data.concepts || [])
      } catch (err) {
        console.error('Failed to load concepts:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = concepts.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (c.metadata?.title || '').toLowerCase().includes(s) ||
      c.content.toLowerCase().includes(s) ||
      c.tags.some(t => t.toLowerCase().includes(s))
    )
  })

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="Concepts" back />

      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        background: 'var(--bg-surface)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ff9800', letterSpacing: '-0.04em' }}>
            {loading ? '—' : concepts.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Concepts</div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ position: 'relative' }}>
          <input
            className="search-input"
            type="search"
            placeholder="Search concepts, tags, frameworks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 16, lineHeight: 1,
              }}
            >×</button>
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          <span style={{ color: '#ff9800', fontWeight: 800 }}>{filtered.length}</span> concepts
          {search && ` matching "${search}"`}
        </div>
      </div>

      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 70, borderRadius: 12 }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            No concepts found.
          </div>
        ) : (
          filtered.map(concept => {
            const title = concept.metadata?.title || concept.content.split('\n')[0].replace(/^#+\s*/, '')
            const isExpanded = expanded.has(concept.id)
            // Get body without first heading
            const bodyLines = concept.content.split('\n').slice(1).join('\n').trim()

            return (
              <div
                key={concept.id}
                className="paper-card pressable"
                onClick={() => toggle(concept.id)}
                style={{
                  borderLeft: '3px solid #ff9800',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    flex: 1,
                  }}>
                    {title}
                  </div>
                  <div style={{
                    fontSize: 14,
                    color: 'var(--text-muted)',
                    transition: 'transform 0.15s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    flexShrink: 0,
                    marginLeft: 8,
                  }}>▾</div>
                </div>

                {concept.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {concept.tags.filter(t => t !== 'concept' && t !== 'second-brain').slice(0, 5).map(tag => (
                      <span key={tag} style={{
                        padding: '2px 8px',
                        borderRadius: 9999,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {isExpanded && bodyLines && (
                  <div style={{
                    marginTop: 10,
                    borderTop: '1px solid var(--border)',
                    paddingTop: 10,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                    maxHeight: 400,
                    overflow: 'auto',
                  }}>
                    {bodyLines}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}
