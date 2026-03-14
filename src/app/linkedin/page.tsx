'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { NavHeader } from '@/components/NavHeader'

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

const TABS: { key: Tab; label: string }[] = [
  { key: 'posts', label: 'Posts' },
  { key: 'connections', label: 'Connections' },
  { key: 'comments', label: 'Comments' },
  { key: 'endorsements', label: 'Endorsements' },
  { key: 'positions', label: 'Positions' },
]

function PostCard({ item }: { item: LinkedInItem }) {
  const [expanded, setExpanded] = useState(false)
  const campaign = item.metadata?.campaign?.replace('campaign-', '') || null

  return (
    <div
      className="paper-card pressable"
      onClick={() => setExpanded(e => !e)}
      style={{ borderLeft: '3px solid #0077b5', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        {campaign && (
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            color: '#0077b5', letterSpacing: '0.05em',
          }}>
            {campaign}
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          {item.metadata?.has_image && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📷</span>
          )}
          <div style={{
            fontSize: 14, color: 'var(--text-muted)',
            transition: 'transform 0.15s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>▾</div>
        </div>
      </div>
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
  // Content is typically "Name - Title at Company"
  const lines = item.content.split('\n').filter(Boolean)
  const firstLine = lines[0] || item.content.slice(0, 80)
  const rest = lines.slice(1, 3).join(' • ')

  return (
    <div className="paper-card" style={{
      borderLeft: '3px solid #0077b5', padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: '#0077b5', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
      }}>
        {firstLine.trim().charAt(0).toUpperCase()}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {firstLine}
        </div>
        {rest && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {rest}
          </div>
        )}
      </div>
    </div>
  )
}

function CommentCard({ item }: { item: LinkedInItem }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="paper-card pressable"
      onClick={() => setExpanded(e => !e)}
      style={{ borderLeft: '3px solid #0077b5', cursor: 'pointer' }}
    >
      <div style={{
        fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5,
        display: expanded ? 'block' : '-webkit-box',
        WebkitLineClamp: expanded ? 'unset' : 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: expanded ? 'visible' : 'hidden',
        whiteSpace: 'pre-line',
      }}>
        {item.content}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
        {new Date(item.created_at).toLocaleDateString()}
      </div>
    </div>
  )
}

function EndorsementCard({ item }: { item: LinkedInItem }) {
  const skill = item.content.split('\n')[0] || item.content.slice(0, 60)

  return (
    <div className="paper-card" style={{
      borderLeft: '3px solid #0077b5', padding: '8px 12px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 14 }}>⭐</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{skill}</span>
    </div>
  )
}

function PositionCard({ item }: { item: LinkedInItem }) {
  const lines = item.content.split('\n').filter(Boolean)
  const title = lines[0] || item.content.slice(0, 80)
  const company = lines[1] || ''

  return (
    <div className="paper-card" style={{ borderLeft: '3px solid #0077b5', padding: '10px 12px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      {company && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{company}</div>
      )}
    </div>
  )
}

export default function LinkedInPage() {
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [items, setItems] = useState<LinkedInItem[]>([])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set())

  const loadTab = useCallback(async (tab: Tab) => {
    setLoading(true)
    try {
      const limit = tab === 'connections' ? 200 : tab === 'comments' ? 100 : 100
      const res = await fetch(`/api/brain/linkedin?type=${tab}&limit=${limit}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setItems(data.items || [])
      if (data.counts) setCounts(data.counts)
      setLoadedTabs(prev => new Set([...prev, tab]))
    } catch (err) {
      console.error('Failed to load LinkedIn data:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Load counts on mount (via first tab load)
  useEffect(() => {
    loadTab('posts')
  }, [loadTab])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setItems([])
    loadTab(tab)
  }

  const total = counts
    ? (counts.connections + counts.posts + counts.comments + counts.endorsements + counts.positions)
    : 0

  const STAT_ITEMS = [
    { key: 'connections', label: 'Connections' },
    { key: 'posts', label: 'Posts' },
    { key: 'comments', label: 'Comments' },
    { key: 'endorsements', label: 'Endorsements' },
    { key: 'positions', label: 'Positions' },
  ] as const

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="LinkedIn Data" back />

      {/* Stats bar */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)', overflowX: 'auto',
      }}>
        <div style={{
          flex: '0 0 auto', padding: '12px 20px', textAlign: 'center',
          borderRight: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0077b5' }}>
            {counts ? total.toLocaleString() : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
        </div>
        {STAT_ITEMS.map(stat => (
          <div
            key={stat.key}
            style={{
              flex: '1 0 auto', padding: '12px 16px', textAlign: 'center',
              borderRight: '1px solid var(--border)', cursor: 'pointer',
              background: activeTab === stat.key ? 'var(--bg-elevated)' : 'transparent',
            }}
            onClick={() => handleTabChange(stat.key)}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0077b5' }}>
              {counts ? counts[stat.key].toLocaleString() : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        borderBottom: '1px solid var(--border)', overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`filter-chip ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
            {counts && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>
                ({counts[tab.key].toLocaleString()})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        flexDirection: activeTab === 'connections' ? 'column' : 'column',
        gap: activeTab === 'endorsements' ? 6 : 10,
      }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{
              height: activeTab === 'connections' || activeTab === 'endorsements' ? 56 : 90,
              borderRadius: 12,
            }} />
          ))
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 14 }}>
            No {activeTab} found
          </div>
        ) : (
          items.map(item => {
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
