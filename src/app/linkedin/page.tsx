'use client'

import { NavHeader } from '@/components/NavHeader'

export default function LinkedInPage() {
  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh', paddingBottom: 32 }}>
      <NavHeader title="LinkedIn Data" back />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 32px',
        gap: 16,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48 }}>📊</div>
        <div style={{
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          LinkedIn Data
        </div>
        <div style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          maxWidth: 280,
        }}>
          Connections, engagement, and growth metrics. Needs ingestion via ingest.ebfc.ai first.
        </div>
        <a
          href="https://ingest.ebfc.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="ingest-btn"
          style={{ marginTop: 8, fontSize: 14, padding: '12px 24px' }}
        >
          <span>+</span>
          <span>Ingest LinkedIn Data</span>
        </a>
      </div>
    </main>
  )
}
