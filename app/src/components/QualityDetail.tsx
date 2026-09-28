import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react'
import { scoreTone, validationRuns, type ValidationRun } from '../data/validations.ts'
import EmptyState from './EmptyState.tsx'
import { BackIcon, ClockIcon, SparkIcon } from './icons.tsx'
import { qualitySummaryId } from './QualityPanel.tsx'
import RuleCatalog from './RuleCatalog.tsx'
import StatusBadge from './StatusBadge.tsx'
import ConfigureStep from './wizard/ConfigureStep.tsx'
import { defaultConfigure, inferDomain, type ConfigureState } from './wizard/model.ts'

type QualityTab = 'checks' | 'catalog' | 'custom' | 'configure'
type Tone = 'success' | 'warning' | 'danger'

type CheckMetrics = {
  passed: boolean
  score: number
  columns: number
  defects: number
  criticalFailures: number
  trend: number[]
}

type AppliedCheck = CheckMetrics & {
  id: string
  name: string
  group: 'Essential' | 'Advanced'
  summary: string
}

type CustomRule = CheckMetrics & {
  id: string
  name: string
}

const essentialCatalog = [
  { id: 'null', name: 'Null Check', summary: 'Flags columns whose null rate is above the allowed limit.' },
  { id: 'duplicate', name: 'Duplicate Check', summary: 'Finds repeated values across the selected columns.' },
  { id: 'default-value', name: 'Default Value Check', summary: 'Detects columns still holding a placeholder default.' },
  { id: 'regex', name: 'Regex Pattern Check', summary: 'Tests values against the expected pattern.' },
  { id: 'length', name: 'Length Check', summary: 'Checks that text stays inside the allowed length.' },
  { id: 'date-consistency', name: 'Date Consistency Check', summary: 'Finds dates that fall outside a valid range.' },
  { id: 'micro-null', name: 'Microsegment Null Check', summary: 'Looks for nulls inside a microsegment.' },
  { id: 'data-type', name: 'Data Type Check', summary: 'Confirms values match the declared type.' },
  { id: 'default-pattern', name: 'Default Pattern Check', summary: 'Matches values to the default format.' },
  { id: 'max-length', name: 'Max Length Check', summary: 'Flags values longer than the column limit.' },
  { id: 'micro-date', name: 'Microsegment Date Consistency Check', summary: 'Checks date ranges inside a microsegment.' },
]

const advancedCatalog = [
  { id: 'value-anomaly', name: 'Value Anomaly', summary: 'Finds values that sit far from the usual range.' },
  { id: 'micro-drift', name: 'Microsegment Based Data Drift', summary: 'Compares a microsegment with its prior profile.' },
  { id: 'distribution-metric', name: 'Data Distribution Metric Check', summary: 'Tracks whether the distribution stays stable.' },
  { id: 'data-drift', name: 'Data Drift Check', summary: 'Compares the current profile with the last run.' },
  { id: 'distribution', name: 'Distribution Check', summary: 'Checks the spread of values in a column.' },
  { id: 'apply-rules', name: 'Apply Rules', summary: 'Runs the configured rule set for this table.' },
]

const customNames = [
  'amount_positive_check',
  'product_region_valid',
  'future_sale_date',
  'duplicate_sale_id',
  'currency_amount_combo',
  'discount_auth_check',
]

const secondaryButton =
  'inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-canvas px-3 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

const primaryButton =
  'inline-flex h-10 items-center rounded-md bg-indigo px-4 font-sans text-sm font-medium text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:bg-container-high disabled:text-outline disabled:hover:bg-container-high'

const headClass =
  'sticky top-0 z-10 bg-canvas px-4 py-3 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase shadow-[inset_0_-1px_0_var(--db-border)]'

function nameCellClass(passed: boolean) {
  return `border-l-[3px] px-4 py-3 ${
    passed
      ? 'border-l-success bg-[linear-gradient(to_right,var(--color-success-tint),transparent_8rem)]'
      : 'border-l-danger bg-[linear-gradient(to_right,var(--color-danger-tint),transparent_8rem)]'
  }`
}

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

const toneFill: Record<Tone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

function hash(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0)
}

function metricTone(passed: boolean, score: number): Tone {
  if (!passed || score < 50) return 'danger'
  if (score >= 95) return 'success'
  return 'warning'
}

function trendPoints(seed: number, score: number) {
  const mode = seed % 5
  const flat = mode === 4
  const rising = mode < 2
  return Array.from({ length: 7 }, (_, index) => {
    if (index === 6 || flat) return score
    const wobble = ((seed * (index + 1) * 17) % 9) / 10 - 0.4
    const stepsFromEnd = 6 - index
    const value = rising ? score - stepsFromEnd * 0.55 + wobble : score + stepsFromEnd * 0.55 + wobble
    return Math.round(Math.max(0, Math.min(100, value)) * 10) / 10
  })
}

function resultFor(run: ValidationRun, key: string, failuresLeft: { count: number }): CheckMetrics {
  const seed = hash(`${run.id}:${key}`)
  const passed = failuresLeft.count <= 0
  if (!passed) failuresLeft.count -= 1
  const score = passed ? 96 + (seed % 4) : 20 + (seed % 60)
  const defects = passed ? 0 : 8 + (seed % 240)
  return {
    passed,
    score,
    columns: 1 + (seed % 6),
    defects,
    criticalFailures: passed ? 0 : Math.min(defects, 1 + (seed % 5)),
    trend: trendPoints(seed, score),
  }
}

function appliedChecks(run: ValidationRun, failuresLeft: { count: number }): AppliedCheck[] {
  const essential = essentialCatalog.filter((_, index) => (hash(run.id) + index) % 2 === 0).slice(0, 6)
  const advanced = advancedCatalog.filter((_, index) => (hash(`${run.id}:adv`) + index) % 2 === 0).slice(0, 3)
  return [
    ...essential.map((check) => ({ ...check, group: 'Essential' as const, ...resultFor(run, check.id, failuresLeft) })),
    ...advanced.map((check) => ({ ...check, group: 'Advanced' as const, ...resultFor(run, check.id, failuresLeft) })),
  ]
}

function customRules(run: ValidationRun, failuresLeft: { count: number }): CustomRule[] {
  return customNames.map((name) => ({
    id: name,
    name,
    ...resultFor(run, name, failuresLeft),
  }))
}

function openFromKey(event: KeyboardEvent<HTMLTableRowElement>, open: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  open()
}

export default function QualityDetail({
  validationId,
  onOpenCatalog,
  onRun,
  runBusy = false,
}: {
  validationId: string
  onOpenCatalog?: () => void
  onRun?: (validationId: string, name: string) => void
  runBusy?: boolean
}) {
  const run = validationRuns.find((item) => item.id === validationId)
  const [tab, setTab] = useState<QualityTab>('checks')
  const [openCheck, setOpenCheck] = useState<string | null>(null)
  const [configure, setConfigure] = useState<ConfigureState>(() => defaultConfigure())
  const [domain, setDomain] = useState(() => (run ? inferDomain(run.schema, run.tableName) : ''))
  const [description, setDescription] = useState(() => (run ? `Quality checks for ${run.tableName}` : ''))

  useEffect(() => {
    setTab('checks')
    setOpenCheck(null)
    const next = validationRuns.find((item) => item.id === validationId)
    setConfigure(defaultConfigure())
    if (next) {
      setDomain(inferDomain(next.schema, next.tableName))
      setDescription(`Quality checks for ${next.tableName}`)
    } else {
      setDomain('')
      setDescription('')
    }
  }, [validationId])

  if (validationId === qualitySummaryId || !run) {
    return (
      <EmptyState icon={<ClockIcon />} title="Dashboard" description="This area is not available yet." className="h-full" />
    )
  }

  if (openCheck) {
    return (
      <div className="flex h-full flex-col p-8">
        <button
          type="button"
          onClick={() => setOpenCheck(null)}
          className="inline-flex h-11 w-fit shrink-0 items-center gap-1 rounded-md px-2 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        >
          <BackIcon />
          Back
        </button>
        <EmptyState icon={<ClockIcon />} title={openCheck} description="This area is not available yet." className="flex-1" />
      </div>
    )
  }

  const failuresLeft = { count: run.failedChecks }
  const checks = appliedChecks(run, failuresLeft)
  const custom = customRules(run, failuresLeft)
  const passed = [...checks, ...custom].filter((item) => item.passed).length
  const failed = checks.length + custom.length - passed
  const records = (20000 + hash(run.id) * 17).toLocaleString('en-US')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="tablist" className="flex shrink-0 gap-6 border-b border-line px-6">
        {(
          [
            ['checks', 'Check Summary'],
            ['catalog', 'Rule Catalog'],
            ['custom', 'Custom Rules'],
            ['configure', 'Configure'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id)
              if (id === 'catalog') onOpenCatalog?.()
            }}
            className={`-mb-px cursor-pointer border-b-2 py-3 font-label text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
              tab === id ? 'border-indigo text-indigo' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'checks' ? (
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line px-6 py-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3">
            <ScoreGauge score={run.score} tone={scoreTone(run)} />
            <div className="min-w-0">
              <h2 className="truncate font-sans text-base font-semibold tracking-[-0.02em] text-ink">{run.tableName}</h2>
              <p className="mt-0.5 truncate text-sm text-muted">
                {run.sourceType}
                <span className="font-mono"> · {run.schema}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-x-5 gap-y-2 border-l border-line pl-4">
              <Fact label="Run" value={String(run.run)} mono />
              <Fact label="Ran on" value={run.ranOn} />
              <Fact label="Records" value={records} mono />
              <div className="flex items-center gap-3 pb-0.5">
                <StatusBadge tone="success" label={`${passed} passed`} />
                <StatusBadge tone="danger" label={`${failed} failed`} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={secondaryButton}>
              <SparkIcon size={16} />
              Buck's Review
            </button>
            <button type="button" className={secondaryButton}>
              <SparkIcon size={16} />
              Root Cause Analysis
            </button>
            <button
              type="button"
              className={primaryButton}
              disabled={runBusy}
              onClick={() => onRun?.(run.id, run.tableName)}
            >
              Run
            </button>
          </div>
        </header>
      ) : null}
      <div
        className={
          tab === 'catalog'
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
            : tab === 'custom'
              ? 'flex min-h-0 flex-1 flex-col'
              : 'db-scroll min-h-0 flex-1 overflow-auto'
        }
      >
        <div className={tab === 'checks' ? undefined : 'hidden'}>
          <CheckSummary checks={checks} custom={custom} onOpen={setOpenCheck} />
        </div>
        <RuleCatalog
          key={validationId}
          validationId={validationId}
          shown={tab === 'catalog'}
          onOpen={setOpenCheck}
          onRun={() => onRun?.(run.id, run.tableName)}
        />
        {tab === 'custom' ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <EmptyState
              icon={<ClockIcon />}
              title="Under Development"
              description="Custom rules are not available yet."
            />
          </div>
        ) : null}
        {tab === 'configure' ? (
          <div className="p-6">
            <ConfigureStep
              configure={configure}
              onConfigure={setConfigure}
              domain={domain}
              onDomain={setDomain}
              description={description}
              onDescription={setDescription}
            />
          </div>
        ) : null}
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
    <div className="flex w-[84px] shrink-0 flex-col items-center" role="img" aria-label={`DTS score ${score.toFixed(1)} percent`}>
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

function CheckSummary({
  checks,
  custom,
  onOpen,
}: {
  checks: AppliedCheck[]
  custom: CustomRule[]
  onOpen: (id: string) => void
}) {
  const groups = (['Essential', 'Advanced'] as const).map((group) => ({
    label: group,
    rows: checks.filter((check) => check.group === group),
  }))

  return (
    <>
    <table className="hidden w-full min-w-[920px] border-collapse text-left lg:table">
      <caption className="sr-only">Check summary</caption>
      <thead>
        <tr>
          <th scope="col" className={`${headClass} text-left`}>
            Check name
          </th>
          <th scope="col" className={`${headClass} text-right`}>
            DTS
          </th>
          <th scope="col" className={`${headClass} text-right`}>
            Trend
          </th>
          <th scope="col" className={`${headClass} text-right`}>
            Critical failures
          </th>
          <th scope="col" className={`${headClass} text-right`}>
            Columns
          </th>
          <th scope="col" className={`${headClass} text-right`}>
            Defects
          </th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) =>
          group.rows.length === 0 ? null : (
            <CheckGroup key={group.label} label={group.label}>
              {group.rows.map((check) => (
                <CheckRow key={check.id} onOpen={() => onOpen(check.name)} label={check.name}>
                  <td className={nameCellClass(check.passed)}>
                    <span className="block font-sans text-sm font-medium text-ink" title={check.summary}>
                      {check.name}
                    </span>
                  </td>
                  <ScoreCell passed={check.passed} score={check.score} />
                  <td className="px-4 py-3 text-right">
                    <TrendSpark points={check.trend} />
                  </td>
                  <CountCell value={check.criticalFailures} alert />
                  <CountCell value={check.columns} />
                  <CountCell value={check.defects} alert />
                </CheckRow>
              ))}
            </CheckGroup>
          ),
        )}
        <CustomGroup rules={custom} onOpen={() => onOpen('Custom rules')} />
      </tbody>
    </table>
    <div className="flex flex-col gap-6 p-4 lg:hidden">
      {groups.map((group) =>
        group.rows.length === 0 ? null : (
          <section key={group.label}>
            <h3 className="mb-2 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">{group.label}</h3>
            <div className="flex flex-col gap-2">
              {group.rows.map((check) => (
                <SummaryCard
                  key={check.id}
                  name={check.name}
                  summary={check.summary}
                  passed={check.passed}
                  score={check.score}
                  trend={check.trend}
                  columns={check.columns}
                  criticalFailures={check.criticalFailures}
                  defects={check.defects}
                  onOpen={() => onOpen(check.name)}
                />
              ))}
            </div>
          </section>
        ),
      )}
      <section>
        <h3 className="mb-2 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">Custom</h3>
        <SummaryCard
          name="Custom rules"
          summary={custom.map((rule) => rule.name).join(', ')}
          passed={custom.every((rule) => rule.passed)}
          score={custom.reduce((total, rule) => total + rule.score, 0) / custom.length}
          trend={Array.from({ length: 7 }, (_, index) => custom.reduce((total, rule) => total + rule.trend[index], 0) / custom.length)}
          columns={custom.reduce((total, rule) => total + rule.columns, 0)}
          criticalFailures={custom.reduce((total, rule) => total + rule.criticalFailures, 0)}
          defects={custom.reduce((total, rule) => total + rule.defects, 0)}
          onOpen={() => onOpen('Custom rules')}
        />
      </section>
    </div>
    </>
  )
}

function SummaryCard({
  name,
  summary,
  passed,
  score,
  trend,
  columns,
  criticalFailures,
  defects,
  onOpen,
}: {
  name: string
  summary: string
  passed: boolean
  score: number
  trend: number[]
  columns: number
  criticalFailures: number
  defects: number
  onOpen: () => void
}) {
  const tone = metricTone(passed, score)
  return (
    <button
      type="button"
      onClick={onOpen}
      title={summary}
      className={`w-full rounded-lg border border-line px-3 py-3 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
        passed ? 'border-l-[3px] border-l-success bg-success-tint' : 'border-l-[3px] border-l-danger bg-danger-tint'
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="font-sans text-sm font-medium text-ink">{name}</span>
        <span className={`font-mono text-sm tabular-nums ${toneText[tone]}`}>{score.toFixed(1)}%</span>
      </span>
      <span className="mt-2 block h-1.5 overflow-hidden rounded-sm bg-canvas" aria-hidden="true">
        <span className={`block h-full ${toneFill[tone]}`} style={{ width: `${Math.max(0, Math.min(score, 100))}%` }} />
      </span>
      <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <TrendSpark points={trend} />
        <span className="font-mono tabular-nums">{columns} columns</span>
        <span className={`font-mono tabular-nums ${criticalFailures > 0 ? 'text-danger' : ''}`}>
          {criticalFailures} critical
        </span>
        <span className={`font-mono tabular-nums ${defects > 0 ? 'text-danger' : ''}`}>{defects} defects</span>
      </span>
    </button>
  )
}

function CheckGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <tr>
        <th
          colSpan={6}
          scope="colgroup"
          className="bg-surface px-4 py-2 text-left font-label text-xs font-medium tracking-[0.08em] text-muted uppercase"
        >
          {label}
        </th>
      </tr>
      {children}
    </>
  )
}

function CheckRow({
  label,
  onOpen,
  children,
}: {
  label: string
  onOpen: () => void
  children: ReactNode
}) {
  return (
    <tr
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onOpen}
      onKeyDown={(event) => openFromKey(event, onOpen)}
      className="cursor-pointer border-b border-line transition-colors duration-150 ease-databuck last:border-0 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo"
    >
      {children}
    </tr>
  )
}

function ScoreCell({ passed, score }: { passed: boolean; score: number }) {
  const tone = metricTone(passed, score)
  return (
    <td className="px-4 py-3 text-right">
      <span className="inline-flex flex-col items-end gap-1">
        <span className={`font-mono text-sm tabular-nums ${toneText[tone]}`}>{score.toFixed(1)}%</span>
        <span className="h-1.5 w-16 overflow-hidden rounded-sm bg-canvas" aria-hidden="true">
          <span className={`block h-full ${toneFill[tone]}`} style={{ width: `${Math.max(0, Math.min(score, 100))}%` }} />
        </span>
      </span>
    </td>
  )
}

function CountCell({ value, alert = false }: { value: number; alert?: boolean }) {
  const emphasis = alert && value > 0
  return (
    <td className={`px-4 py-3 text-right font-mono text-sm tabular-nums ${emphasis ? 'text-danger' : 'text-muted'}`}>
      {value.toLocaleString('en-US')}
    </td>
  )
}

function TrendSpark({ points }: { points: number[] }) {
  const first = points[0] ?? 0
  const last = points[points.length - 1] ?? 0
  const delta = last - first
  const flat = Math.abs(delta) < 0.3
  const rising = !flat && delta > 0
  const width = 56
  const height = 16
  const pad = 1.5
  const path = flat
    ? `M ${pad} ${height / 2} L ${width - pad} ${height / 2}`
    : points
        .map((point, index) => {
          const min = Math.min(...points)
          const max = Math.max(...points)
          const span = max - min || 1
          const x = pad + (index / (points.length - 1)) * (width - pad * 2)
          const y = pad + (1 - (point - min) / span) * (height - pad * 2)
          return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
        })
        .join(' ')
  const stroke = flat ? 'stroke-outline' : rising ? 'stroke-success' : 'stroke-danger'
  const deltaClass = flat ? 'text-muted' : rising ? 'text-success-ink' : 'text-danger'
  const label = flat ? '0.0' : `${rising ? '+' : '−'}${Math.abs(delta).toFixed(1)}`

  return (
    <span className="inline-flex items-center justify-end gap-2">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <path d={path} fill="none" className={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`w-9 text-right font-mono text-xs tabular-nums ${deltaClass}`}>{label}</span>
    </span>
  )
}

function CustomGroup({ rules, onOpen }: { rules: CustomRule[]; onOpen: () => void }) {
  const count = rules.length
  const passed = rules.filter((rule) => rule.passed).length
  const failed = count - passed
  const score = rules.reduce((total, rule) => total + rule.score, 0) / count
  const columns = rules.reduce((total, rule) => total + rule.columns, 0)
  const defects = rules.reduce((total, rule) => total + rule.defects, 0)
  const criticalFailures = rules.reduce((total, rule) => total + rule.criticalFailures, 0)
  const trend = Array.from({ length: 7 }, (_, index) => rules.reduce((total, rule) => total + rule.trend[index], 0) / count)
  const names = rules.map((rule) => `${rule.name} (${rule.passed ? 'passed' : 'failed'})`).join(', ')

  return (
    <>
      <tr>
        <th
          colSpan={6}
          scope="colgroup"
          className="bg-surface px-4 py-2 text-left font-label text-xs font-medium tracking-[0.08em] text-muted uppercase"
        >
          Custom
        </th>
      </tr>
      <CheckRow label="Custom rules" onOpen={onOpen}>
        <td className={`max-w-0 ${nameCellClass(failed === 0)}`}>
          <span className="block font-sans text-sm font-medium text-ink" title={names}>
            Custom rules
          </span>
          <span className="mt-0.5 block text-xs leading-4 text-muted">
            {count} rules · {passed} passed · {failed} failed
          </span>
          <span className="mt-1 block truncate" title={names}>
            {rules.map((rule) => (
              <span key={rule.id} className="mr-3 inline-flex items-center gap-1 align-middle font-mono text-xs">
                <span className={`size-1.5 shrink-0 rounded-full ${rule.passed ? 'bg-success' : 'bg-danger'}`} aria-hidden="true" />
                <span className={rule.passed ? 'text-success-ink' : 'text-danger'}>{rule.name}</span>
              </span>
            ))}
          </span>
        </td>
        <ScoreCell passed={failed === 0} score={score} />
        <td className="px-4 py-3 text-right">
          <TrendSpark points={trend} />
        </td>
        <CountCell value={criticalFailures} alert />
        <CountCell value={columns} />
        <CountCell value={defects} alert />
      </CheckRow>
    </>
  )
}
