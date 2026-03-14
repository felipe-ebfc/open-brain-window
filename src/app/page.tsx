'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { NavHeader } from '@/components/NavHeader'

// ─── Tile definitions (extend as tables are added) ───────────────────────────
const TILES = [
  {
    id: 'atlas',
    label: 'Lean Evidence Atlas',
    icon: '📐',
    table: 'atlas_papers',
    color: 'var(--accent-teal)',
    desc: 'Classified research by era',
    href: '/atlas',
  },
  {
    id: 'thoughts',
    label: 'Knowledge Base',
    icon: '💡',
    table: 'thoughts',
    color: 'var(--accent-blue)',
    desc: 'Concepts, memories, notes — all searchable',
    href: '/thoughts',
  },

  {
    id: 'testimonials',
    label: 'RSM Testimonials',
    icon: '⭐',
    table: 'testimonials',
    color: 'var(--accent-gold)',
    desc: 'Feedback & responses',
    href: '/testimonials',
  },
  {
    id: 'relationships',
    label: 'Relationships',
    icon: '🤝',
    table: 'relationships',
    color: '#9b59b6',
    desc: 'Network & warmth tracking',
    href: '/relationships',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Data',
    icon: '📊',
    table: 'linkedin_data',
    color: '#0077b5',
    desc: 'Connections & engagement',
    href: '/linkedin',
  },
]

// Source accent color map
const SOURCE_COLORS: Record<string, string> = {
  atlas: 'var(--accent-teal)',
  relationships: 'var(--accent-gold)',
  thoughts: 'var(--accent-blue)',
  general: 'var(--border-bright)',
}

type FYPItem = {
  id: string
  title: string
  body: string
  category: string
  tags: string[]
  date: string
  created_at: string
  section: 'recent' | 'resurfaced'
}

// Category color map
const CATEGORY_COLORS: Record<string, string> = {
  concept: '#ff9800',
  memory: '#e91e63',
  general: 'var(--accent-blue)',
  journal: 'var(--accent-teal)',
  'daily-note': 'var(--accent-teal)',
  milestone: 'var(--accent-gold)',
  identity: '#9b59b6',
  decision: '#4caf50',
}

function FYPCard({ item }: { item: FYPItem }) {
  const [expanded, setExpanded] = useState(false)
  const accentColor = CATEGORY_COLORS[item.category] || 'var(--border-bright)'

  return (
    <div
      className="feed-card pressable"
      onClick={() => setExpanded(e => !e)}
      style={{
        borderRadius: 16,
        padding: 16,
        width: '100%',
        minHeight: 200,
        cursor: 'pointer',
        borderLeft: `4px solid ${accentColor}`,
        boxSizing: 'border-box',
        scrollSnapAlign: 'start',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: accentColor,
        }}>
          {item.category}
        </div>
        {item.section === 'resurfaced' && (
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            color: 'var(--accent-gold)',
            background: 'rgba(245, 166, 35, 0.15)',
            padding: '1px 6px',
            borderRadius: 9999,
          }}>
            ✨ resurfaced
          </span>
        )}
      </div>
      <div style={{
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text-primary)',
        lineHeight: 1.3,
        marginBottom: expanded ? 10 : 0,
        display: expanded ? 'block' : '-webkit-box',
        WebkitLineClamp: expanded ? 'unset' : 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: expanded ? 'visible' : 'hidden',
      }}>
        {item.title}
      </div>
      {expanded && item.body && (
        <div style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          {item.body}
        </div>
      )}
      <div style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        marginTop: 8,
      }}>
        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 16px' }}>
      {[1, 2].map((i) => (
        <div key={i} className="skeleton" style={{ width: '100%', height: 200, borderRadius: 16 }} />
      ))}
    </div>
  )
}

function TileCard({ tile, count }: { tile: typeof TILES[0]; count: number | null }) {
  return (
    <Link href={tile.href} style={{ textDecoration: 'none' }}>
      <div
        className="pressable"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 110,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent glow */}
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: tile.color,
          opacity: 0.08,
          pointerEvents: 'none',
        }} />

        <div style={{ fontSize: 22 }}>{tile.icon}</div>

        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}>
            {tile.label}
          </div>
          <div style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            marginTop: 2,
          }}>
            {tile.desc}
          </div>
        </div>

        <div style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
        }}>
          {count === null ? (
            <div className="skeleton" style={{ width: 40, height: 24 }} />
          ) : (
            <>
              <span style={{
                fontSize: 28,
                fontWeight: 800,
                color: tile.color,
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}>
                {count}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>rows</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const [fypItems, setFypItems] = useState<FYPItem[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [tileCounts, setTileCounts] = useState<Record<string, number | null>>(
    Object.fromEntries(TILES.map(t => [t.id, null]))
  )

  useEffect(() => {
    async function loadFYP() {
      try {
        const res = await fetch('/api/brain/fyp?limit=15')
        if (!res.ok) throw new Error(`FYP error: ${res.status}`)
        const data = await res.json()
        setFypItems(data.items || [])
      } catch (err) {
        console.error('FYP load failed:', err)
      } finally {
        setFeedLoading(false)
      }
    }
    loadFYP()

    // Load tile counts via server-side API (bypasses RLS)
    async function loadCounts() {
      const results = await Promise.allSettled(
        TILES.map(async tile => {
          const res = await fetch(`/api/brain/count?table=${tile.table}`)
          if (!res.ok) return { id: tile.id, count: 0 }
          const { count } = await res.json()
          return { id: tile.id, count: count ?? 0 }
        })
      )
      const counts: Record<string, number> = {}
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          counts[r.value.id] = r.value.count
        }
      })
      setTileCounts(prev => ({ ...prev, ...counts }))
    }

    loadCounts()
  }, [])

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh' }}>
      <NavHeader />

      {/* ── FOR YOU FEED ─────────────────────────────── */}
      <section style={{ paddingTop: 20 }}>
        <div style={{
          padding: '0 16px 10px',
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
        }}>
          <h2 style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            margin: 0,
          }}>
            For You
          </h2>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--accent-teal)',
            animation: 'pulse 2s infinite',
          }} />
        </div>

        {feedLoading ? (
          <FeedSkeleton />
        ) : fypItems.length === 0 ? (
          <div style={{
            padding: '12px 16px 20px',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}>
            Your brain is warming up…
          </div>
        ) : (
          <div
            className="no-scrollbar"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              height: 300,
              padding: '4px 16px 16px',
            }}
          >
            {fypItems.map(item => (
              <FYPCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* ── TILE GRID ─────────────────────────────────── */}
      <section>
        <div style={{
          padding: '8px 16px 12px',
        }}>
          <h2 style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            margin: 0,
          }}>
            Your Brain
          </h2>
        </div>

        <div className="tile-grid">
          {TILES.map(tile => (
            <TileCard
              key={tile.id}
              tile={tile}
              count={tileCounts[tile.id]}
            />
          ))}
        </div>
      </section>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </main>
  )
}
