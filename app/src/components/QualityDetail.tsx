import { useEffect, useState } from 'react'
import { scoreTone, validationRuns, type ValidationRun } from '../data/validations.ts'
import EmptyState from './EmptyState.tsx'
import { BackIcon, ClockIcon, TableIcon } from './icons.tsx'
import IconBox from './IconBox.tsx'
import { qualitySummaryId } from './QualityPanel.tsx'
import StatusBadge from './StatusBadge.tsx'

type QualityTab = 'checks' | 'catalog' | 'configure'

type AppliedCheck = {
  id: string
  name: string
  group: 'Essential' | 'Advanced'
  summary: string
  passed: boolean
  score: number
  columns: number
}

type CustomRule = {
  id: string
  name: string
  passed: boolean
  score: number
  columns: number
}

const essentialCatalog = [
  { id: 'null', name: 'Null Check', summary: 'Flags columns whose null rate is above the allowed limit.' },
  { id: 'dup-identity', name: 'Duplicate rows on identity fields', summary: 'Finds repeated values across the identity columns.' },
  { id: 'default-value', name: 'Default Value Check', summary: 'Detects columns still holding a placeholder default.' },
  { id: 'regex', name: 'Regex Pattern Check', summary: 'Tests values against the expected pattern.' },
  { id: 'length', name: 'Length Check', summary: 'Checks that text stays inside the allowed length.' },
  { id: 'date-consistency', name: 'Date Consistency Check', summary: 'Finds dates that fall outside a valid range.' },
  { id: 'micro-null', name: 'Microsegment Null Check', summary: 'Looks for nulls inside a microsegment.' },
  { id: 'dup-all', name: 'Duplicate rows on all fields', summary: 'Finds rows that match on every column.' },
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
  'inline-flex h-10 items-center rounded-md border border-line-strong bg-canvas px-3 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

const primaryButton =
  'inline-flex h-10 items-center rounded-md bg-indigo px-4 font-sans text-sm font-medium text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

const toneText = {
  success: 'text-success-ink',
  warning: 'text-warning-ink',
  danger: 'text-danger',
}

function hash(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0)
}

function resultFor(run: ValidationRun, key: string, failuresLeft: { count: number }) {
  const seed = hash(`${run.id}:${key}`)
  const passed = failuresLeft.count <= 0
  if (!passed) failuresLeft.count -= 1
  return {
    passed,
    score: passed ? 96 + (seed % 4) : 20 + (seed % 60),
    columns: 1 + (seed % 6),
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

export default function QualityDetail({ validationId }: { validationId: string }) {
  const run = validationRuns.find((item) => item.id === validationId)
  const [tab, setTab] = useState<QualityTab>('checks')
  const [openCheck, setOpenCheck] = useState<string | null>(null)

  useEffect(() => {
    setTab('checks')
    setOpenCheck(null)
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
        <EmptyState
          icon={<ClockIcon />}
          title="Under Development"
          description="This area is not available yet."
          className="flex-1"
        />
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
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div className="flex min-w-0 items-start gap-4">
          <div className="shrink-0">
            <p className="font-label text-[0.6875rem] font-medium tracking-[0.16em] text-muted uppercase">Match Score</p>
            <p className={`mt-1 font-mono text-4xl font-medium tracking-[-0.04em] tabular-nums ${toneText[scoreTone(run)]}`}>
              {run.score.toFixed(1)}%
            </p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <IconBox size="md">
                <TableIcon size={16} />
              </IconBox>
              <h2 className="truncate font-sans text-lg font-semibold tracking-[-0.02em] text-ink">{run.tableName}</h2>
            </div>
            <p className="mt-1 text-sm text-muted">
              {run.sourceType}
              <span className="font-mono"> · {run.schema}</span>
            </p>
            <p className="mt-2 text-sm text-ink">
              Run {run.run} · {run.ranOn}
              <span className="text-muted"> · {records} records</span>
            </p>
            <div className="mt-2 flex gap-4">
              <StatusBadge tone="success" label={`${passed} passed`} />
              <StatusBadge tone="danger" label={`${failed} failed`} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={secondaryButton}>
            Buck's Review
          </button>
          <button type="button" className={secondaryButton}>
            Root Cause Analysis
          </button>
          <button type="button" className={primaryButton}>
            Run
          </button>
        </div>
      </header>
      <div role="tablist" className="flex shrink-0 gap-6 border-b border-line px-6">
        {(
          [
            ['checks', 'Check Summary'],
            ['catalog', 'Rule Catalog'],
            ['configure', 'Configure'],
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
      <div className="db-scroll min-h-0 flex-1 overflow-auto p-6">
        {tab === 'checks' ? (
          <CheckSummary checks={checks} custom={custom} onOpen={setOpenCheck} />
        ) : (
          <EmptyState icon={<ClockIcon />} title="Under Development" description="This area is not available yet." className="min-h-48" />
        )}
      </div>
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
  const customScore = Math.round(custom.reduce((total, rule) => total + rule.score, 0) / custom.length)
  return (
    <div className="flex flex-col gap-8">
      {(['Essential', 'Advanced'] as const).map((group) => (
        <section key={group}>
          <h3 className="mb-3 font-sans text-sm font-semibold text-ink">{group}</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {checks
              .filter((check) => check.group === group)
              .map((check) => (
                <button
                  key={check.id}
                  type="button"
                  onClick={() => onOpen(check.name)}
                  className="cursor-pointer rounded-lg border border-line bg-canvas p-4 text-left transition duration-150 ease-databuck hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface hover:shadow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-sans text-sm font-medium text-ink">{check.name}</span>
                    <StatusBadge tone={check.passed ? 'success' : 'danger'} label={check.passed ? 'Passed' : 'Failed'} />
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-muted">{check.summary}</span>
                  <span className="mt-3 flex items-center justify-between font-mono text-sm tabular-nums">
                    <span className={check.passed ? 'text-success-ink' : 'text-danger'}>{check.score.toFixed(1)}%</span>
                    <span className="text-muted">
                      {check.columns} {check.columns === 1 ? 'column' : 'columns'}
                    </span>
                  </span>
                </button>
              ))}
          </div>
        </section>
      ))}
      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="font-sans text-sm font-semibold text-ink">Custom</h3>
          <span className="font-mono text-sm text-ink tabular-nums">{customScore.toFixed(1)}%</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {custom.map((rule) => (
            <button
              key={rule.id}
              type="button"
              onClick={() => onOpen(rule.name)}
              className={`cursor-pointer rounded-md border border-line px-3 py-2 font-mono text-xs transition duration-150 ease-databuck hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                rule.passed ? 'bg-success-tint text-success-ink' : 'bg-danger-tint text-danger'
              }`}
            >
              {rule.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
