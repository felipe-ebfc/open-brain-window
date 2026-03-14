'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { NavHeader } from '@/components/NavHeader'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

type AtlasPaper = {
  id: string
  title: string
  authors?: string | null
  year?: number | null
  era?: string | null
  category?: string | null
  sector?: string | null
  theme?: string | null
  summary?: string | null
  metrics?: boolean
  created_at: string
}

function getEraColor(era: string, allEras: string[]): string {
  const idx = allEras.indexOf(era)
  const hue = Math.round((idx / allEras.length) * 300)
  return `hsl(${hue}, 70%, 55%)`
}

function PaperCard({ paper, eraColor }: { paper: AtlasPaper; eraColor: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="paper-card pressable"
      onClick={() => setExpanded(e => !e)}
      style={{
        borderLeft: `3px solid ${eraColor}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
          }}>
            {paper.title}
          </div>
          {paper.authors && (
            <div style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 4,
            }}>
              {paper.authors}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {paper.era && (
            <span style={{
              background: eraColor,
              color: '#0a0a0a',
              padding: '2px 8px',
              borderRadius: 9999,
              fontSize: 10,
              fontWeight: 800,
            }}>
              {paper.era}
            </span>
          )}
          {paper.year && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{paper.year}</span>
          )}
          <span style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            display: 'inline-block',
          }}>▾</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {paper.theme && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 9999,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}>
            {paper.theme}
          </span>
        )}
        {paper.sector && paper.sector !== paper.theme && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 9999,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}>
            {paper.sector}
          </span>
        )}
        {paper.metrics && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 9999,
            background: 'rgba(76, 175, 80, 0.15)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            fontSize: 11,
            color: '#4caf50',
            fontWeight: 600,
          }}>
            📊 Metrics
          </span>
        )}
      </div>

      {expanded && (
        <div style={{
          marginTop: 10,
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {/* Metadata row */}
          <div style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}>
            {paper.era && <span>IGLC-{paper.era.replace('IGLC-', '')}</span>}
            {paper.year && <span>{paper.year}</span>}
            {paper.authors && <span>• {paper.authors}</span>}
          </div>

          {/* Summary or fallback */}
          {paper.summary ? (
            <div style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
            }}>
              {paper.summary}
            </div>
          ) : (
            <div style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}>
              No summary available.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EraTimeline({
  eras,
  selectedEra,
  onChange,
  counts,
}: {
  eras: string[]
  selectedEra: string
  onChange: (era: string) => void
  counts: Record<string, number>
}) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {/* All pill */}
        <button
          onClick={() => onChange('All')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 6px',
          }}
        >
          <div style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: selectedEra === 'All' ? 'var(--accent-teal)' : 'var(--bg-elevated)',
            border: `2px solid var(--accent-teal)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8,
            fontWeight: 800,
            color: selectedEra === 'All' ? '#0a0a0a' : 'var(--accent-teal)',
            transition: 'all 0.15s',
          }}>
            All
          </div>
          <div style={{
            fontSize: 8,
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}>
            {totalCount}
          </div>
        </button>

        {eras.map((era) => {
          const color = getEraColor(era, eras)
          return (
            <button
              key={era}
              onClick={() => onChange(era === selectedEra ? 'All' : era)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: selectedEra === era ? color : 'var(--bg-elevated)',
                border: `2px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 8,
                fontWeight: 800,
                color: selectedEra === era ? '#0a0a0a' : color,
                transition: 'all 0.15s',
              }}>
                {era.replace('IGLC-', '')}
              </div>
              <div style={{
                fontSize: 8,
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}>
                {counts[era] ?? 0}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AtlasPage() {
  const [papers, setPapers] = useState<AtlasPaper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedEra, setSelectedEra] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    async function loadPapers() {
      try {
        const res = await fetch('/api/brain/atlas?limit=1500')
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        setPapers(data.papers || [])
      } catch (err) {
        console.error('Failed to load atlas papers:', err)
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    loadPapers()
  }, [])

  // Derive eras dynamically from data
  const eras = useMemo(() => {
    const eraSet = new Set(papers.map(p => p.era).filter(Boolean) as string[])
    return Array.from(eraSet).sort((a, b) => {
      const numA = parseInt(a.replace('IGLC-', ''))
      const numB = parseInt(b.replace('IGLC-', ''))
      return numA - numB
    })
  }, [papers])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    papers.forEach(p => {
      if (p.theme) cats.add(p.theme)
    })
    return ['All', ...Array.from(cats).sort()]
  }, [papers])

  const eraCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    papers.forEach(p => {
      if (p.era) counts[p.era] = (counts[p.era] || 0) + 1
    })
    return counts
  }, [papers])

  const filtered = useMemo(() => {
    return papers.filter(p => {
      const matchEra = selectedEra === 'All' || p.era === selectedEra
      const matchCat = selectedCategory === 'All' || p.theme === selectedCategory
      const matchSearch = !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.authors || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.summary || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.theme || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.sector || '').toLowerCase().includes(search.toLowerCase())
      return matchEra && matchCat && matchSearch
    })
  }, [papers, selectedEra, selectedCategory, search])

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="Lean Evidence Atlas" back />

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        background: 'var(--bg-surface)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-teal)', letterSpacing: '-0.04em' }}>
            {loading ? '—' : papers.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Papers</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-teal)', letterSpacing: '-0.04em' }}>
            {loading ? '—' : categories.length - 1}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Themes</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-teal)', letterSpacing: '-0.04em' }}>
            {loading ? '—' : eras.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Eras</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 16px 8px', position: 'relative' }}>
        <input
          className="search-input"
          type="search"
          placeholder="Search papers, themes, sectors…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingRight: search ? 36 : undefined }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: 28,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 16,
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Era timeline */}
      {eras.length > 0 && (
        <EraTimeline
          eras={eras}
          selectedEra={selectedEra}
          onChange={setSelectedEra}
          counts={eraCounts}
        />
      )}

      {/* Category chips */}
      {categories.length > 1 && (
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          padding: '0 16px 16px',
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <div style={{
        padding: '0 16px 12px',
        fontSize: 12,
        color: 'var(--text-muted)',
        fontWeight: 600,
      }}>
        <span style={{ color: 'var(--accent-teal)', fontWeight: 800 }}>{filtered.length}</span> papers
        {selectedEra !== 'All' && ` · ${selectedEra}`}
        {selectedCategory !== 'All' && ` · ${selectedCategory}`}
      </div>

      {/* Papers list */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <LoadingSkeleton count={6} height={80} />
        ) : error ? (
          <div style={{ color: '#e84040', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            Failed to load: {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            No papers match your filters.
          </div>
        ) : (
          filtered.map(paper => (
            <PaperCard
              key={paper.id}
              paper={paper}
              eraColor={paper.era ? getEraColor(paper.era, eras) : 'var(--border-bright)'}
            />
          ))
        )}
      </div>
    </main>
  )
}
