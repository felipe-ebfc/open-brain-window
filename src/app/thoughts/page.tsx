'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { supabase, Thought } from '@/lib/supabase'
import { NavHeader } from '@/components/NavHeader'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

const SORT_OPTIONS = ['Newest', 'Oldest', 'Category'] as const
type SortOption = typeof SORT_OPTIONS[number]

function ThoughtCard({ thought }: { thought: Thought }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="thought-card pressable"
      onClick={() => setExpanded(e => !e)}
      style={{ cursor: 'pointer', borderLeft: '3px solid var(--accent-blue)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 14,
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            display: expanded ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical' as const,
            overflow: expanded ? 'visible' : 'hidden',
          }}>
            {thought.content}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        flexWrap: 'wrap',
      }}>
        {thought.category && (
          <span style={{
            background: 'rgba(74, 158, 255, 0.15)',
            border: '1px solid rgba(74, 158, 255, 0.3)',
            color: 'var(--accent-blue)',
            padding: '2px 10px',
            borderRadius: 9999,
            fontSize: 11,
            fontWeight: 700,
          }}>
            {thought.category}
          </span>
        )}
        {thought.tags?.map(tag => (
          <span key={tag} style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '2px 8px',
            borderRadius: 9999,
            fontSize: 11,
          }}>
            #{tag}
          </span>
        ))}
        <span style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          marginLeft: 'auto',
        }}>
          {new Date(thought.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </div>
  )
}

export default function ThoughtsPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sort, setSort] = useState<SortOption>('Newest')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('thoughts')
        .select('*')
        .order('created_at', { ascending: false })
      setThoughts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const categories = useMemo(() => {
    const cats = new Set(thoughts.map(t => t.category).filter(Boolean) as string[])
    return ['All', ...Array.from(cats).sort()]
  }, [thoughts])

  const filtered = useMemo(() => {
    let result = thoughts.filter(t => {
      const matchCat = selectedCategory === 'All' || t.category === selectedCategory
      const matchSearch = !search ||
        t.content.toLowerCase().includes(search.toLowerCase()) ||
        (t.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      return matchCat && matchSearch
    })

    if (sort === 'Oldest') result = [...result].reverse()
    if (sort === 'Category') result = [...result].sort((a, b) => (a.category || '').localeCompare(b.category || ''))

    return result
  }, [thoughts, selectedCategory, search, sort])

  // Group by category for category sort
  const grouped = useMemo(() => {
    if (sort !== 'Category') return null
    const groups: Record<string, Thought[]> = {}
    filtered.forEach(t => {
      const cat = t.category || 'Uncategorized'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(t)
    })
    return groups
  }, [filtered, sort])

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="Thoughts / Knowledge" back />

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        background: 'var(--bg-surface)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '-0.04em' }}>
            {thoughts.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Thoughts</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '-0.04em' }}>
            {categories.length - 1}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Categories</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '-0.04em' }}>
            {filtered.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Showing</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 16px 8px' }}>
        <input
          className="search-input"
          type="search"
          placeholder="Search thoughts, categories, tags…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Sort + Category filters */}
      <div className="no-scrollbar" style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '8px 16px 12px',
        alignItems: 'center',
      }}>
        {/* Sort chips */}
        <div style={{
          display: 'flex',
          gap: 6,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          paddingRight: 12,
          marginRight: 4,
        }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`filter-chip ${sort === opt ? 'active' : ''}`}
              onClick={() => setSort(opt)}
              style={{ fontSize: 11 }}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Category chips */}
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

      {/* Results */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <LoadingSkeleton count={6} height={90} />
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            No thoughts match your search.
          </div>
        ) : grouped ? (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--accent-blue)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '12px 0 8px',
                borderTop: '1px solid var(--border)',
                marginTop: 4,
              }}>
                {category} · {items.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(t => <ThoughtCard key={t.id} thought={t} />)}
              </div>
            </div>
          ))
        ) : (
          filtered.map(t => <ThoughtCard key={t.id} thought={t} />)
        )}
      </div>
    </main>
  )
}
