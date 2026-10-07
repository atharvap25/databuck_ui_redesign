import { useEffect, useId, useState, type ReactNode } from 'react'
import { SparkIcon } from '../icons.tsx'

export const aiSecondaryButton =
  'inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-canvas px-3 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:cursor-not-allowed disabled:text-outline'

export const aiActionButton =
  'inline-flex h-10 items-center gap-2 rounded-md border border-indigo bg-secondary-fixed px-3 font-sans text-sm font-medium text-indigo transition-colors duration-150 ease-databuck hover:bg-indigo hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:cursor-not-allowed disabled:border-line disabled:bg-container-high disabled:text-outline disabled:hover:bg-container-high disabled:hover:text-outline'

export const aiPrimaryButton =
  'inline-flex h-10 items-center gap-2 rounded-md bg-indigo px-4 font-sans text-sm font-medium text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:bg-container-high disabled:text-outline'

export function useMockGenerate(delay = 700) {
  const [busy, setBusy] = useState(false)

  function run(action: () => void) {
    setBusy(true)
    window.setTimeout(() => {
      action()
      setBusy(false)
    }, delay)
  }

  return { busy, run }
}

export function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <span className="inline-flex items-center rounded-full bg-secondary-fixed px-2 py-0.5 font-mono text-[11px] tabular-nums text-indigo">
      {pct}% conf.
    </span>
  )
}

export function AiAction({
  children,
  onClick,
  busy = false,
  disabled = false,
  className = aiActionButton,
}: {
  children: ReactNode
  onClick: () => void
  busy?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || busy} className={`group ${className}`} aria-label={typeof children === 'string' ? (busy ? 'Generating' : children) : undefined}>
      <span className={busy ? 'animate-pulse text-indigo group-hover:text-white' : 'text-indigo group-hover:text-white'}>
        <SparkIcon size={16} />
      </span>
      {busy ? 'Generating' : children}
    </button>
  )
}

export function GenerateButton({
  children,
  onClick,
  busy = false,
  disabled = false,
  className = aiActionButton,
}: {
  children: ReactNode
  onClick: () => void
  busy?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <AiAction onClick={onClick} busy={busy} disabled={disabled} className={className}>
      {children}
    </AiAction>
  )
}

export function GeneratePulse({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-md bg-surface" />
      ))}
    </div>
  )
}

export function AiBanner({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <aside className="rounded-lg border border-info/20 bg-info-tint px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {title ? (
            <p className="flex items-center gap-1.5 font-label text-[0.6875rem] font-medium tracking-[0.08em] text-info-ink uppercase">
              <SparkIcon size={12} />
              {title}
            </p>
          ) : null}
          <div className={`text-sm leading-6 text-info-ink ${title ? 'mt-1' : ''}`}>{children}</div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </aside>
  )
}

export function InsightCard({
  title,
  children,
  confidence,
  footer,
}: {
  title: string
  children: ReactNode
  confidence?: number
  footer?: ReactNode
}) {
  return (
    <section className="rounded-lg border border-line bg-canvas p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-sans text-sm font-semibold text-ink">{title}</h3>
        {confidence != null ? <ConfidencePill value={confidence} /> : null}
      </div>
      <div className="mt-2 text-sm leading-6 text-muted">{children}</div>
      {footer ? <div className="mt-3 flex flex-wrap gap-2">{footer}</div> : null}
    </section>
  )
}

export function AiDrawer({
  title,
  eyebrow = 'Data Trust Agent',
  children,
  onClose,
  footer,
  generating = false,
}: {
  title: string
  eyebrow?: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  generating?: boolean
}) {
  const titleId = useId()

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="absolute inset-0 z-30 flex justify-end bg-[rgba(15,23,42,0.5)] backdrop-blur-[4px]" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-[28rem] flex-col border-l border-line bg-canvas shadow-overlay"
        style={{ animation: 'db-modal-in 200ms var(--db-ease)' }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-label text-[10px] tracking-[0.14em] text-indigo uppercase">
              <SparkIcon size={12} />
              {eyebrow}
            </p>
            <h2 id={titleId} className="mt-1 font-sans text-base font-semibold tracking-[-0.02em] text-ink">
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="db-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {generating ? <GeneratePulse rows={5} /> : children}
        </div>
        {footer ? <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-line px-5 py-4">{footer}</div> : null}
      </aside>
    </div>
  )
}

export function AcceptedNote({ children }: { children: ReactNode }) {
  return <p className="font-sans text-xs text-success-ink">{children}</p>
}
