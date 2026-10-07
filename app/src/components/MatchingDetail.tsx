import {
  matchingJobs,
  matchingSummaryId,
  matchingTitle,
  matchRateTone,
} from '../data/matchings.ts'
import type { JobKind } from '../data/jobs.ts'
import { matchBriefingFor } from '../data/aiMocks.ts'
import MatchDashboard, { viewsForJob, type ViewId } from './matching/MatchDashboard.tsx'
import EmptyState from './EmptyState.tsx'
import { ClockIcon } from './icons.tsx'
import StatusBadge from './StatusBadge.tsx'
import { AiAction, AiDrawer, ConfidencePill, GeneratePulse, aiSecondaryButton } from './ai/AiKit.tsx'
import { useWorkspaceAi } from '../ai/WorkspaceAiContext.tsx'
import { useEffect, useState } from 'react'

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

const primaryButton =
  'inline-flex h-10 items-center rounded-md bg-indigo px-4 font-sans text-sm font-medium text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:bg-container-high disabled:text-outline disabled:hover:bg-container-high'

export default function MatchingDetail({
  matchingId,
  onRun,
  runBusy = false,
}: {
  matchingId: string
  onRun?: (matchingId: string, name: string, kind: JobKind) => void
  runBusy?: boolean
}) {
  const job = matchingJobs.find((item) => item.id === matchingId) ?? null
  const { enabled, openAgent } = useWorkspaceAi()
  const [briefOpen, setBriefOpen] = useState(false)
  const [briefReady, setBriefReady] = useState(false)
  const [view, setView] = useState<ViewId>('dashboard')
  const views = job ? viewsForJob(job) : []

  useEffect(() => {
    setView('dashboard')
    setBriefOpen(false)
    setBriefReady(false)
  }, [matchingId])

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
    <div className="relative flex h-full min-h-0 flex-col">
      <div role="tablist" aria-label="Match result views" className="flex shrink-0 gap-6 overflow-x-auto border-b border-line px-6">
        {views.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            onClick={() => setView(item.id)}
            className={`-mb-px shrink-0 cursor-pointer border-b-2 py-3 font-label text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
              view === item.id ? 'border-indigo text-indigo' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
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
        <div className="flex flex-wrap gap-2">
          {enabled ? (
            <AiAction
              onClick={() => {
                setBriefOpen(true)
                setBriefReady(false)
                window.setTimeout(() => setBriefReady(true), 600)
              }}
            >
              Match briefing
            </AiAction>
          ) : null}
        <button
          type="button"
          className={primaryButton}
          disabled={runBusy}
          onClick={() => onRun?.(job.id, matchingTitle(job), 'matching')}
        >
          Run
        </button>
        </div>
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
          <MatchDashboard job={job} view={view} />
        )}
      </div>
      {briefOpen && job ? (
        <AiDrawer
          title={`Match briefing · ${matchingTitle(job)}`}
          generating={!briefReady}
          onClose={() => setBriefOpen(false)}
          footer={
            <button type="button" className={aiSecondaryButton} onClick={openAgent}>
              Ask agent
            </button>
          }
        >
          {briefReady ? <MatchBriefBody matchingId={job.id} /> : <GeneratePulse />}
        </AiDrawer>
      ) : null}
    </div>
  )
}

function MatchBriefBody({ matchingId }: { matchingId: string }) {
  const brief = matchBriefingFor(matchingId)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-sm font-medium leading-6 text-ink">{brief.headline}</p>
        <ConfidencePill value={brief.confidence} />
      </div>
      <p className="text-sm leading-6 text-muted">{brief.summary}</p>
      <ul className="flex flex-col gap-2">
        {brief.drivers.map((item) => (
          <li key={item} className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink">
            {item}
          </li>
        ))}
      </ul>
      <p className="text-sm leading-6 text-ink">{brief.keyHint}</p>
      <p className="text-sm leading-6 text-muted">{brief.impact}</p>
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
