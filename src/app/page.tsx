'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, FeedItem } from '@/lib/supabase'
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
    label: 'Thoughts / Knowledge',
    icon: '💡',
    table: 'thoughts',
    color: 'var(--accent-blue)',
    desc: 'Ideas, notes, patterns',
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

function FeedCard({ item }: { item: FeedItem }) {
  const [expanded, setExpanded] = useState(false)
  const accentColor = SOURCE_COLORS[item.source] || SOURCE_COLORS.general

  return (
    <div
      className="feed-card pressable"
      onClick={() => setExpanded(e => !e)}
      style={{
        borderRadius: 16,
        padding: 16,
        minWidth: 280,
        maxWidth: 320,
        cursor: 'pointer',
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: accentColor,
        marginBottom: 6,
      }}>
        {item.source}
      </div>
      <div style={{
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text-primary)',
        lineHeight: 1.3,
        marginBottom: expanded ? 10 : 0,
      }}>
        {item.title}
      </div>
      {expanded && (
        <div style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          {item.body}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ color: accentColor, display: 'block', marginTop: 8, fontSize: 12, fontWeight: 600 }}
            >
              View →
            </a>
          )}
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
    <div style={{ display: 'flex', gap: 12, padding: '4px 16px' }}>
      {[280, 260, 300].map((w, i) => (
        <div key={i} className="skeleton" style={{ minWidth: w, height: 90, borderRadius: 16, flexShrink: 0 }} />
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
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [tileCounts, setTileCounts] = useState<Record<string, number | null>>(
    Object.fromEntries(TILES.map(t => [t.id, null]))
  )

  useEffect(() => {
    // Load feed items
    async function loadFeed() {
      try {
        const { data } = await supabase
          .from('feed_items')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
        setFeedItems(data || [])
      } catch {
        setFeedItems([])
      } finally {
        setFeedLoading(false)
      }
    }

    // Load tile counts in parallel
    async function loadCounts() {
      const results = await Promise.allSettled(
        TILES.map(async tile => {
          const { count } = await supabase
            .from(tile.table)
            .select('*', { count: 'exact', head: true })
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

    loadFeed()
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
        ) : feedItems.length === 0 ? (
          <div style={{
            padding: '12px 16px 20px',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}>
            No feed items yet. Ask Osito to surface insights.
          </div>
        ) : (
          <div
            className="no-scrollbar"
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              padding: '4px 16px 16px',
            }}
          >
            {feedItems.map(item => (
              <FeedCard key={item.id} item={item} />
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
