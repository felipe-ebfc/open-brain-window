'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { NavHeader } from '@/components/NavHeader'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

type LinkedInItem = {
  id: string
  content: string
  thought_type: string
  tags: string[]
  metadata: Record<string, any> | null
  created_at: string
  parent_post_preview?: string
  parent_url?: string
  similarity?: number
}

type Counts = {
  connections: number
  posts: number
  comments: number
  endorsements: number
  positions: number
}

type TypeFilter = 'all' | 'posts' | 'connections' | 'comments' | 'endorsements' | 'positions'
type SortOption = 'Newest' | 'Oldest' | 'Type'
type SearchMode = 'text' | 'tags' | 'semantic'

const SORT_OPTIONS: SortOption[] = ['Newest', 'Oldest', 'Type']

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'posts', label: 'Posts' },
  { key: 'connections', label: 'Connections' },
  { key: 'comments', label: 'Comments' },
  { key: 'endorsements', label: 'Endorsements' },
  { key: 'positions', label: 'Positions' },
]

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

// Full month names for "September 2025" style position dates
const MONTH_FULL_MAP: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
}

function getRealDate(item: LinkedInItem): Date {
  const rawType = item.thought_type?.replace('linkedin-', '').replace('linkedin_', '') || ''

  if (rawType === 'connection' && item.metadata?.connected_on) {
    // Format: '26 Oct 2025'
    const parts = String(item.metadata.connected_on).trim().split(' ')
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10)
      const month = MONTH_MAP[parts[1]]
      const year = parseInt(parts[2], 10)
      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        return new Date(year, month, day)
      }
    }
  }

  // Endorsements: format '2022/08/29 06:35:06 UTC'
  if (rawType === 'endorsement' && item.metadata?.date) {
    const dateStr = String(item.metadata.date).replace(' UTC', '').replace(/\//g, '-').replace(' ', 'T')
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d
  }

  // Posts and comments: format '2026-01-26 05:27:08'
  if ((rawType === 'post' || rawType === 'comment') && item.metadata?.date) {
    const d = new Date(String(item.metadata.date).replace(' ', 'T'))
    if (!isNaN(d.getTime())) return d
  }

  // Positions: format 'Sep 2025' in metadata.started
  if (rawType === 'position' && item.metadata?.started) {
    const started = String(item.metadata.started).trim()
    // Try "Mon YYYY" format
    const parts = started.split(' ')
    if (parts.length === 2) {
      const month = MONTH_MAP[parts[0]] ?? MONTH_FULL_MAP[parts[0]]
      const year = parseInt(parts[1], 10)
      if (month !== undefined && !isNaN(year)) {
        return new Date(year, month, 1)
      }
    }
    // Try just "YYYY"
    const yearOnly = parseInt(started, 10)
    if (!isNaN(yearOnly) && yearOnly > 1900 && yearOnly < 2100) {
      return new Date(yearOnly, 0, 1)
    }
  }

  return new Date(item.created_at)
}

function formatItemDate(item: LinkedInItem): string {
  return getRealDate(item).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function LinkedInCard({ item }: { item: LinkedInItem }) {
  const [expanded, setExpanded] = useState(false)
  const rawType = item.thought_type?.replace('linkedin-', '').replace('linkedin_', '') || 'item'
  const typeLabel = rawType.charAt(0).toUpperCase() + rawType.slice(1)
  const isExpandable = rawType !== 'connection' && rawType !== 'endorsement' && rawType !== 'position'

  const renderContent = () => {
    if (rawType === 'connection') {
      const lines = item.content.split('\n').filter(Boolean)
      const name = lines[0] || item.content.slice(0, 80)
      const titleCompany = lines[1] || ''
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#0077b5', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
          }}>
            {name.trim().charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            {titleCompany && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {titleCompany}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (rawType === 'endorsement') {
      const skill = item.content.split('\n')[0] || item.content.slice(0, 60)
      const endorser = item.metadata?.endorser || null
      const count = item.metadata?.endorsement_count || item.metadata?.count || null
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>&#11088;</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
              {skill}
            </span>
            {endorser && (
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginTop: 1 }}>
                by {endorser}
              </span>
            )}
          </div>
          {count != null && (
            <span style={{
              background: 'rgba(0,119,181,0.15)', border: '1px solid rgba(0,119,181,0.3)',
              borderRadius: 9999, fontSize: 10, fontWeight: 700, color: '#0077b5', padding: '2px 7px', flexShrink: 0,
            }}>
              {count}
            </span>
          )}
        </div>
      )
    }

    if (rawType === 'position') {
      const lines = item.content.split('\n').filter(Boolean)
      const title = lines[0] || ''
      const company = lines[1] || ''
      const dateRange = lines[2] || lines.find(l => /\d{4}|[Pp]resent/.test(l)) || ''
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </div>
            {company && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {company}
              </div>
            )}
          </div>
          {dateRange && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {dateRange}
            </div>
          )}
        </div>
      )
    }

    // Comments — with optional parent context
    if (rawType === 'comment') {
      return (
        <div>
          {item.parent_post_preview && (
            <div style={{
              background: 'var(--bg-elevated)',
              borderLeft: '3px solid var(--text-muted)',
              borderRadius: '0 6px 6px 0',
              padding: '6px 10px',
              marginBottom: 8,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Replying to your post:
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                {item.parent_post_preview}{item.parent_post_preview.length === 150 ? '\u2026' : ''}
              </div>
            </div>
          )}
          <div style={{
            fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5,
            display: expanded ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical' as const,
            overflow: expanded ? 'visible' : 'hidden',
            whiteSpace: 'pre-line',
          }}>
            {item.content}
          </div>
          {item.parent_url && !item.parent_post_preview && expanded && (
            <div style={{
              marginTop: 8,
              fontSize: 10,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}>
              Comment on another user&apos;s post
            </div>
          )}
        </div>
      )
    }

    // Posts
    return (
      <div style={{
        fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5,
        display: expanded ? 'block' : '-webkit-box',
        WebkitLineClamp: expanded ? 'unset' : 3,
        WebkitBoxOrient: 'vertical' as const,
        overflow: expanded ? 'visible' : 'hidden',
        whiteSpace: 'pre-line',
      }}>
        {item.content}
      </div>
    )
  }

  return (
    <div
      className={`paper-card${isExpandable ? ' pressable' : ''}`}
      onClick={isExpandable ? () => setExpanded(e => !e) : undefined}
      style={{ borderLeft: '3px solid #0077b5', cursor: isExpandable ? 'pointer' : 'default', overflow: 'hidden' }}
    >
      {renderContent()}

      {/* Metadata row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{
          background: 'rgba(0,119,181,0.15)',
          border: '1px solid rgba(0,119,181,0.3)',
          color: '#0077b5',
          padding: '2px 10px',
          borderRadius: 9999,
          fontSize: 11,
          fontWeight: 700,
        }}>
          {typeLabel}
        </span>
        {item.tags?.filter(t => !t.startsWith('linkedin')).slice(0, 3).map(tag => (
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
        {item.similarity != null && (
          <span style={{
            background: 'rgba(52, 199, 89, 0.15)',
            border: '1px solid rgba(52, 199, 89, 0.3)',
            color: '#34c759',
            padding: '2px 8px',
            borderRadius: 9999,
            fontSize: 11,
            fontWeight: 700,
          }}>
            {Math.round(item.similarity * 100)}% match
          </span>
        )}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {formatItemDate(item)}
        </span>
      </div>
    </div>
  )
}

const SEARCH_MODE_CYCLE: SearchMode[] = ['text', 'tags', 'semantic']
const SEARCH_MODE_LABELS: Record<SearchMode, string> = {
  text: '\ud83d\udd24 Text',
  tags: '\ud83c\udff7\ufe0f Tags',
  semantic: '\ud83e\udde0 AI',
}

export default function LinkedInPage() {
  const [selectedType, setSelectedType] = useState<TypeFilter>('all')
  const [items, setItems] = useState<LinkedInItem[]>([])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('text')
  const [semanticResults, setSemanticResults] = useState<LinkedInItem[] | null>(null)
  const [semanticLoading, setSemanticLoading] = useState(false)
  const [sort, setSort] = useState<SortOption>('Newest')
  const searchRef = useRef<HTMLInputElement>(null)

  const loadType = useCallback(async (type: TypeFilter) => {
    setLoading(true)
    try {
      const endpoint = type === 'all'
        ? '/api/brain/linkedin?type=all&limit=5000'
        : `/api/brain/linkedin?type=${type}&limit=5000`
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setItems(data.items || [])
      if (data.counts) setCounts(data.counts)
    } catch (err) {
      console.error('Failed to load LinkedIn data:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadType('all')
  }, [loadType])

  // Semantic search with debounce
  useEffect(() => {
    if (searchMode !== 'semantic' || !search.trim()) {
      setSemanticResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setSemanticLoading(true)
      try {
        const res = await fetch(`/api/brain/search?q=${encodeURIComponent(search)}&limit=50`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { thoughts: data } = await res.json()
        // Map thoughts response to LinkedInItem shape, filter to linkedin types only
        const linkedInResults = (data || [])
          .filter((t: any) => t.category?.startsWith('linkedin') || t.thought_type?.startsWith('linkedin'))
          .map((t: any) => ({
            id: t.id,
            content: t.content,
            thought_type: t.category || t.thought_type || '',
            tags: t.tags || [],
            metadata: t.metadata || null,
            created_at: t.created_at,
            similarity: t.similarity,
          }))
        setSemanticResults(linkedInResults)
      } catch (err) {
        console.error('Semantic search failed:', err)
        setSemanticResults([])
      } finally {
        setSemanticLoading(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [search, searchMode])

  const handleTypeChange = (type: TypeFilter) => {
    if (type === selectedType) return
    setSelectedType(type)
    setSearch('')
    setSemanticResults(null)
    setItems([])
    loadType(type)
  }

  const total = counts
    ? counts.connections + counts.posts + counts.comments + counts.endorsements + counts.positions
    : null

  const getCount = (type: TypeFilter): number | null => {
    if (!counts) return null
    if (type === 'all') return total
    return counts[type as keyof Counts] ?? null
  }

  const filtered = useMemo(() => {
    // If semantic search returned results, use those (already ranked by similarity)
    if (searchMode === 'semantic' && semanticResults !== null) {
      let result = semanticResults
      if (selectedType !== 'all') {
        const dbType = `linkedin-${selectedType.replace(/s$/, '')}`
        result = result.filter(item => item.thought_type === dbType)
      }
      return result
    }

    let result = [...items]

    if (search) {
      const q = search.toLowerCase()
      if (searchMode === 'text') {
        result = result.filter(item => item.content.toLowerCase().includes(q))
      } else if (searchMode === 'tags') {
        result = result.filter(item =>
          item.tags?.some(tag => tag.toLowerCase().includes(q))
        )
      }
    }

    if (sort === 'Newest') {
      result = result.sort((a, b) => getRealDate(b).getTime() - getRealDate(a).getTime())
    } else if (sort === 'Oldest') {
      result = result.sort((a, b) => getRealDate(a).getTime() - getRealDate(b).getTime())
    } else if (sort === 'Type') {
      result = result.sort((a, b) => (a.thought_type || '').localeCompare(b.thought_type || ''))
    }

    return result
  }, [items, search, searchMode, sort, selectedType, semanticResults])

  const grouped = useMemo(() => {
    if (sort !== 'Type') return null
    const groups: Record<string, LinkedInItem[]> = {}
    filtered.forEach(item => {
      const type = item.thought_type?.replace('linkedin-', '').replace('linkedin_', '') || 'other'
      if (!groups[type]) groups[type] = []
      groups[type].push(item)
    })
    return groups
  }, [filtered, sort])

  const cycleSearchMode = () => {
    setSearchMode(m => {
      const idx = SEARCH_MODE_CYCLE.indexOf(m)
      return SEARCH_MODE_CYCLE[(idx + 1) % SEARCH_MODE_CYCLE.length]
    })
  }

  const clearSearch = () => {
    setSearch('')
    setSemanticResults(null)
    searchRef.current?.focus()
  }

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="LinkedIn Data" back />

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        background: 'var(--bg-surface)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0077b5', letterSpacing: '-0.04em' }}>
            {total !== null ? total.toLocaleString() : '\u2014'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0077b5', letterSpacing: '-0.04em' }}>5</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Types</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0077b5', letterSpacing: '-0.04em' }}>
            {loading ? '\u2014' : filtered.length.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Showing</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 16px 8px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={searchRef}
            className="search-input"
            type="search"
            placeholder={
              searchMode === 'semantic' ? 'Semantic search across LinkedIn data\u2026'
                : searchMode === 'tags' ? 'Search by tag\u2026'
                : 'Search content\u2026'
            }
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingRight: search ? 32 : undefined }}
          />
          {search && (
            <button
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 16,
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1,
              }}
              aria-label="Clear search"
            >
              \u2715
            </button>
          )}
        </div>
        <button
          onClick={cycleSearchMode}
          title={`Search mode: ${searchMode}`}
          style={{
            background: searchMode === 'semantic' ? 'rgba(74, 158, 255, 0.2)'
              : searchMode === 'tags' ? 'rgba(0,119,181,0.2)'
              : 'var(--bg-elevated)',
            border: `1px solid ${searchMode === 'semantic' ? 'var(--accent-blue)' : searchMode === 'tags' ? '#0077b5' : 'var(--border)'}`,
            color: searchMode === 'semantic' ? 'var(--accent-blue)' : searchMode === 'tags' ? '#0077b5' : 'var(--text-muted)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            flexShrink: 0,
            minHeight: 44,
            minWidth: 44,
          }}
        >
          {SEARCH_MODE_LABELS[searchMode]}
        </button>
      </div>
      {searchMode === 'semantic' && semanticLoading && (
        <div style={{ padding: '0 16px', fontSize: 12, color: 'var(--accent-blue)', fontWeight: 600 }}>
          Searching with AI\u2026
        </div>
      )}

      {/* Sort chips */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 16px 4px' }}>
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

      {/* Type filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 16px 12px' }}>
        {TYPE_FILTERS.map(({ key, label }) => {
          const count = getCount(key)
          return (
            <button
              key={key}
              className={`filter-chip ${selectedType === key ? 'active' : ''}`}
              onClick={() => handleTypeChange(key)}
            >
              {label}
              {count !== null && (
                <span style={{ opacity: 0.6, marginLeft: 2 }}>({count.toLocaleString()})</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Results */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <LoadingSkeleton count={6} height={90} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 14 }}>
            {search ? 'No results match your search.' : 'No items found.'}
          </div>
        ) : grouped ? (
          Object.entries(grouped).map(([type, typeItems]) => (
            <div key={type}>
              <div style={{
                fontSize: 11, fontWeight: 800, color: '#0077b5',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '12px 0 8px', borderTop: '1px solid var(--border)', marginTop: 4,
              }}>
                {type} \u00b7 {typeItems.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {typeItems.map(item => <LinkedInCard key={item.id} item={item} />)}
              </div>
            </div>
          ))
        ) : (
          filtered.map(item => <LinkedInCard key={item.id} item={item} />)
        )}
      </div>
    </main>
  )
}
