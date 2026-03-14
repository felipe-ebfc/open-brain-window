'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { NavHeader } from '@/components/NavHeader'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

type Relationship = {
  id: string
  name: string
  position: string | null
  company: string | null
  warmth: number | null
  brain_mentions: number
  linkedin_interactions: number
  has_testimonial: boolean
  has_endorsement: boolean
  email: string | null
  linkedin_url: string | null
  connected_on: string | null
  sources: string[]
  tags: string[]
  created_at: string
}

type SortKey = 'warmth' | 'name' | 'brain' | 'linkedin'
type WarmthFilter = 'All' | 1 | 2 | 3 | 4 | 5
type SourceFilterKey = 'All' | 'LinkedIn' | 'Brain' | 'Testimonial' | 'Endorsement'

// ─── Constants ────────────────────────────────────────────────────────────────

const WARMTH_COLORS = ['#e84040', '#f5983a', '#f5c842', '#4caf50', '#00b8a9']
const WARMTH_LABELS = ['Cold', 'Cooling', 'Neutral', 'Active', 'Hot']

const SOURCE_LABELS: Record<string, string> = {
  'linkedin-connection': 'LinkedIn',
  'linkedin-comment': 'LI Comment',
  'brain': 'Brain',
  'brain-llm-extract': 'Brain AI',
  'testimonial': 'Testimonial',
  'endorsement': 'Endorsement',
  'manual': 'Manual',
}

const SOURCE_COLORS: Record<string, string> = {
  'linkedin-connection': '#0077b5',
  'linkedin-comment': '#0077b5',
  'brain': '#9b59b6',
  'brain-llm-extract': '#9b59b6',
  'testimonial': '#f5c842',
  'endorsement': '#4caf50',
  'manual': '#888',
}

const SOURCE_FILTER_GROUPS: Record<string, string[]> = {
  'LinkedIn': ['linkedin-connection', 'linkedin-comment'],
  'Brain': ['brain', 'brain-llm-extract'],
  'Testimonial': ['testimonial'],
  'Endorsement': ['endorsement'],
}

const PAGE_SIZE = 50

// ─── Sub-components ───────────────────────────────────────────────────────────

function WarmthDots({ warmth }: { warmth: number }) {
  const color = WARMTH_COLORS[warmth - 1]
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: i <= warmth ? color : 'var(--border)',
        }} />
      ))}
    </div>
  )
}

function SourcePill({ source }: { source: string }) {
  const label = SOURCE_LABELS[source] || source
  const color = SOURCE_COLORS[source] || 'var(--text-muted)'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 7px',
      borderRadius: 9999,
      fontSize: 10,
      fontWeight: 600,
      background: `${color}18`,
      border: `1px solid ${color}44`,
      color: color,
    }}>
      {label}
    </span>
  )
}

function RelationshipCard({ person }: { person: Relationship }) {
  const [expanded, setExpanded] = useState(false)
  const warmthColor = person.warmth ? WARMTH_COLORS[person.warmth - 1] : 'var(--border-bright)'

  return (
    <div
      className="paper-card pressable"
      onClick={() => setExpanded(e => !e)}
      style={{
        borderLeft: `3px solid ${warmthColor}`,
        cursor: 'pointer',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
          }}>
            {person.name}
          </div>
          {(person.position || person.company) && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {[person.position, person.company].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
          {person.warmth && <WarmthDots warmth={person.warmth} />}
          <span style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            display: 'inline-block',
          }}>▾</span>
        </div>
      </div>

      {/* Metrics + sources row */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {person.brain_mentions > 0 && (
          <span style={{
            padding: '2px 8px',
            borderRadius: 9999,
            background: 'rgba(155, 89, 182, 0.12)',
            border: '1px solid rgba(155, 89, 182, 0.3)',
            fontSize: 11,
            color: '#9b59b6',
            fontWeight: 600,
          }}>
            ◆ {person.brain_mentions}
          </span>
        )}
        {person.linkedin_interactions > 0 && (
          <span style={{
            padding: '2px 8px',
            borderRadius: 9999,
            background: 'rgba(0, 119, 181, 0.12)',
            border: '1px solid rgba(0, 119, 181, 0.3)',
            fontSize: 11,
            color: '#0077b5',
            fontWeight: 600,
          }}>
            ⟳ {person.linkedin_interactions}
          </span>
        )}
        {person.sources.slice(0, 3).map(s => (
          <SourcePill key={s} source={s} />
        ))}
        {person.sources.length > 3 && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{person.sources.length - 3}</span>
        )}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{
          marginTop: 10,
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {person.linkedin_url && (
            <a
              href={person.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ fontSize: 12, color: '#0077b5', textDecoration: 'none' }}
            >
              LinkedIn Profile →
            </a>
          )}
          {person.email && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              ✉ {person.email}
            </div>
          )}
          {person.connected_on && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Connected {person.connected_on}
            </div>
          )}
          {(person.has_testimonial || person.has_endorsement) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {person.has_testimonial && (
                <span style={{ fontSize: 11, color: '#f5c842', fontWeight: 600 }}>★ Testimonial</span>
              )}
              {person.has_endorsement && (
                <span style={{ fontSize: 11, color: '#4caf50', fontWeight: 600 }}>✓ Endorsement</span>
              )}
            </div>
          )}
          {person.sources.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
              {person.sources.map(s => <SourcePill key={s} source={s} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RelationshipsPage() {
  const [people, setPeople] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [warmthFilter, setWarmthFilter] = useState<WarmthFilter>('All')
  const [sourceFilter, setSourceFilter] = useState<SourceFilterKey>('All')
  const [companyFilter, setCompanyFilter] = useState('All')
  const [sortKey, setSortKey] = useState<SortKey>('warmth')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/brain/relationships')
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        setPeople(data.items || [])
      } catch (err) {
        console.error('[RelationshipsPage] load failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Reset visible count when filters/sort change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search, warmthFilter, sourceFilter, companyFilter, sortKey])

  const topCompanies = useMemo(() => {
    const counts: Record<string, number> = {}
    people.forEach(p => {
      if (p.company) counts[p.company] = (counts[p.company] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([company]) => company)
  }, [people])

  const warmthCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    people.forEach(p => { if (p.warmth) counts[p.warmth] = (counts[p.warmth] || 0) + 1 })
    return counts
  }, [people])

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    Object.keys(SOURCE_FILTER_GROUPS).forEach(group => {
      const groupSources = SOURCE_FILTER_GROUPS[group]
      counts[group] = people.filter(p => p.sources.some(s => groupSources.includes(s))).length
    })
    return counts
  }, [people])

  const filtered = useMemo(() => {
    let result = people

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.position || '').toLowerCase().includes(q) ||
        (r.company || '').toLowerCase().includes(q)
      )
    }

    if (warmthFilter !== 'All') {
      result = result.filter(r => r.warmth === warmthFilter)
    }

    if (sourceFilter !== 'All') {
      const groupSources = SOURCE_FILTER_GROUPS[sourceFilter]
      result = result.filter(r => r.sources.some(s => groupSources.includes(s)))
    }

    if (companyFilter !== 'All') {
      result = result.filter(r => r.company === companyFilter)
    }

    return [...result].sort((a, b) => {
      if (sortKey === 'warmth') return (b.warmth || 0) - (a.warmth || 0)
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'brain') return b.brain_mentions - a.brain_mentions
      if (sortKey === 'linkedin') return b.linkedin_interactions - a.linkedin_interactions
      return 0
    })
  }, [people, search, warmthFilter, sourceFilter, companyFilter, sortKey])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const hotCount = warmthCounts[5] || 0

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="Relationships" back />

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        background: 'var(--bg-surface)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#9b59b6', letterSpacing: '-0.04em' }}>
            {loading ? '—' : people.length.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Contacts</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#00b8a9', letterSpacing: '-0.04em' }}>
            {loading ? '—' : hotCount}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Hot</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-teal)', letterSpacing: '-0.04em' }}>
            {loading ? '—' : topCompanies.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Companies</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 16px 8px', position: 'relative' }}>
        <input
          className="search-input"
          type="search"
          placeholder="Search name, position, company…"
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

      {/* Sort + Company row */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 8px', alignItems: 'center' }}>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="warmth">Sort: Warmth</option>
          <option value="name">Sort: Name</option>
          <option value="brain">Sort: Brain</option>
          <option value="linkedin">Sort: LinkedIn</option>
        </select>
        <select
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
            color: companyFilter !== 'All' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            outline: 'none',
            flex: 1,
            maxWidth: 200,
          }}
        >
          <option value="All">All Companies</option>
          {topCompanies.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Warmth filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 8px', overflowX: 'auto' }} className="no-scrollbar">
        {(['All', 5, 4, 3, 2, 1] as const).map(w => (
          <button
            key={w}
            className={`filter-chip ${warmthFilter === w ? 'active' : ''}`}
            onClick={() => setWarmthFilter(w)}
            style={warmthFilter === w && w !== 'All' ? {
              borderColor: WARMTH_COLORS[(w as number) - 1],
              color: WARMTH_COLORS[(w as number) - 1],
              background: `${WARMTH_COLORS[(w as number) - 1]}18`,
            } : {}}
          >
            {w === 'All' ? 'All' : WARMTH_LABELS[(w as number) - 1]}
            {w !== 'All' && warmthCounts[w as number] > 0 && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>·{warmthCounts[w as number]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Source filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto' }} className="no-scrollbar">
        {(['All', 'LinkedIn', 'Brain', 'Testimonial', 'Endorsement'] as const).map(s => (
          <button
            key={s}
            className={`filter-chip ${sourceFilter === s ? 'active' : ''}`}
            onClick={() => setSourceFilter(s)}
          >
            {s}
            {s !== 'All' && sourceCounts[s] > 0 && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>·{sourceCounts[s]}</span>
            )}
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
        <span style={{ color: '#9b59b6', fontWeight: 800 }}>{filtered.length.toLocaleString()}</span> contacts
        {filtered.length !== people.length && ` · filtered from ${people.length.toLocaleString()}`}
      </div>

      {/* Cards list */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <LoadingSkeleton count={6} height={80} />
        ) : error ? (
          <div style={{ color: '#e84040', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            Failed to load: {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '32px 0', textAlign: 'center' }}>
            No contacts match your filters.
          </div>
        ) : (
          <>
            {visible.map(person => (
              <RelationshipCard key={person.id} person={person} />
            ))}
            {hasMore && (
              <button
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '12px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                Load more ({(filtered.length - visibleCount).toLocaleString()} remaining)
              </button>
            )}
          </>
        )}
      </div>
    </main>
  )
}
