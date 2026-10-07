import { matchingJobs } from './matchings.ts'
import { jobRuns } from './jobs.ts'
import { scoreTone, validationRuns, type ValidationRun } from './validations.ts'

export const AS_OF = '7 Oct 2026'
export const DEFAULT_LABOR_RATE = 75

export type TrustBand = 'high' | 'watch' | 'failed'

export type SeriesPoint = {
  label: string
  value: number
}

export type NamedSeries = {
  key: string
  label: string
  tone: 'indigo' | 'danger' | 'warning' | 'muted' | 'success'
  points: SeriesPoint[]
}

export type ExecutiveKpi = {
  label: string
  value: string
  hint: string
  delta: string
  deltaTone: 'success' | 'danger' | 'muted'
}

export type TrustTable = {
  id: string
  name: string
  band: TrustBand
  score: number
  failedChecks: number
}

export type MatchingWatch = {
  id: string
  name: string
  unmatched: number
  rate: number
}

export type ExecutiveReview = {
  confidence: number
  headline: string
  dtsBody: string
  drivers: { title: string; body: string }[]
  trustBody: string
  issuesBody: string
  matchingBody: string
  savingsBody: string
  actions: string[]
  citations: { label: string }[]
}

export type ExecutiveSnapshot = {
  asOf: string
  dts: number
  dtsDelta30: number
  kpis: ExecutiveKpi[]
  dtsSeries: SeriesPoint[]
  issueSeries: SeriesPoint[]
  hoursSaved: number
  recordsWeekly: SeriesPoint[]
  trustCounts: { high: number; watch: number; failed: number; total: number }
  trustTables: TrustTable[]
  issuesByType: NamedSeries[]
  highTrustTrend: SeriesPoint[]
  mix: { scored: number; stale: number; high: number; low: number }
  drivers: TrustTable[]
  matchingWatch: MatchingWatch[]
  failedJobs: { name: string; when: string }[]
  healthyCount: number
}

function hash(value: string) {
  let total = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    total ^= value.charCodeAt(index)
    total = Math.imul(total, 16777619)
  }
  return total >>> 0
}

function recordsFor(run: ValidationRun) {
  const seed = hash(run.id)
  const name = run.tableName.toLowerCase()
  if (name.includes('invoice')) return 7_120_000 + (seed % 280_000)
  if (name.includes('customer')) return 1_240_000 + (seed % 90_000)
  if (name.includes('ledger') || name.includes('journal')) return 4_860_000 + (seed % 220_000)
  if (name.includes('order')) return 2_410_000 + (seed % 160_000)
  if (name.includes('campaign')) return 186_000 + (seed % 42_000)
  if (name.includes('payment')) return 3_180_000 + (seed % 140_000)
  return 92_000 + (seed % 1_800_000)
}

function failedRecordsFor(run: ValidationRun) {
  if (run.failedChecks === 0) return Math.round(recordsFor(run) * 0.0002)
  return Math.round(recordsFor(run) * (0.004 + (hash(run.id) % 18) / 1000) * run.failedChecks)
}

export function bandFor(run: ValidationRun): TrustBand {
  const tone = scoreTone(run)
  if (tone === 'success') return 'high'
  if (tone === 'danger') return 'failed'
  return 'watch'
}

function parseDay(label: string) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [dayText, monthText, yearText] = label.split(' ')
  return new Date(Number(yearText) || 2026, Math.max(0, months.indexOf(monthText)), Number(dayText) || 1)
}

const asOfDate = new Date(2026, 9, 7)

function formatShort(date: Date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${date.getDate()} ${months[date.getMonth()]}`
}

function walk(count: number, stepDays: number, build: (date: Date, index: number) => SeriesPoint) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(asOfDate)
    date.setDate(date.getDate() - (count - 1 - index) * stepDays)
    return build(date, index)
  })
}

function fmt(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString('en-US')
}

export function formatMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1000)}K`
  return `$${Math.round(value).toLocaleString('en-US')}`
}

export function savingsCost(hours: number, rate: number) {
  return hours * rate
}

function dtsAt(index: number, count: number, current: number) {
  const t = index / Math.max(count - 1, 1)
  const early = 88.4 + Math.sin(index / 3.2) * 1.1
  const mid = 92.6 + Math.sin(index / 2.4) * 0.7
  const late = current - (1 - t) * 1.6 + Math.sin(index / 1.8) * 0.4
  if (t < 0.45) return Math.round((early * (1 - t / 0.45) + mid * (t / 0.45)) * 10) / 10
  if (t < 0.78) return Math.round((mid * 0.6 + late * 0.4) * 10) / 10
  return Math.round(Math.max(76, late) * 10) / 10
}

let cached: ExecutiveSnapshot | null = null

export function executiveSnapshot(): ExecutiveSnapshot {
  if (cached) return cached

  const tables = validationRuns.map((run) => ({
    id: run.id,
    name: run.tableName,
    band: bandFor(run),
    score: run.score,
    failedChecks: run.failedChecks,
  }))
  const high = tables.filter((item) => item.band === 'high')
  const watch = tables.filter((item) => item.band === 'watch')
  const failed = tables.filter((item) => item.band === 'failed')
  const dts = Math.round((validationRuns.reduce((sum, run) => sum + run.score, 0) / validationRuns.length) * 10) / 10
  const dtsDelta30 = -1.4
  const failedChecks = validationRuns.reduce((sum, run) => sum + run.failedChecks, 0)
  const failedRecords = validationRuns.reduce((sum, run) => sum + failedRecordsFor(run), 0)
  const records = validationRuns.reduce((sum, run) => sum + recordsFor(run), 0)
  const stale = validationRuns.filter((run) => parseDay(run.ranOn) < new Date(2026, 8, 17)).length
  const scored = validationRuns.length - stale
  const hoursSaved = high.length * 28 + watch.length * 11 + 18
  const matchingWatch = matchingJobs
    .filter((job) => job.unmatched > 0)
    .sort((a, b) => b.unmatched - a.unmatched)
    .map((job) => ({ id: job.id, name: job.name, unmatched: job.unmatched, rate: job.matchRate }))
  const drivers = [...failed].sort((a, b) => a.score - b.score).slice(0, 4)
  const failedJobs = jobRuns
    .filter((job) => job.result === 'failed')
    .map((job) => ({ name: job.name, when: job.startedAt }))

  const dtsSeries = walk(18, 5, (date, index) => ({
    label: formatShort(date),
    value: dtsAt(index, 18, dts),
  }))
  dtsSeries[dtsSeries.length - 1] = { label: formatShort(asOfDate), value: dts }

  const issueSeries = walk(32, 1, (date, index) => {
    const weekend = date.getDay() === 0 || date.getDay() === 6
    const base = 18 + (index % 7) * 3
    const spike = index > 24 ? 40 + (index - 24) * 18 : 0
    const campaigns = index === 26 || index === 30 ? 90 : 0
    return {
      label: formatShort(date),
      value: weekend ? Math.round(base * 0.4) : base + spike + campaigns,
    }
  })

  const recordsWeekly = walk(8, 7, (date, index) => ({
    label: formatShort(date),
    value: Math.round(records * (0.82 + index * 0.025) / 8),
  }))

  const highTrustTrend = walk(10, 3, (date, index) => ({
    label: formatShort(date),
    value: Math.min(high.length + 1, 4 + Math.round(index * 0.4) + (index > 7 ? 0 : 0)),
  }))
  highTrustTrend[highTrustTrend.length - 1] = { label: formatShort(asOfDate), value: high.length }

  const typeSeed = [
    { key: 'null', label: 'Null', tone: 'danger' as const, amp: 1 },
    { key: 'duplicate', label: 'Duplicate', tone: 'warning' as const, amp: 0.45 },
    { key: 'drift', label: 'Drift', tone: 'indigo' as const, amp: 0.7 },
    { key: 'anomaly', label: 'Anomaly', tone: 'muted' as const, amp: 0.35 },
    { key: 'matching', label: 'Matching', tone: 'success' as const, amp: 0.55 },
  ]
  const issuesByType: NamedSeries[] = typeSeed.map((type, typeIndex) => ({
    key: type.key,
    label: type.label,
    tone: type.tone,
    points: walk(12, 3, (date, index) => ({
      label: formatShort(date),
      value: Math.round((8 + index * 2 + typeIndex * 3) * type.amp + (index > 8 && type.key === 'null' ? 28 : 0)),
    })),
  }))

  cached = {
    asOf: AS_OF,
    dts,
    dtsDelta30,
    kpis: [
      {
        label: 'Tables monitored',
        value: String(validationRuns.length),
        hint: `${high.length} at or above 95% DTS`,
        delta: '+0 vs 30d',
        deltaTone: 'muted',
      },
      {
        label: 'High-trust tables',
        value: String(high.length),
        hint: 'DTS ≥ 95 · no failed checks',
        delta: '−1 vs 30d',
        deltaTone: 'danger',
      },
      {
        label: 'Records monitored',
        value: fmt(records),
        hint: 'Latest run across the estate',
        delta: '+4.2% vs 30d',
        deltaTone: 'success',
      },
      {
        label: 'Issues detected',
        value: failedChecks.toLocaleString('en-US'),
        hint: `${fmt(failedRecords)} failed records · ${matchingWatch.reduce((sum, job) => sum + job.unmatched, 0).toLocaleString('en-US')} unmatched keys`,
        delta: '+6 vs 30d',
        deltaTone: 'danger',
      },
    ],
    dtsSeries,
    issueSeries,
    hoursSaved,
    recordsWeekly,
    trustCounts: { high: high.length, watch: watch.length, failed: failed.length, total: tables.length },
    trustTables: tables,
    issuesByType,
    highTrustTrend,
    mix: { scored, stale, high: high.length, low: watch.length + failed.length },
    drivers,
    matchingWatch,
    failedJobs,
    healthyCount: high.length,
  }
  return cached
}

export function executiveReviewFor(pairLabel: string, rate: number): ExecutiveReview {
  const snap = executiveSnapshot()
  const cost = savingsCost(snap.hoursSaved, rate)
  const driverList = snap.drivers.map((item) => `${item.name} (${item.score.toFixed(1)}%)`).join(', ')
  const matchList = snap.matchingWatch.map((item) => `${item.name} · ${item.unmatched} unmatched`).join('; ')
  const { high, watch, failed, total } = snap.trustCounts

  return {
    confidence: 0.86,
    headline: `${pairLabel} is at ${snap.dts.toFixed(1)}% enterprise DTS (${snap.dtsDelta30 > 0 ? '+' : ''}${snap.dtsDelta30.toFixed(1)} vs 30 days). ${snap.healthyCount} of ${total} tables are high-trust. Campaigns and General Ledger still set the floor.`,
    dtsBody: `Portfolio DTS sits at ${snap.dts.toFixed(1)}% as of ${snap.asOf}. The 90-day line held in the low-90s until the last two weeks, when Campaigns (62.4%) and a truncated General Ledger extract (0%) pulled the estate down ${Math.abs(snap.dtsDelta30).toFixed(1)} points versus the prior month.`,
    drivers: snap.drivers.map((item) => ({
      title: `${item.name} · ${item.score.toFixed(1)}%`,
      body:
        item.id === 'ledger'
          ? 'Teradata extract looks truncated. Six checks failed. Hold publish until the reload lands.'
          : item.id === 'campaigns'
            ? 'Late event load. Five checks failed. Open Buck’s Review before the 09:00 matching pack.'
            : `${item.failedChecks} failed ${item.failedChecks === 1 ? 'check' : 'checks'}. Treat as a watch-to-fail promotion until the next clean run.`,
    })),
    trustBody: `Trust mix on ${total} monitored tables: ${high} high-trust (${((high / total) * 100).toFixed(1)}%), ${watch} watch-band, ${failed} failed. ${snap.mix.stale} tables have not scored since mid-September and read as stale rather than unvalidated.`,
    issuesBody: `Failed checks total ${snap.kpis[3].value} on this run, concentrated on nulls, then drift and matching unmatched. ${driverList} account for the DTS loss. Duplicate and anomaly volume stayed inside noise.`,
    matchingBody: matchList
      ? `Matching watch: ${matchList}. Padding and case on join keys remain the usual cause, not missing entities.`
      : 'No matching jobs are on watch.',
    savingsBody: `Stewards avoided an estimated ${snap.hoursSaved} hours of firefighting in the last 30 days. At $${rate}/hr that is ${formatMoney(cost)} of recovered time — driven by the ${high} high-trust tables staying on autopilot.`,
    actions: [
      'Hold General Ledger publish until the Teradata extract is complete; then rerun and open RCA.',
      'Open Buck’s Review on Campaigns before the weekday matching pack ships.',
      'Confirm the campaign_code / AR invoice join-key cleanup, then accept the suggested mapping.',
    ],
    citations: [
      { label: 'Enterprise DTS' },
      { label: 'Check summary · Campaigns' },
      { label: 'Check summary · General Ledger' },
      { label: 'Matching · Campaigns by Channel' },
    ],
  }
}

export function dailyBriefingPrompt(pairLabel: string) {
  return `Get the daily data-trust briefing for ${pairLabel}`
}
