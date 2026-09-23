export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

const dotTone: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-outline',
}

const textTone: Record<StatusTone, string> = {
  success: 'text-success-ink',
  warning: 'text-warning-ink',
  danger: 'text-danger',
  neutral: 'text-muted',
}

export default function StatusBadge({
  tone,
  label,
  hideLabel = false,
  className = '',
}: {
  tone: StatusTone
  label: string
  hideLabel?: boolean
  className?: string
}) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 ${className}`}>
      <span className={`size-2 shrink-0 rounded-full ${dotTone[tone]}`} aria-hidden={hideLabel ? undefined : 'true'} />
      {hideLabel ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className={`font-label text-xs font-medium tracking-[0.08em] uppercase ${textTone[tone]}`}>
          {label}
        </span>
      )}
    </span>
  )
}
