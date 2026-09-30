import { useEffect, useState } from 'react'
import { tableForNickname } from '../data/sources.ts'
import {
  matchingHistory,
  matchingJobs,
  matchingSummaryId,
  matchingTitle,
  matchRateTone,
} from '../data/matchings.ts'
import MatchDashboard from './matching/MatchDashboard.tsx'
import EmptyState from './EmptyState.tsx'
import { ClockIcon } from './icons.tsx'
import StatusBadge from './StatusBadge.tsx'
import { defaultMatchFlags, schemaFor, seedMatchMappings } from './wizard/model.ts'

type MatchTab = 'overview' | 'mapping' | 'runs'
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

const cardClass = 'rounded-lg border border-line bg-canvas shadow-card'

const headClass =
  'sticky top-0 z-10 bg-canvas px-3 py-2 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase shadow-[inset_0_-1px_0_var(--db-border)]'

export default function MatchingDetail({ matchingId }: { matchingId: string }) {
  const [tab, setTab] = useState<MatchTab>('overview')
  const job = matchingJobs.find((item) => item.id === matchingId) ?? null

  useEffect(() => {
    setTab('overview')
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
  const sourceTable = tableForNickname(job.source.tableName)
  const targetTable = tableForNickname(job.target.tableName)
  const sourceSchema = schemaFor(sourceTable)
  const targetSchema = schemaFor(targetTable)
  const wizardType =
    job.type === 'Aggregate' || job.type === 'Aggregate (multiple segments)'
      ? 'Aggregate'
      : job.type === 'Migration'
        ? 'Migration'
        : 'Cell-to-cell'
  const mappings = seedMatchMappings(sourceSchema, targetSchema, defaultMatchFlags(), wizardType)
  const runs = matchingHistory(job)
  const stubbed = job.type === 'Aggregate (multiple segments)'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="tablist" className="flex shrink-0 gap-6 border-b border-line px-6">
        {(
          [
            ['overview', 'Overview'],
            ['mapping', 'Mapping'],
            ['runs', 'Runs'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px cursor-pointer border-b-2 py-3 font-label text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
              tab === id ? 'border-indigo text-indigo' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
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
          <>
            {tab === 'overview' ? <MatchDashboard job={job} /> : null}
            {tab === 'mapping' ? <MappingTable rows={mappings} /> : null}
            {tab === 'runs' ? <RunsTable runs={runs} /> : null}
          </>
        )}
      </div>
    </div>
  )
}

function MappingTable({
  rows,
}: {
  rows: { id: string; sourceColumn: string; sourceType: string; pk: boolean; matchField: boolean; targetColumn: string }[]
}) {
  return (
    <div className={`${cardClass} overflow-hidden`}>
      <div className="db-scroll overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <thead>
            <tr>
              {['Source column', 'PK', 'Match field', 'Target column', 'Status'].map((label) => (
                <th key={label} className={headClass}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const mapped = Boolean(row.targetColumn)
              return (
                <tr key={row.id} className={`border-b border-line ${index % 2 === 1 ? 'bg-surface' : 'bg-canvas'}`}>
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs text-ink">{row.sourceColumn}</span>
                    <span className="ml-2 font-label text-[10px] tracking-[0.08em] text-muted uppercase">{row.sourceType}</span>
                  </td>
                  <td className="px-3 py-2 font-sans text-xs text-ink">{row.pk ? 'Yes' : '—'}</td>
                  <td className="px-3 py-2 font-sans text-xs text-ink">{row.matchField ? 'Yes' : '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs text-ink">{row.targetColumn || '—'}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-sans text-[11px] font-medium ${
                        mapped ? 'bg-success-tint text-success-ink' : 'bg-container-high text-muted'
                      }`}
                    >
                      {mapped ? 'Mapped' : 'Unmapped'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RunsTable({ runs }: { runs: { date: string; rate: number; unmatched: number }[] }) {
  return (
    <div className={`${cardClass} overflow-hidden`}>
      <table className="w-full text-left">
        <thead>
          <tr>
            {['Ran on', 'Match rate', 'Unmatched'].map((label) => (
              <th key={label} className={headClass}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {runs.map((run, index) => {
            const tone = matchRateTone({ matchRate: run.rate, unmatched: run.unmatched })
            return (
              <tr key={run.date} className={`border-b border-line last:border-b-0 ${index % 2 === 1 ? 'bg-surface' : 'bg-canvas'}`}>
                <td className="px-3 py-2.5 font-sans text-sm text-ink">{run.date}</td>
                <td className={`px-3 py-2.5 font-mono text-sm tabular-nums ${toneText[tone]}`}>{run.rate.toFixed(1)}%</td>
                <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{run.unmatched.toLocaleString('en-US')}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
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
