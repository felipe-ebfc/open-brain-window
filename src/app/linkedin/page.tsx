'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { NavHeader } from '@/components/NavHeader'

type LinkedInPost = {
  id: string
  content: string
  metadata: {
    campaign?: string
    status?: string
    scheduled?: string
    has_image?: boolean
  } | null
  tags: string[]
  created_at: string
}

export default function LinkedInPage() {
  const [posts, setPosts] = useState<LinkedInPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState('All')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/brain/thoughts?category=linkedin&limit=200')
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        setPosts((data.thoughts || []).map((t: any) => ({
          ...t, metadata: t.metadata || {}
        })))
      } catch (err) {
        console.error('Failed to load LinkedIn posts:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const campaigns = useMemo(() => {
    const c = new Set(posts.map(p => p.metadata?.campaign).filter(Boolean) as string[])
    return ['All', ...Array.from(c).sort()]
  }, [posts])

  const filtered = useMemo(() => {
    if (selectedCampaign === 'All') return posts
    return posts.filter(p => p.metadata?.campaign === selectedCampaign)
  }, [posts, selectedCampaign])

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="LinkedIn Data" back />

      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
        padding: '12px 16px', background: 'var(--bg-surface)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0077b5' }}>
            {loading ? '—' : posts.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Posts</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0077b5' }}>
            {campaigns.length - 1}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Campaigns</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px' }}>
        {campaigns.map(c => {
          const count = c === 'All' ? posts.length :
            posts.filter(p => p.metadata?.campaign === c).length
          return (
            <button
              key={c}
              className={`filter-chip ${selectedCampaign === c ? 'active' : ''}`}
              onClick={() => setSelectedCampaign(c)}
            >
              {c.replace('campaign-', '')} ({count})
            </button>
          )
        })}
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
          ))
        ) : filtered.map(post => {
          const isExpanded = expanded.has(post.id)
          return (
            <div
              key={post.id}
              className="paper-card pressable"
              onClick={() => setExpanded(prev => {
                const next = new Set(prev)
                if (next.has(post.id)) next.delete(post.id)
                else next.add(post.id)
                return next
              })}
              style={{ borderLeft: '3px solid #0077b5', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  color: '#0077b5', letterSpacing: '0.05em',
                }}>
                  {(post.metadata?.campaign || 'post').replace('campaign-', '')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {post.metadata?.has_image && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📷</span>
                  )}
                  <div style={{
                    fontSize: 14, color: 'var(--text-muted)',
                    transition: 'transform 0.15s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>▾</div>
                </div>
              </div>
              <div style={{
                fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5,
                display: isExpanded ? 'block' : '-webkit-box',
                WebkitLineClamp: isExpanded ? 'unset' : 3,
                WebkitBoxOrient: 'vertical' as const,
                overflow: isExpanded ? 'visible' : 'hidden',
                whiteSpace: 'pre-line',
              }}>
                {post.content}
              </div>
              {isExpanded && post.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                  {post.tags.filter(t => t !== 'linkedin' && t !== 'campaign').map(tag => (
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
        })}
      </div>
    </main>
  )
}
