export function LoadingSkeleton({ count = 3, height = 80 }: { count?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height, borderRadius: 12 }} />
      ))}
    </div>
  )
}

export function TileSkeletons() {
  return (
    <div className="tile-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />
      ))}
    </div>
  )
}
