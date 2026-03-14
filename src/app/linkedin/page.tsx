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
}

type Counts = {
  connections: number
  posts: number
  comments: number
  endorsements: number
  positions: number
}

type Tab = 'posts' | 'connections' | 'comments' | 'endorsements' | 'positions'

const TABS: { key: Tab; label: string; short: string }[] = [
  { key: 'posts', label: 'Posts', short: 'Post' },
  { key: 'connections', label: 'Connections', short: 'Conn' },
  { key: 'comments', label: 'Comments', short: 'Cmnt' },
  { key: 'endorsements', label: 'Endorsements', short: 'End.' },
  { key: 'positions', label: 'Positions', short: 'Pos.' },
]

function TabSelector({
  activeTab,
  counts,
  onChange,
}: {
  activeTab: Tab
  counts: Counts | null
  onChange: (tab: Tab) => void
}) {
  const total = counts
    ? counts.connections + counts.posts + counts.comments + counts.endorsements + counts.positions
    : null

  return (
    <div style={{
      padding: '8px 16px 4px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
        {/* Total pill — non-clickable */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 4, padding: '4px 6px',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--bg-elevated)', border: '2px solid #0077b5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 7, fontWeight: 800, color: '#0077b5',
          }}>
            All
          </div>
          <div style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 600 }}>
            {total !== null ? total.toLocaleString() : '—'}
          </div>
        </div>

        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: activeTab === tab.key ? '#0077b5' : 'var(--bg-elevated)',
              border: '2px solid #0077b5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 800,
              color: activeTab === tab.key ? '#fff' : '#0077b5',
              transition: 'all 0.15s',
            }}>
              {tab.short}
            </div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 600 }}>
              {counts ? counts[tab.key].toLocaleString() : '—'}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function PostCard({ item }: { item: LinkedInItem }) {
  const [expanded, setExpanded] = useState(false)
  const campaign = item.metadata?.campaign?.replace('campaign-', '') || null

  return (
    <div
      className="paper-card pressable"
      onClick={() => setExpanded(e => !e)}
      style={{ borderLeft: '3px solid #0077b5', cursor: 'pointer', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {campaign && (
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              color: '#0077b5', letterSpacing: '0.05em', marginBottom: 4,
            }}>
              {campaign}
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
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {item.metadata?.has_image && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📷</span>
          )}
          <span style={{
            fontSize: 14, color: 'var(--text-muted)', display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}>▾</span>
        </div>
      </div>
      {expanded && item.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {item.tags.filter(t => !t.startsWith('linkedin')).map(tag => (
            <span key={tag} style={{
              padding: '2px 6px', borderRadius: 9999,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              fontSize: 10, color: 'var(--text-muted)',
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ConnectionCard({ item }: { item: LinkedInItem }) {
  // Parse 'FirstName LastName\nTitle at Company\nConnected on Date'
  const lines = item.content.split('\n').filter(Boolean)
  const name = lines[0] || item.content.slice(0, 80)
  const titleCompany = lines[1] || ''
  const connectedDate = lines[2] || ''

  return (
    <div className="paper-card" style={{
      borderLeft: '3px solid #0077b5', padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: '#0077b5', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
      }}>
        {name.trim().charAt(0).toUpperCase()}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </div>
        {titleCompany && (
          <div style={{
            fontSize: 11, color: 'var(--text-secondary)', marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {titleCompany}
          </div>
        )}
        {connectedDate && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
            {connectedDate}
          </div>
        )}
      </div>
    </div>
  )
}

function CommentCard({ item }: { item: LinkedInItem }) {
  const [expanded, setExpanded] = useState(false)
  const lines = item.content.split('\n').filter(Boolean)
  const firstLine = lines[0] || item.content.slice(0, 100)
  const rest = lines.slice(1).join('\n')

  return (
    <div
      className="paper-card pressable"
      onClick={() => setExpanded(e => !e)}
      style={{ borderLeft: '3px solid #0077b5', cursor: 'pointer', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {firstLine}
          </div>
          {expanded && rest && (
            <div style={{
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 8,
              borderTop: '1px solid var(--border)', paddingTop: 8, whiteSpace: 'pre-line',
            }}>
              {rest}
            </div>
          )}
        </div>
        <span style={{
          fontSize: 14, color: 'var(--text-muted)', flexShrink: 0, display: 'inline-block',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
        }}>▾</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
        {new Date(item.created_at).toLocaleDateString()}
      </div>
    </div>
  )
}

function EndorsementCard({ item }: { item: LinkedInItem }) {
  const skill = item.content.split('\n')[0] || item.content.slice(0, 60)
  const count = item.metadata?.endorsement_count || item.metadata?.count || null

  return (
    <div className="paper-card" style={{
      borderLeft: '3px solid #0077b5', padding: '8px 12px',
      display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden',
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>⭐</span>
      <span style={{
        fontSize: 13, color: 'var(--text-primary)', fontWeight: 500,
        flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {skill}
      </span>
      {count != null && (
        <span style={{
          background: 'rgba(0,119,181,0.15)', border: '1px solid rgba(0,119,181,0.3)',
          borderRadius: 9999, fontSize: 10, fontWeight: 700, color: '#0077b5',
          padding: '2px 7px', flexShrink: 0,
        }}>
          {count}
        </span>
      )}
    </div>
  )
}

function PositionCard({ item }: { item: LinkedInItem }) {
  const lines = item.content.split('\n').filter(Boolean)
  const title = lines[0] || ''
  const company = lines[1] || ''
  const dateRange = lines[2] || lines.find(l => /\d{4}|[Pp]resent/.test(l)) || ''

  return (
    <div className="paper-card" style={{ borderLeft: '3px solid #0077b5', padding: '10px 12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </div>
          {company && (
            <div style={{
              fontSize: 11, color: 'var(--text-secondary)', marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
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
    </div>
  )
}

export default function LinkedInPage() {
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [items, setItems] = useState<LinkedInItem[]>([])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadTab = useCallback(async (tab: Tab) => {
    setLoading(true)
    try {
      const limit = tab === 'connections' ? 200 : 100
      const res = await fetch(`/api/brain/linkedin?type=${tab}&limit=${limit}`)
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
    loadTab('posts')
  }, [loadTab])

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    setSearch('')
    setItems([])
    loadTab(tab)
  }

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(item => item.content.toLowerCase().includes(q))
  }, [items, search])

  const activeLabel = TABS.find(t => t.key === activeTab)?.label ?? activeTab

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="LinkedIn Data" back />

      {/* Combined tab + stats selector */}
      <TabSelector activeTab={activeTab} counts={counts} onChange={handleTabChange} />

      {/* Search */}
      <div style={{ padding: '16px 16px 8px', position: 'relative' }}>
        <input
          className="search-input"
          type="search"
          placeholder={`Search ${activeLabel.toLowerCase()}…`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingRight: search ? 36 : undefined }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 28, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: '0 4px',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Results count */}
      <div style={{ padding: '0 16px 12px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
        <span style={{ color: '#0077b5', fontWeight: 800 }}>{loading ? '—' : filtered.length}</span>
        {' '}items · {activeLabel}
      </div>

      {/* Content list */}
      <div style={{
        padding: '0 16px',
        display: 'flex', flexDirection: 'column',
        gap: activeTab === 'endorsements' ? 6 : 10,
      }}>
        {loading ? (
          <LoadingSkeleton
            count={6}
            height={activeTab === 'connections' || activeTab === 'endorsements' ? 56 : 90}
          />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 14 }}>
            {search ? 'No results match your search.' : `No ${activeLabel.toLowerCase()} found.`}
          </div>
        ) : (
          filtered.map(item => {
            if (activeTab === 'posts') return <PostCard key={item.id} item={item} />
            if (activeTab === 'connections') return <ConnectionCard key={item.id} item={item} />
            if (activeTab === 'comments') return <CommentCard key={item.id} item={item} />
            if (activeTab === 'endorsements') return <EndorsementCard key={item.id} item={item} />
            if (activeTab === 'positions') return <PositionCard key={item.id} item={item} />
            return null
          })
        )}
      </div>
    </main>
  )
}
