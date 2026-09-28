import { useEffect, useId, type ReactNode } from 'react'
import type { StepId } from './model.ts'

export const fieldClass =
  'h-10 w-full rounded-md border border-line bg-canvas px-3 font-sans text-sm text-ink transition-colors duration-150 ease-databuck placeholder:text-tagline hover:border-line-strong focus:outline-none focus-visible:border-indigo focus-visible:ring-2 focus-visible:ring-indigo'

export const cardClass = 'rounded-lg border border-line bg-canvas shadow-card'

export const primaryButton =
  'inline-flex h-10 items-center gap-1.5 rounded-md bg-indigo px-4 font-sans text-sm font-medium text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:bg-container-high disabled:text-outline'

export const secondaryButton =
  'inline-flex h-10 items-center gap-2 rounded-md border border-line bg-canvas px-3 font-sans text-sm font-medium text-ink shadow-card transition-colors duration-150 ease-databuck hover:border-line-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

export function Glyph({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string
  required?: boolean
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="block">
      <span className="mb-1.5 flex items-center gap-1.5 font-sans text-xs font-medium text-ink">
        {icon ? <span className="text-indigo">{icon}</span> : null}
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      {children}
    </div>
  )
}

export function ReadOnly({ value }: { value: string }) {
  return (
    <span className="flex h-10 items-center rounded-md border border-line bg-surface px-3 font-sans text-sm text-ink">{value}</span>
  )
}

export function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className={`mt-1 truncate text-sm text-ink ${mono ? 'font-mono text-xs' : 'font-sans font-medium'}`}>{value}</dd>
    </div>
  )
}

export function Segmented({ children }: { children: ReactNode }) {
  return <div className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-lg bg-container p-1">{children}</div>
}

export function Segment({
  pressed,
  onClick,
  count,
  icon,
  children,
}: {
  pressed: boolean
  onClick: () => void
  count?: number
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-md px-3 font-sans text-sm font-medium transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
        pressed ? 'bg-canvas text-ink shadow-card' : 'text-muted hover:text-ink'
      }`}
    >
      {icon ? <span className={pressed ? 'text-indigo' : 'text-tagline'}>{icon}</span> : null}
      {children}
      {count != null ? (
        <span
          className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11px] ${
            pressed ? 'bg-indigo text-white' : 'text-muted'
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}

export function SwitchControl({
  checked,
  label,
  onChange,
  disabled = false,
}: {
  checked: boolean
  label?: string
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex w-fit items-center gap-3 rounded-md text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ease-databuck ${checked ? 'bg-indigo' : 'bg-container-highest'}`}>
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-canvas shadow-card transition-transform duration-150 ease-databuck ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
      {label ? <span className="font-sans text-sm font-medium text-ink">{label}</span> : null}
    </button>
  )
}

export function TagField({
  value,
  onChange,
  onAdd,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  onAdd: () => void
  placeholder: string
}) {
  return (
    <span className="flex">
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onAdd()
          }
        }}
        className={`${fieldClass} rounded-r-none`}
      />
      <button
        type="button"
        onClick={onAdd}
        aria-label="Add tag"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-r-md border border-l-0 border-line bg-canvas text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
      >
        <PlusGlyph />
      </button>
    </span>
  )
}

export function TagList({ tags, onRemove }: { tags: string[]; onRemove: (tag: string) => void }) {
  if (tags.length === 0) return null
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onRemove(tag)}
          className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 font-sans text-xs text-ink transition-colors duration-150 ease-databuck hover:bg-container-high"
        >
          {tag}
          <span className="text-muted" aria-hidden="true">
            ×
          </span>
          <span className="sr-only">Remove {tag}</span>
        </button>
      ))}
    </span>
  )
}

export function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs font-medium ${
        active ? 'bg-success-tint text-success-ink' : 'bg-container text-muted'
      }`}
    >
      <span className={`size-1.5 rounded-full ${active ? 'bg-success' : 'bg-tagline'}`} />
      {active ? 'Connected' : 'Offline'}
    </span>
  )
}

export function LaterNote({ children }: { children: ReactNode }) {
  return (
    <section className={`flex min-h-56 flex-col items-center justify-center ${cardClass} px-6 text-center text-sm leading-6 text-muted`}>
      {children}
    </section>
  )
}

export function Modal({
  title,
  children,
  onClose,
  footer,
  size = 'md',
}: {
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  size?: 'md' | 'xl'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] p-4 backdrop-blur-[4px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className={`flex w-full max-h-[85vh] flex-col rounded-lg border border-line bg-canvas shadow-overlay ${
          size === 'xl' ? 'max-w-5xl' : 'max-w-lg'
        }`}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 bg-canvas px-5 pt-5 pb-0">
          <h2 id={titleId} className="font-sans text-lg font-semibold tracking-[-0.02em] text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
          >
            <Glyph>
              <path d="M7 7l10 10M17 7 7 17" />
            </Glyph>
          </button>
        </div>
        <div className={`db-scroll min-h-0 flex-1 overflow-y-auto px-5 pt-4 ${footer ? '' : 'pb-5'}`}>{children}</div>
        {footer ? (
          <div className="sticky bottom-0 z-10 flex shrink-0 justify-end gap-2 bg-canvas px-5 pt-5 pb-5">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

export function DatabaseGlyph({ size = 16 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <ellipse cx="12" cy="6.5" rx="7" ry="2.5" />
      <path d="M5 6.5v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5" />
      <path d="M5 11.5v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5" />
    </Glyph>
  )
}

export function TableGlyph({ size = 16 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17" />
      <path d="M3.5 14.5h17" />
      <path d="M9 9.5v10" />
    </Glyph>
  )
}

export function PlusGlyph({ size = 16 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </Glyph>
  )
}

export function DerivedGlyph() {
  return (
    <Glyph>
      <path d="M7 7h10v4" />
      <path d="m14 8 3 3-3 3" />
      <path d="M17 17H7v-4" />
      <path d="m10 16-3-3 3-3" />
    </Glyph>
  )
}

export function BookGlyph() {
  return (
    <Glyph>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5z" />
      <path d="M5 5.5V21" />
    </Glyph>
  )
}

export function SendGlyph({ size = 16 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="m4 12 16-8-6 16-2-6-8-2z" />
      <path d="M14 6 10 14" />
    </Glyph>
  )
}

export function StepGlyph({ id, size = 16 }: { id: StepId; size?: number }) {
  if (id === 'connect') return <DatabaseGlyph size={size} />
  if (id === 'table') return <TableGlyph size={size} />
  if (id === 'configure') {
    return (
      <Glyph size={size}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4" />
      </Glyph>
    )
  }
  if (id === 'catalog') {
    return (
      <Glyph size={size}>
        <path d="M12 3 19 6v6c0 4.2-2.8 7.2-7 8.5C7.8 19.2 5 16.2 5 12V6l7-3z" />
      </Glyph>
    )
  }
  if (id === 'custom') {
    return (
      <Glyph size={size}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M12 12v5" />
        <path d="M9.5 14.5h5" />
      </Glyph>
    )
  }
  if (id === 'preview') {
    return (
      <Glyph size={size}>
        <path d="M9 3h6" />
        <path d="M10 3v5.5L6 18a2 2 0 0 0 1.8 3h8.4A2 2 0 0 0 18 18l-4-9.5V3" />
      </Glyph>
    )
  }
  if (id === 'alerts') {
    return (
      <Glyph size={size}>
        <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </Glyph>
    )
  }
  return (
    <Glyph size={size}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </Glyph>
  )
}
