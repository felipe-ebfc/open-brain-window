'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { supabase, Testimonial } from '@/lib/supabase'
import { NavHeader } from '@/components/NavHeader'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{
          fontSize: 12,
          color: i <= rating ? 'var(--accent-gold)' : 'var(--border-bright)',
        }}>★</span>
      ))}
    </div>
  )
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 14,
      borderLeft: '3px solid var(--accent-gold)',
    }}>
      <div style={{
        fontSize: 14,
        color: 'var(--text-primary)',
        lineHeight: 1.5,
        fontStyle: 'italic',
      }}>
        &ldquo;{item.quote}&rdquo;
      </div>
      <div style={{
        marginTop: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          {item.author && (
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
              {item.author}
            </div>
          )}
          {item.session && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {item.session}
            </div>
          )}
        </div>
        {item.rating && <StarRating rating={item.rating} />}
      </div>
    </div>
  )
}

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [minRating, setMinRating] = useState(0)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const sessions = useMemo(() => {
    const s = new Set(items.map(i => i.session).filter(Boolean) as string[])
    return ['All', ...Array.from(s).sort()]
  }, [items])

  const [selectedSession, setSelectedSession] = useState('All')

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchSession = selectedSession === 'All' || i.session === selectedSession
      const matchRating = !minRating || (i.rating || 0) >= minRating
      const matchSearch = !search ||
        i.quote.toLowerCase().includes(search.toLowerCase()) ||
        (i.author || '').toLowerCase().includes(search.toLowerCase())
      return matchSession && matchRating && matchSearch
    })
  }, [items, selectedSession, minRating, search])

  const avgRating = useMemo(() => {
    const rated = items.filter(i => i.rating)
    if (!rated.length) return 0
    return (rated.reduce((sum, i) => sum + (i.rating || 0), 0) / rated.length).toFixed(1)
  }, [items])

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="RSM Testimonials" back />

      {/* Stats */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        background: 'var(--bg-surface)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-gold)', letterSpacing: '-0.04em' }}>
            {items.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-gold)', letterSpacing: '-0.04em' }}>
            {avgRating}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Rating</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-gold)', letterSpacing: '-0.04em' }}>
            {sessions.length - 1}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Sessions</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 16px 8px' }}>
        <input
          className="search-input"
          type="search"
          placeholder="Search quotes, authors…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter: Rating */}
      <div className="no-scrollbar" style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '8px 16px 12px',
      }}>
        {[0, 3, 4, 5].map(r => (
          <button
            key={r}
            className={`filter-chip ${minRating === r ? 'active' : ''}`}
            onClick={() => setMinRating(r)}
          >
            {r === 0 ? 'All ratings' : `${r}★+`}
          </button>
        ))}
        <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
        {sessions.map(s => (
          <button
            key={s}
            className={`filter-chip ${selectedSession === s ? 'active' : ''}`}
            onClick={() => setSelectedSession(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px 4px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
        {filtered.length} responses
      </div>

      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <LoadingSkeleton count={5} height={100} />
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            No testimonials match your filters.
          </div>
        ) : (
          filtered.map(item => (
            <TestimonialCard key={item.id} item={item} />
          ))
        )}
      </div>
    </main>
  )
}
