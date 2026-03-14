'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Relationship } from '@/lib/supabase'
import { NavHeader } from '@/components/NavHeader'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

// ─── Constants ────────────────────────────────────────────────────────────────

const WARMTH_COLORS = ['#e84040', '#f5983a', '#f5c842', '#4caf50', '#00b8a9']
const WARMTH_LABELS = ['Cold', 'Cooling', 'Neutral', 'Active', '🔥 Hot']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function avgWarmth(people: Relationship[]): number | null {
  const withWarmth = people.filter(p => p.warmth)
  if (!withWarmth.length) return null
  return withWarmth.reduce((sum, p) => sum + (p.warmth ?? 0), 0) / withWarmth.length
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WarmthDots({ warmth }: { warmth: number }) {
  const color = WARMTH_COLORS[warmth - 1]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: i <= warmth ? color : 'var(--border)',
            transition: 'background 0.15s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{WARMTH_LABELS[warmth - 1]}</div>
    </div>
  )
}

function WarmthPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(w => (
        <button
          key={w}
          onClick={() => onChange(w)}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: `2px solid ${value === w ? WARMTH_COLORS[w - 1] : 'var(--border)'}`,
            background: value === w ? `${WARMTH_COLORS[w - 1]}22` : 'var(--bg-card)',
            color: value === w ? WARMTH_COLORS[w - 1] : 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {w}
        </button>
      ))}
    </div>
  )
}

function RelationshipCard({
  person,
  onDelete,
}: {
  person: Relationship
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const days = person.last_contact ? daysSince(person.last_contact) : null
  const isAtRisk = days !== null && days > 60
  const isWarning = days !== null && days > 30 && days <= 60

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Remove ${person.name} from your network?`)) return
    setDeleting(true)
    await fetch(`/api/brain/relationships?id=${person.id}`, { method: 'DELETE' })
    onDelete(person.id)
  }

  return (
    <div
      className="pressable"
      onClick={() => setExpanded(e => !e)}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isAtRisk ? 'rgba(232, 64, 64, 0.4)' : isWarning ? 'rgba(245, 166, 35, 0.3)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: 14,
        cursor: 'pointer',
        opacity: deleting ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {person.name}
          </div>
          {(person.role || person.company) && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {[person.role, person.company].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 12 }}>
          {person.warmth && <WarmthDots warmth={person.warmth} />}
          <span style={{
            fontSize: 16,
            color: 'var(--text-muted)',
            display: 'inline-block',
            transform: `rotate(${expanded ? 90 : 0}deg)`,
            transition: 'transform 0.15s',
            lineHeight: 1,
          }}>›</span>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{
          padding: '3px 10px',
          borderRadius: 9999,
          fontSize: 11,
          fontWeight: 700,
          background: isAtRisk
            ? 'rgba(232, 64, 64, 0.15)'
            : isWarning
              ? 'rgba(245, 166, 35, 0.15)'
              : 'var(--bg-elevated)',
          color: isAtRisk ? '#e84040' : isWarning ? 'var(--accent-gold)' : 'var(--text-muted)',
          border: `1px solid ${isAtRisk ? 'rgba(232, 64, 64, 0.3)' : isWarning ? 'rgba(245, 166, 35, 0.3)' : 'var(--border)'}`,
        }}>
          {days === null ? 'Never' : days === 0 ? 'Today' : `${days}d ago`}
        </span>
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

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          {person.notes && (
            <div style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: 12,
            }}>
              {person.notes}
            </div>
          )}
          <button
            onClick={handleDelete}
            style={{
              background: 'rgba(232, 64, 64, 0.1)',
              border: '1px solid rgba(232, 64, 64, 0.3)',
              color: '#e84040',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 14,
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
  outline: 'none',
}

function AddModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (person: Relationship) => void
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [warmth, setWarmth] = useState(3)
  const [lastContact, setLastContact] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/brain/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim() || undefined,
          company: company.trim() || undefined,
          notes: notes.trim() || undefined,
          warmth,
          last_contact: lastContact || undefined,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); return }
      onSave(data.item)
      onClose()
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
      />
      {/* Bottom sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-elevated)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px 40px',
        zIndex: 201,
        maxHeight: '92dvh',
        overflowY: 'auto',
      }}>
        {/* Drag handle */}
        <div style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          background: 'var(--border-bright)',
          margin: '0 auto 20px',
        }} />

        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20, letterSpacing: '-0.02em' }}>
          Add to Network
        </div>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Name *
          </div>
          <input
            style={INPUT_STYLE}
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Role */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Role
          </div>
          <input
            style={INPUT_STYLE}
            placeholder="Product Manager, Researcher…"
            value={role}
            onChange={e => setRole(e.target.value)}
          />
        </div>

        {/* Company */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Company / Org
          </div>
          <input
            style={INPUT_STYLE}
            placeholder="Acme Corp, EBFC…"
            value={company}
            onChange={e => setCompany(e.target.value)}
          />
        </div>

        {/* Warmth */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Warmth
          </div>
          <WarmthPicker value={warmth} onChange={setWarmth} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            {WARMTH_LABELS[warmth - 1]} ({warmth}/5)
          </div>
        </div>

        {/* Last Contact */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Last Contact
          </div>
          <input
            type="date"
            style={INPUT_STYLE}
            value={lastContact}
            onChange={e => setLastContact(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Tags (comma-separated)
          </div>
          <input
            style={INPUT_STYLE}
            placeholder="boldt, ebfc, mentor…"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Notes
          </div>
          <textarea
            style={{ ...INPUT_STYLE, minHeight: 72, resize: 'vertical' }}
            placeholder="How you met, what to follow up on…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <div style={{ color: '#e84040', fontSize: 12, marginBottom: 12, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          style={{
            width: '100%',
            background: saving || !name.trim() ? 'var(--bg-card)' : '#9b59b6',
            border: 'none',
            borderRadius: 12,
            padding: '14px',
            fontSize: 15,
            fontWeight: 800,
            color: saving || !name.trim() ? 'var(--text-muted)' : '#fff',
            cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {saving ? 'Saving…' : 'Add to Network'}
        </button>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type WarmthFilter = 'All' | 1 | 2 | 3 | 4 | 5

export default function RelationshipsPage() {
  const [people, setPeople] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [warmthFilter, setWarmthFilter] = useState<WarmthFilter>('All')
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/brain/relationships?limit=500')
        const data = await res.json()
        setPeople(data.items || [])
      } catch (err) {
        console.error('[RelationshipsPage] load failed:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return people.filter(p => {
      const matchWarmth = warmthFilter === 'All' || p.warmth === warmthFilter
      const q = search.toLowerCase()
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.role || '').toLowerCase().includes(q) ||
        (p.company || '').toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      return matchWarmth && matchSearch
    })
  }, [people, warmthFilter, search])

  const avg = useMemo(() => avgWarmth(people), [people])

  // Counts per warmth level
  const warmthCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    people.forEach(p => { if (p.warmth) counts[p.warmth] = (counts[p.warmth] || 0) + 1 })
    return counts
  }, [people])

  const handleDelete = useCallback((id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id))
  }, [])

  const handleAdd = useCallback((person: Relationship) => {
    setPeople(prev => [person, ...prev])
  }, [])

  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 96 }}>
      <NavHeader title="Relationships" back />

      {/* ── Stats bar ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
      }}>
        {/* Total */}
        <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#9b59b6', letterSpacing: '-0.04em' }}>
            {people.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total
          </div>
        </div>

        <div style={{ width: 1, background: 'var(--border)' }} />

        {/* Avg warmth */}
        <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px' }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: avg ? WARMTH_COLORS[Math.round(avg) - 1] : 'var(--text-muted)' }}>
            {avg ? avg.toFixed(1) : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Avg warmth
          </div>
        </div>

        <div style={{ width: 1, background: 'var(--border)' }} />

        {/* Warmth breakdown: 5 colored circles */}
        <div style={{ flex: 2, padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map(w => (
              <div
                key={w}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: warmthCounts[w] > 0 ? `${WARMTH_COLORS[w - 1]}33` : 'var(--bg-card)',
                  border: `2px solid ${warmthCounts[w] > 0 ? WARMTH_COLORS[w - 1] : 'var(--border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 800,
                  color: warmthCounts[w] > 0 ? WARMTH_COLORS[w - 1] : 'var(--text-muted)',
                }}>
                  {warmthCounts[w] || 0}
                </div>
                <div style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 600 }}>★{w}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            By warmth
          </div>
        </div>
      </div>

      {/* ── Search ────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 8px' }}>
        <input
          className="search-input"
          type="search"
          placeholder="Search name, role, company, tags…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Warmth filter chips ────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px 16px', overflowX: 'auto' }} className="no-scrollbar">
        {(['All', 5, 4, 3, 2, 1] as const).map(w => (
          <button
            key={w}
            className={`filter-chip ${warmthFilter === w ? 'active' : ''}`}
            onClick={() => setWarmthFilter(w)}
            style={warmthFilter === w && w !== 'All' ? {
              borderColor: WARMTH_COLORS[(w as number) - 1],
              color: WARMTH_COLORS[(w as number) - 1],
              background: `${WARMTH_COLORS[(w as number) - 1]}18`,
            } : {}}
          >
            {w === 'All' ? 'All' : `★${w}`}
            {w !== 'All' && warmthCounts[w as number] > 0 && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>·{warmthCounts[w as number]}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Results count ─────────────────────────────── */}
      <div style={{ padding: '0 16px 8px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
        {filtered.length} {filtered.length === 1 ? 'contact' : 'contacts'}
        {search || warmthFilter !== 'All' ? ` · filtered` : ''}
      </div>

      {/* ── List ──────────────────────────────────────── */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <LoadingSkeleton count={5} height={100} />
        ) : filtered.length === 0 ? (
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 14,
            padding: '32px 0',
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            {people.length === 0
              ? 'No contacts yet.\nTap + to add your first relationship.'
              : 'No contacts match this filter.'}
          </div>
        ) : (
          filtered.map(p => (
            <RelationshipCard key={p.id} person={p} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* ── FAB ───────────────────────────────────────── */}
      <button
        onClick={() => setShowAdd(true)}
        style={{
          position: 'fixed',
          bottom: 28,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#9b59b6',
          border: 'none',
          boxShadow: '0 4px 20px rgba(155, 89, 182, 0.5)',
          fontSize: 24,
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
        aria-label="Add relationship"
      >
        +
      </button>

      {/* ── Add modal ─────────────────────────────────── */}
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}
    </main>
  )
}
