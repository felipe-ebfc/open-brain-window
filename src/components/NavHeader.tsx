'use client'

import Link from 'next/link'

interface NavHeaderProps {
  title?: string
  back?: boolean
  backHref?: string
}

export function NavHeader({ title, back, backHref = '/' }: NavHeaderProps) {
  return (
    <div className="nav-header">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
      }}>
        {back ? (
          <Link href={backHref} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--accent-teal)',
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
            padding: '6px 0',
          }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>‹</span>
            <span>Home</span>
          </Link>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-blue) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}>🧠</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {title || 'Open Brain'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                PERSONAL OS
              </div>
            </div>
          </div>
        )}

        {back && title && (
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            {title}
          </div>
        )}

        <a
          href="https://ingest.ebfc.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="ingest-btn"
        >
          <span>+</span>
          <span>INGEST</span>
        </a>
      </div>
    </div>
  )
}
