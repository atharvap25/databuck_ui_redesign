import { columnProfiles, tableForNickname } from './sources.ts'
import { matchingHistory, type MatchingJob } from './matchings.ts'

export type MatchKind = 'migration' | 'cell' | 'aggregate'

export type MatchSnapshot = {
  sourceTotal: number
  targetTotal: number
  sourceDuplicates: number
  targetDuplicates: number
  sourceNonDuplicates: number
  targetNonDuplicates: number
  onlySource: number
  onlyTarget: number
  fullMatch: number
  mismatch: number
  compared: number
  recordsUnmatched: number
  fullMatchPctOfCompared: number
  mismatchPctOfCompared: number
}

export type BreakdownTone = 'full' | 'mismatch' | 'source' | 'target' | 'source-dup' | 'target-dup'
export type BreakdownZone = 'Records Matched' | 'Only Source' | 'Only Target'

export type BreakdownRow = {
  category: string
  count: number
  percent: number
  zone: BreakdownZone
  tone: BreakdownTone
}

export type DrillKind = 'mismatch' | 'only-source' | 'only-target' | 'dup-source' | 'dup-target' | 'matched'

export type DrillRow = {
  id: string
  key: string
  sourceValue: string
  targetValue: string
  note: string
}

export type ColumnPairStat = {
  sourceColumn: string
  targetColumn: string
  mismatched: number
  fuzzy: number
}

export type AggregateMetricStatus = 'passed' | 'failed' | 'idle'

export type AggregateMetric = {
  id: string
  label: string
  records: number
  segments: number
  status: AggregateMetricStatus
  percentage: number
  threshold: number
  summary: string
}

export type RecordCountRow = {
  date: string
  run: number
  processDate: string
  sourceTotal: number
  targetTotal: number
  difference: number
  differencePct: number
  passed: boolean
  metricThreshold: number
  recordThreshold: number
}

export type SegmentRow = {
  name: string
  source: number
  target: number
  difference: number
  passed: boolean
}

function hash(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0)
}

function pct(part: number, whole: number) {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 10000) / 100
}

export function formatCount(value: number) {
  return value.toLocaleString('en-US')
}

export function formatPct(value: number) {
  return `${value.toFixed(2)}%`
}

export function matchKind(job: MatchingJob): MatchKind {
  if (job.type === 'Aggregate' || job.type === 'Aggregate (multiple segments)') return 'aggregate'
  if (job.type === 'Cell-to-cell') return 'cell'
  return 'migration'
}

export function matchSnapshot(job: MatchingJob): MatchSnapshot {
  const seed = hash(job.id)
  const sourceDuplicates = 1 + (seed % 6)
  const targetDuplicates = seed % 5 === 0 ? 0 : seed % 4
  const sourceBase = 8200 + (seed % 48) * 41
  const compared = Math.max(job.unmatched, Math.round((sourceBase * job.matchRate) / 100))
  const mismatch = Math.min(compared, job.unmatched)
  const fullMatch = Math.max(0, compared - mismatch)
  const onlySource = Math.max(0, sourceBase - compared)
  const sourceTotal = onlySource + sourceDuplicates + compared
  const onlyTarget = Math.max(0, Math.round(onlySource * (0.88 + (seed % 12) / 100)))
  const targetTotal = onlyTarget + targetDuplicates + compared
  const comparedSafe = fullMatch + mismatch

  return {
    sourceTotal,
    targetTotal,
    sourceDuplicates,
    targetDuplicates,
    sourceNonDuplicates: sourceTotal - sourceDuplicates,
    targetNonDuplicates: targetTotal - targetDuplicates,
    onlySource,
    onlyTarget,
    fullMatch,
    mismatch,
    compared: comparedSafe,
    recordsUnmatched: mismatch,
    fullMatchPctOfCompared: pct(fullMatch, comparedSafe),
    mismatchPctOfCompared: pct(mismatch, comparedSafe),
  }
}

export function recordBreakdown(snap: MatchSnapshot): BreakdownRow[] {
  return [
    {
      category: 'Full Match',
      count: snap.fullMatch,
      percent: snap.fullMatchPctOfCompared,
      zone: 'Records Matched',
      tone: 'full',
    },
    {
      category: 'Mismatch',
      count: snap.mismatch,
      percent: snap.mismatchPctOfCompared,
      zone: 'Records Matched',
      tone: 'mismatch',
    },
    {
      category: 'Only Source',
      count: snap.onlySource,
      percent: pct(snap.onlySource, snap.sourceTotal),
      zone: 'Only Source',
      tone: 'source',
    },
    {
      category: 'Only Target',
      count: snap.onlyTarget,
      percent: pct(snap.onlyTarget, snap.targetTotal),
      zone: 'Only Target',
      tone: 'target',
    },
    {
      category: 'Source Duplicates',
      count: snap.sourceDuplicates,
      percent: pct(snap.sourceDuplicates, snap.sourceTotal),
      zone: 'Only Source',
      tone: 'source-dup',
    },
    {
      category: 'Target Duplicates',
      count: snap.targetDuplicates,
      percent: pct(snap.targetDuplicates, snap.targetTotal),
      zone: 'Only Target',
      tone: 'target-dup',
    },
  ]
}

function sampleSize(total: number) {
  if (total <= 0) return 0
  return Math.min(12, Math.max(4, Math.min(total, 10)))
}

function keyPrefix(job: MatchingJob) {
  const compact = job.source.tableName.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()
  return compact || 'KEY'
}

export function drillRows(job: MatchingJob, kind: DrillKind, snap: MatchSnapshot): DrillRow[] {
  const totals: Record<DrillKind, number> = {
    mismatch: snap.mismatch,
    'only-source': snap.onlySource,
    'only-target': snap.onlyTarget,
    'dup-source': snap.sourceDuplicates,
    'dup-target': snap.targetDuplicates,
    matched: snap.fullMatch,
  }
  const count = sampleSize(totals[kind])
  const seed = hash(`${job.id}:${kind}`)
  const prefix = keyPrefix(job)
  const sourceCols = columnProfiles(tableForNickname(job.source.tableName))
  const valueCol = sourceCols[1]?.name ?? sourceCols[0]?.name ?? 'value'

  return Array.from({ length: count }, (_, index) => {
    const n = 10000 + ((seed * 17 + index * 43) % 8000)
    const key = `${prefix}-${n}`
    if (kind === 'only-source') {
      return { id: `${kind}-${index}`, key, sourceValue: `${valueCol} ${n}`, targetValue: '—', note: 'Missing on target' }
    }
    if (kind === 'only-target') {
      return { id: `${kind}-${index}`, key, sourceValue: '—', targetValue: `${valueCol} ${n}`, note: 'Missing on source' }
    }
    if (kind === 'dup-source') {
      return { id: `${kind}-${index}`, key, sourceValue: `${2 + (index % 3)} copies`, targetValue: '1 copy', note: 'Repeated source key' }
    }
    if (kind === 'dup-target') {
      return { id: `${kind}-${index}`, key, sourceValue: '1 copy', targetValue: `${2 + (index % 2)} copies`, note: 'Repeated target key' }
    }
    if (kind === 'matched') {
      return { id: `${kind}-${index}`, key, sourceValue: String(n), targetValue: String(n), note: 'Values agree' }
    }
    const drift = 1 + (index % 9)
    return {
      id: `${kind}-${index}`,
      key,
      sourceValue: String(n),
      targetValue: String(n + drift),
      note: 'Values differ',
    }
  })
}

export function columnStats(job: MatchingJob, snap: MatchSnapshot): ColumnPairStat[] {
  const sourceCols = columnProfiles(tableForNickname(job.source.tableName))
  const targetCols = columnProfiles(tableForNickname(job.target.tableName))
  const targetNames = new Set(targetCols.map((column) => column.name.toLowerCase()))

  return sourceCols.map((column, index) => {
    const mapped =
      (targetNames.has(column.name.toLowerCase()) ? column.name : targetCols[index]?.name) ?? column.name
    const seed = hash(`${job.id}:${column.name}`)
    const mismatched = snap.mismatch === 0 ? 0 : (seed % Math.max(1, Math.min(snap.mismatch, 18)))
    const fuzzy = matchKind(job) === 'cell' && snap.mismatch > 0 && seed % 4 === 0 ? 1 + (seed % 5) : 0
    return { sourceColumn: column.name, targetColumn: mapped, mismatched, fuzzy }
  })
}

export function aggregateMetrics(job: MatchingJob, snap: MatchSnapshot): AggregateMetric[] {
  const seed = hash(job.id)
  const segmented = job.type === 'Aggregate (multiple segments)'
  const segments = segmented ? 3 + (seed % 4) : 1
  const sourceGap = snap.onlySource
  const targetGap = snap.onlyTarget
  const gapFailed = job.unmatched > 0
  const mismatchedSegments = gapFailed ? Math.min(segments, 1 + (seed % Math.max(1, segments))) : 0

  return [
    {
      id: 'src',
      label: `Rows in ${job.source.tableName}`,
      records: snap.sourceTotal,
      segments,
      status: 'idle',
      percentage: 0,
      threshold: 0,
      summary: '',
    },
    {
      id: 'tgt',
      label: `Rows in ${job.target.tableName}`,
      records: snap.targetTotal,
      segments,
      status: 'idle',
      percentage: 0,
      threshold: 0,
      summary: '',
    },
    {
      id: 'src-gap',
      label: `Rows in ${job.source.tableName} missing from ${job.target.tableName}`,
      records: sourceGap,
      segments: sourceGap > 0 ? segments : 0,
      status: gapFailed && sourceGap > 0 ? 'failed' : 'passed',
      percentage: pct(sourceGap, snap.sourceTotal),
      threshold: 0,
      summary:
        sourceGap > 0
          ? `${formatCount(sourceGap)} source rows have no matching group on the target.`
          : 'Every source group has a counterpart on the target.',
    },
    {
      id: 'tgt-gap',
      label: `Rows in ${job.target.tableName} missing from ${job.source.tableName}`,
      records: targetGap,
      segments: targetGap > 0 ? Math.max(1, Math.round(segments * 0.6)) : 0,
      status: gapFailed && targetGap > 0 ? 'failed' : 'passed',
      percentage: pct(targetGap, snap.targetTotal),
      threshold: 0,
      summary:
        targetGap > 0
          ? `${formatCount(targetGap)} target rows have no matching group on the source.`
          : 'Every target group has a counterpart on the source.',
    },
    {
      id: 'seg',
      label: segmented ? 'Mismatched segments' : 'Mismatched groups',
      records: mismatchedSegments,
      segments: mismatchedSegments,
      status: mismatchedSegments > 0 ? 'failed' : 'passed',
      percentage: pct(mismatchedSegments, segments),
      threshold: 0,
      summary:
        mismatchedSegments > 0
          ? `${mismatchedSegments} of ${segments} groups differ beyond the metric threshold.`
          : 'All compared groups sit inside the metric threshold.',
    },
  ]
}

const months: Record<string, string> = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
}

function toIso(label: string) {
  const [day, month, year] = label.split(' ')
  const mm = months[month] ?? '01'
  return `${year}-${mm}-${day.padStart(2, '0')}`
}

export function recordCountRows(job: MatchingJob, snap: MatchSnapshot): RecordCountRow[] {
  const history = matchingHistory(job)
  return history.map((run, index) => {
    const steps = history.length - 1 - index
    const sourceTotal = Math.max(0, snap.sourceTotal - steps * 18)
    const targetTotal = Math.max(0, snap.targetTotal - steps * 12)
    const difference = targetTotal - sourceTotal
    const differencePct = pct(Math.abs(difference), Math.max(sourceTotal, 1))
    return {
      date: toIso(run.date),
      run: index + 1,
      processDate: toIso(run.date),
      sourceTotal,
      targetTotal,
      difference,
      differencePct,
      passed: run.unmatched === 0,
      metricThreshold: 0,
      recordThreshold: 0,
    }
  })
}

const segmentNames = ['East', 'West', 'North', 'South', 'Central', 'APAC', 'EMEA']

export function segmentRows(job: MatchingJob, snap: MatchSnapshot): SegmentRow[] {
  const seed = hash(job.id)
  const segmented = job.type === 'Aggregate (multiple segments)'
  const count = segmented ? 3 + (seed % 4) : 1
  const names = segmented ? segmentNames.slice(0, count) : ['All rows']
  const sourceShare = Math.max(1, Math.floor(snap.sourceTotal / count))
  const targetShare = Math.max(1, Math.floor(snap.targetTotal / count))

  return names.map((name, index) => {
    const drift = index === count - 1 ? snap.sourceTotal - sourceShare * (count - 1) : sourceShare
    const target = index === count - 1 ? snap.targetTotal - targetShare * (count - 1) : targetShare + ((seed + index) % 7) - 3
    const difference = target - drift
    const failed = job.unmatched > 0 && index === 0
    return {
      name,
      source: drift,
      target,
      difference,
      passed: !failed && Math.abs(difference) < Math.max(12, drift * 0.05),
    }
  })
}
