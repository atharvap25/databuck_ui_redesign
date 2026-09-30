import {
  matchingJobs,
  matchingSummaryId,
  matchingTitle,
  matchRateTone,
} from '../data/matchings.ts'
import MatchDashboard from './matching/MatchDashboard.tsx'
import EmptyState from './EmptyState.tsx'
import { ClockIcon } from './icons.tsx'
import StatusBadge from './StatusBadge.tsx'

type Tone = 'success' | 'warning' | 'danger'

const toneText: Record<Tone, string> = {
  success: 'text-success-ink',
  warning: 'text-warning-ink',
  danger: 'text-danger',
}

const toneStroke: Record<Tone, string> = {
  success: 'stroke-success',
  warning: 'stroke-warning',
  danger: 'stroke-danger',
}

const secondaryButton =
  'inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-canvas px-3 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

export default function MatchingDetail({ matchingId }: { matchingId: string }) {
  const job = matchingJobs.find((item) => item.id === matchingId) ?? null

  if (matchingId === matchingSummaryId || !job) {
    return (
      <EmptyState
        icon={<ClockIcon />}
        title="Under Development"
        description="This area is not available yet."
        className="h-full"
      />
    )
  }

  const tone = matchRateTone(job)
  const stubbed = job.type === 'Aggregate (multiple segments)'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line px-6 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3">
          <ScoreGauge score={job.matchRate} tone={tone} />
          <div className="min-w-0">
            <h2 className="truncate font-sans text-base font-semibold tracking-[-0.02em] text-ink">{matchingTitle(job)}</h2>
            <p className="mt-0.5 truncate text-sm text-muted">
              {job.source.tableName}
              <span className="text-tagline"> → </span>
              {job.target.tableName}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-x-5 gap-y-2 border-l border-line pl-4">
            <Fact label="Type" value={job.type} />
            <Fact label="Last run" value={job.lastRun} />
            <Fact label="Unmatched" value={job.unmatched.toLocaleString('en-US')} mono />
            {job.unmatched > 0 ? <StatusBadge tone="danger" label="Needs review" /> : <StatusBadge tone="success" label="Healthy" />}
          </div>
        </div>
        <button type="button" className={secondaryButton}>
          Run
        </button>
      </header>

      <div className="db-scroll min-h-0 flex-1 overflow-auto p-6">
        {stubbed ? (
          <EmptyState
            icon={<ClockIcon />}
            title="Under Development"
            description="This area is not available yet."
            className="h-full min-h-[20rem]"
          />
        ) : (
          <MatchDashboard job={job} />
        )}
      </div>
    </div>
  )
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="font-label text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">{label}</p>
      <p className={`mt-0.5 text-sm text-ink ${mono ? 'font-mono tabular-nums' : 'font-sans'}`}>{value}</p>
    </div>
  )
}

function ScoreGauge({ score, tone }: { score: number; tone: Tone }) {
  const width = 84
  const height = 44
  const cx = 42
  const cy = 40
  const radius = 32
  const length = Math.PI * radius
  const fraction = Math.max(0, Math.min(score, 100)) / 100
  const arc = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`

  return (
    <div className="flex w-[84px] shrink-0 flex-col items-center" role="img" aria-label={`Match rate ${score.toFixed(1)} percent`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="block">
        <path d={arc} fill="none" className="stroke-line" strokeWidth="4.5" strokeLinecap="round" />
        {fraction > 0 ? (
          <path
            d={arc}
            fill="none"
            className={toneStroke[tone]}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={`${length * fraction} ${length}`}
          />
        ) : null}
      </svg>
      <span className={`mt-1 font-mono text-2xl leading-none font-medium tracking-[-0.04em] tabular-nums ${toneText[tone]}`}>
        {score.toFixed(1)}%
      </span>
    </div>
  )
}
