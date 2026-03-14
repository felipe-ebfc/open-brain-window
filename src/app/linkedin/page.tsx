'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
type SearchMode = 'text' | 'tags'

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

  if ((rawType === 'post' || rawType === 'comment') && item.metadata?.date) {
    // Format: '2026-01-26 05:27:08'
    const d = new Date(String(item.metadata.date).replace(' ', 'T'))
    if (!isNaN(d.getTime())) return d
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
      const count = item.metadata?.endorsement_count || item.metadata?.count || null
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>⭐</span>
          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {skill}
          </span>
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
                {item.parent_post_preview}{item.parent_post_preview.length === 150 ? '…' : ''}
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
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {formatItemDate(item)}
        </span>
      </div>
    </div>
  )
}

export default function LinkedInPage() {
  const [selectedType, setSelectedType] = useState<TypeFilter>('posts')
  const [items, setItems] = useState<LinkedInItem[]>([])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('text')
  const [sort, setSort] = useState<SortOption>('Newest')

  const loadType = useCallback(async (type: Exclude<TypeFilter, 'all'>) => {
    setLoading(true)
    try {
      const limit = type === 'connections' ? 200 : 100
      const res = await fetch(`/api/brain/linkedin?type=${type}&limit=${limit}`)
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
    loadType('posts')
  }, [loadType])

  const handleTypeChange = (type: TypeFilter) => {
    if (type === selectedType) return
    setSelectedType(type)
    setSearch('')
    if (type !== 'all') {
      setItems([])
      loadType(type)
    }
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
    let result = [...items]

    if (search) {
      const q = search.toLowerCase()
      if (searchMode === 'text') {
        result = result.filter(item => item.content.toLowerCase().includes(q))
      } else {
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
  }, [items, search, searchMode, sort])

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
            {total !== null ? total.toLocaleString() : '—'}
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
            {loading ? '—' : filtered.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Showing</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 16px 8px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          className="search-input"
          type="search"
          placeholder={searchMode === 'tags' ? 'Search by tag…' : 'Search content…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          onClick={() => setSearchMode(m => m === 'text' ? 'tags' : 'text')}
          style={{
            background: searchMode === 'tags' ? 'rgba(0,119,181,0.2)' : 'var(--bg-elevated)',
            border: `1px solid ${searchMode === 'tags' ? '#0077b5' : 'var(--border)'}`,
            color: searchMode === 'tags' ? '#0077b5' : 'var(--text-muted)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          {searchMode === 'tags' ? '🏷️ Tags' : '🔤 Text'}
        </button>
      </div>

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
                {type} · {typeItems.length}
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
