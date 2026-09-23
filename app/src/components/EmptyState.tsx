import type { ReactNode } from 'react'

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 p-8 text-center ${className}`}
      style={{ animation: 'db-fade-up 200ms ease-out' }}
    >
      <span className="mb-3 inline-flex size-12 items-center justify-center rounded-lg border border-line bg-surface text-muted">
        {icon}
      </span>
      <h2 className="font-sans text-lg font-semibold tracking-[-0.02em] text-ink">{title}</h2>
      {description ? <p className="max-w-sm text-sm leading-6 text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
