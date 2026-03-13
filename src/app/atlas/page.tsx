'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { AtlasPaper } from '@/lib/supabase'
import { NavHeader } from '@/components/NavHeader'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

const ERAS = ['All', 'IGLC-29', 'IGLC-30', 'IGLC-31', 'IGLC-32', 'IGLC-33', 'IGLC-34']

const ERA_COLORS: Record<string, string> = {
  'IGLC-29': '#e84040',
  'IGLC-30': '#f5a623',
  'IGLC-31': '#4caf50',
  'IGLC-32': '#00b8a9',
  'IGLC-33': '#4a9eff',
  'IGLC-34': '#9b59b6',
}

function PaperCard({ paper }: { paper: AtlasPaper }) {
  const [expanded, setExpanded] = useState(false)
  const eraColor = paper.era ? ERA_COLORS[paper.era] || 'var(--border-bright)' : 'var(--border-bright)'

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
        </div>
      </div>

      {paper.category && (
        <div style={{
          marginTop: 8,
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
          {paper.category}
        </div>
      )}

      {expanded && paper.summary && (
        <div style={{
          marginTop: 10,
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
        }}>
          {paper.summary}
          {paper.url && (
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'block',
                marginTop: 8,
                color: 'var(--accent-teal)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Read paper →
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function EraTimeline({
  selectedEra,
  onChange,
  counts,
}: {
  selectedEra: string
  onChange: (era: string) => void
  counts: Record<string, number>
}) {
  return (
    <div style={{ padding: '0 16px 12px' }}>
      {/* Era nodes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 12, overflowX: 'auto' }} className="no-scrollbar">
        {ERAS.filter(e => e !== 'All').map((era, i, arr) => (
          <div key={era} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <button
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
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: selectedEra === era ? ERA_COLORS[era] : 'var(--bg-elevated)',
                border: `2px solid ${ERA_COLORS[era]}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 800,
                color: selectedEra === era ? '#0a0a0a' : ERA_COLORS[era],
                transition: 'all 0.15s',
              }}>
                {era.replace('IGLC-', '')}
              </div>
              <div style={{
                fontSize: 9,
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}>
                {counts[era] ?? 0}
              </div>
            </button>
            {i < arr.length - 1 && (
              <div style={{
                width: 20,
                height: 2,
                background: 'var(--border)',
                flexShrink: 0,
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AtlasPage() {
  const [papers, setPapers] = useState<AtlasPaper[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedEra, setSelectedEra] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    // atlas_papers table not yet created — returns empty gracefully
    setLoading(false)
  }, [])

  const categories = useMemo(() => {
    const cats = new Set(papers.map(p => p.category).filter(Boolean) as string[])
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
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory
      const matchSearch = !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.authors || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.summary || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase())
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
            {papers.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Papers</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-teal)', letterSpacing: '-0.04em' }}>
            {categories.length - 1}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Categories</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-teal)', letterSpacing: '-0.04em' }}>
            {ERAS.length - 1}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Eras</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 16px 8px' }}>
        <input
          className="search-input"
          type="search"
          placeholder="Search papers, authors, topics…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Era timeline */}
      <EraTimeline
        selectedEra={selectedEra}
        onChange={setSelectedEra}
        counts={eraCounts}
      />

      {/* Category chips */}
      <div className="no-scrollbar" style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
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

      {/* Results count */}
      <div style={{
        padding: '0 16px 12px',
        fontSize: 12,
        color: 'var(--text-muted)',
        fontWeight: 600,
      }}>
        {filtered.length} papers
        {selectedEra !== 'All' && ` · ${selectedEra}`}
        {selectedCategory !== 'All' && ` · ${selectedCategory}`}
      </div>

      {/* Papers list */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <LoadingSkeleton count={6} height={80} />
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            No papers match your filters.
          </div>
        ) : (
          filtered.map(paper => (
            <PaperCard key={paper.id} paper={paper} />
          ))
        )}
      </div>
    </main>
  )
}
