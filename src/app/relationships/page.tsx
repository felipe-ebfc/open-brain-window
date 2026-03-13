'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { supabase, Relationship } from '@/lib/supabase'
import { NavHeader } from '@/components/NavHeader'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

function WarmthBar({ warmth }: { warmth: number }) {
  const COLORS = ['#e84040', '#f5a623', '#f5a623', '#4caf50', '#00b8a9']
  const labels = ['Cold', 'Cooling', 'Warm', 'Active', '🔥 Hot']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: i <= warmth ? COLORS[warmth - 1] : 'var(--border)',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{labels[(warmth || 1) - 1]}</div>
    </div>
  )
}

function daysSince(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function RelationshipCard({ person }: { person: Relationship }) {
  const days = person.last_contact ? daysSince(person.last_contact) : null
  const isAtRisk = days !== null && days > 60
  const isWarning = days !== null && days > 30 && days <= 60

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isAtRisk ? 'rgba(232, 64, 64, 0.4)' : isWarning ? 'rgba(245, 166, 35, 0.3)' : 'var(--border)'}`,
      borderRadius: 12,
      padding: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {person.name}
          </div>
          {person.org && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {person.org}
            </div>
          )}
        </div>
        {person.warmth && <WarmthBar warmth={person.warmth} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {days !== null && (
          <span style={{
            padding: '3px 10px',
            borderRadius: 9999,
            fontSize: 11,
            fontWeight: 700,
            background: isAtRisk ? 'rgba(232, 64, 64, 0.15)' : isWarning ? 'rgba(245, 166, 35, 0.15)' : 'var(--bg-elevated)',
            color: isAtRisk ? '#e84040' : isWarning ? 'var(--accent-gold)' : 'var(--text-muted)',
            border: `1px solid ${isAtRisk ? 'rgba(232, 64, 64, 0.3)' : isWarning ? 'rgba(245, 166, 35, 0.3)' : 'var(--border)'}`,
          }}>
            {days === 0 ? 'Today' : `${days}d ago`}
          </span>
        )}
        {person.tags?.map(tag => (
          <span key={tag} style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '2px 8px',
            borderRadius: 9999,
            fontSize: 11,
          }}>
            {tag}
          </span>
        ))}
      </div>

      {person.notes && (
        <div style={{
          marginTop: 8,
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
          borderTop: '1px solid var(--border)',
          paddingTop: 8,
        }}>
          {person.notes}
        </div>
      )}
    </div>
  )
}

export default function RelationshipsPage() {
  const [people, setPeople] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'At Risk' | 'Active'>('All')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('relationships')
        .select('*')
        .order('last_contact', { ascending: true })
      setPeople(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return people.filter(p => {
      const days = p.last_contact ? daysSince(p.last_contact) : null
      const matchFilter = filter === 'All' ||
        (filter === 'At Risk' && days !== null && days > 30) ||
        (filter === 'Active' && days !== null && days <= 30)
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.org || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
      return matchFilter && matchSearch
    })
  }, [people, filter, search])

  const atRiskCount = useMemo(() =>
    people.filter(p => p.last_contact && daysSince(p.last_contact) > 30).length,
    [people]
  )

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="Relationships" back />

      {/* Stats */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        background: 'var(--bg-surface)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#9b59b6', letterSpacing: '-0.04em' }}>
            {people.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: atRiskCount > 0 ? '#e84040' : '#4caf50', letterSpacing: '-0.04em' }}>
            {atRiskCount}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>At Risk</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#9b59b6', letterSpacing: '-0.04em' }}>
            {people.length - atRiskCount}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Warm</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 16px 8px' }}>
        <input
          className="search-input"
          type="search"
          placeholder="Search name, org, tags…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px 16px' }}>
        {(['All', 'At Risk', 'Active'] as const).map(f => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'At Risk' ? '⚠ At Risk' : f}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px 4px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
        {filtered.length} contacts
      </div>

      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <LoadingSkeleton count={5} height={100} />
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            No contacts yet. Ask Osito to populate from your daily notes.
          </div>
        ) : (
          filtered.map(p => <RelationshipCard key={p.id} person={p} />)
        )}
      </div>
    </main>
  )
}
