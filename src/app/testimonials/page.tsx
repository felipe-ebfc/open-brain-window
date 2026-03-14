'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { NavHeader } from '@/components/NavHeader'

type Testimonial = {
  id: string
  content: string
  metadata: {
    testimonial_num?: number
    rating?: number
    theme?: string
    training?: string
  } | null
  tags: string[]
  created_at: string
}

const THEME_COLORS: Record<string, string> = {
  'Engagement': '#4caf50',
  'Teaching Style': '#4a9eff',
  'Humor & Energy': '#ff9800',
  'Practical Application': 'var(--accent-teal)',
  'Real-World Examples': '#9b59b6',
  'Course Structure': '#e91e63',
  'Recommendation': 'var(--accent-gold)',
  'Knowledge Depth': '#00b8a9',
  'Improvement Suggestion': '#ff7043',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: 14, letterSpacing: 2 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState('All')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/brain/thoughts?category=testimonial&limit=200')
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        setTestimonials((data.thoughts || []).map((t: any) => ({
          ...t, metadata: t.metadata || {}
        })))
      } catch (err) {
        console.error('Failed to load testimonials:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const themes = useMemo(() => {
    const t = new Set(testimonials.map(t => t.metadata?.theme).filter(Boolean) as string[])
    return ['All', ...Array.from(t).sort()]
  }, [testimonials])

  const avgRating = useMemo(() => {
    const ratings = testimonials.map(t => t.metadata?.rating).filter(Boolean) as number[]
    return ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—'
  }, [testimonials])

  const filtered = useMemo(() => {
    if (selectedTheme === 'All') return testimonials
    return testimonials.filter(t => t.metadata?.theme === selectedTheme)
  }, [testimonials, selectedTheme])

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="RSM Testimonials" back />

      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
        padding: '12px 16px', background: 'var(--bg-surface)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-gold)' }}>
            {loading ? '—' : testimonials.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Reviews</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-gold)' }}>
            {avgRating}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Rating</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-gold)' }}>
            33
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Sessions</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px' }}>
        {themes.map(theme => {
          const count = theme === 'All' ? testimonials.length :
            testimonials.filter(t => t.metadata?.theme === theme).length
          return (
            <button
              key={theme}
              className={`filter-chip ${selectedTheme === theme ? 'active' : ''}`}
              onClick={() => setSelectedTheme(theme)}
            >
              {theme} ({count})
            </button>
          )
        })}
      </div>

      <div style={{ padding: '0 16px 12px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
        <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>{filtered.length}</span> testimonials
        {selectedTheme !== 'All' && ` · ${selectedTheme}`}
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
          ))
        ) : filtered.map(t => {
          const theme = t.metadata?.theme || 'Other'
          const color = THEME_COLORS[theme] || 'var(--border-bright)'
          const isExpanded = expanded.has(t.id)

          return (
            <div
              key={t.id}
              className="paper-card pressable"
              onClick={() => setExpanded(prev => {
                const next = new Set(prev)
                if (next.has(t.id)) next.delete(t.id)
                else next.add(t.id)
                return next
              })}
              style={{ borderLeft: `3px solid ${color}`, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--accent-gold)' }}>
                    <StarRating rating={t.metadata?.rating || 5} />
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 9999,
                    background: `${color}20`, border: `1px solid ${color}40`,
                    fontSize: 10, fontWeight: 700, color,
                  }}>
                    {theme}
                  </span>
                </div>
                <div style={{
                  fontSize: 14, color: 'var(--text-muted)',
                  transition: 'transform 0.15s',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>▾</div>
              </div>
              <div style={{
                fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5,
                fontStyle: 'italic',
                display: isExpanded ? 'block' : '-webkit-box',
                WebkitLineClamp: isExpanded ? 'unset' : 3,
                WebkitBoxOrient: 'vertical' as const,
                overflow: isExpanded ? 'visible' : 'hidden',
              }}>
                "{t.content}"
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                #{t.metadata?.testimonial_num} · {t.metadata?.training}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
