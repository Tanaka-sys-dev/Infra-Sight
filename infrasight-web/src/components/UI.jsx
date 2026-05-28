export function SkeletonPage({ variant = 'dashboard' }) {
  const rows = variant === 'table' ? 8 : 4
  return (
    <div className="ui-page ui-skeleton-page" aria-busy="true" aria-label="Loading content">
      <div className="ui-hero skeleton-hero">
        <div><span className="skeleton line short" /><span className="skeleton line long" /></div>
        <span className="skeleton pill" />
      </div>
      <div className="ui-kpi-grid">
        {[1, 2, 3, 4].map(item => <div className="ui-card ui-kpi-card" key={item}><span className="skeleton line tiny" /><span className="skeleton number" /><span className="skeleton line medium" /></div>)}
      </div>
      <div className="ui-card">
        {Array.from({ length: rows }).map((_, index) => <div className="skeleton-row" key={index}><span className="skeleton pill" /><span className="skeleton line long" /><span className="skeleton line medium" /></div>)}
      </div>
    </div>
  )
}

export function EmptyState({ title = 'No records available', detail = 'No matching monitoring records were found for this view.' }) {
  return <div className="ui-empty"><strong>{title}</strong><span>{detail}</span></div>
}

export function ErrorState({ message, onRetry }) {
  return <div className="ui-error" role="alert"><strong>Unable to load this view</strong><span>{message}</span>{onRetry && <button onClick={onRetry}>Retry</button>}</div>
}
