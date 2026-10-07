import { catalogChecks, columnsFor, type CatalogColumn } from './ruleCatalog.ts'
import type { ValidationRun } from './validations.ts'

export type ChartKind = 'rate' | 'failed' | 'band' | 'drift' | 'distribution'

export type SeriesKey = {
  key: string
  label: string
  dashed?: boolean
  tone: 'indigo' | 'danger' | 'muted' | 'success'
}

export type SeriesPoint = {
  label: string
  run: number
  values: Record<string, number>
}

export type CheckKpi = {
  label: string
  value: string
  hint?: string
  tone?: 'success' | 'danger' | 'muted'
}

export type CellValue = {
  key: string
  label: string
  value: string
  align?: 'left' | 'right'
  mono?: boolean
  danger?: boolean
}

export type HistoryRow = {
  id: string
  date: string
  hour: string
  run: number
  cells: CellValue[]
  passed: boolean
}

export type CheckColumnRow = {
  id: string
  name: string
  passed: boolean
  threshold?: number
  thresholdUnit?: string
  cells: CellValue[]
  history: HistoryRow[]
}

export type ColumnHeader = {
  key: string
  label: string
  align?: 'left' | 'right'
}

export type CheckResultsModel = {
  checkName: string
  catalogId: string | null
  passed: boolean
  kind: ChartKind
  series: SeriesPoint[]
  seriesKeys: SeriesKey[]
  kpis: CheckKpi[]
  columnHeaders: ColumnHeader[]
  historyHeaders: ColumnHeader[]
  rows: CheckColumnRow[]
  distributionModes?: ('mean' | 'sd' | 'sum')[]
  custom?: boolean
}

const customRuleNames = [
  'amount_positive_check',
  'product_region_valid',
  'future_sale_date',
  'duplicate_sale_id',
  'currency_amount_combo',
  'discount_auth_check',
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const hours = ['08:12', '09:04', '10:31', '11:18', '13:02', '14:47', '16:05', '17:22', '18:40', '21:15']

export function catalogIdForCheck(name: string): string | null {
  const found = catalogChecks.find((check) => check.name === name)
  if (found) return found.id
  if (name === 'Record Count Anomaly') return 'value-anomaly'
  return null
}

function hash(value: string) {
  let total = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    total ^= value.charCodeAt(index)
    total = Math.imul(total, 16777619)
  }
  return total >>> 0
}

function rng(seed: number) {
  let state = seed || 1
  return () => {
    state = Math.imul(state ^ (state >>> 13), 1597334677) >>> 0
    return state / 4294967296
  }
}

function fmt(value: number) {
  return Math.round(value).toLocaleString('en-US')
}

function pct(value: number, digits = 2) {
  return `${value.toFixed(digits)}%`
}

function kindFor(name: string): ChartKind {
  const text = name.toLowerCase()
  if (text.includes('record count') || text.includes('value anomaly')) return 'band'
  if (text.includes('drift')) return 'drift'
  if (text.includes('distribution')) return 'distribution'
  if (text.includes('date consistency')) return 'failed'
  return 'rate'
}

function volumeFor(run: ValidationRun) {
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

function parseRanOn(ranOn: string) {
  const [dayText, monthText, yearText] = ranOn.split(' ')
  return {
    day: Number(dayText) || 1,
    month: Math.max(0, months.indexOf(monthText)),
    year: Number(yearText) || 2026,
  }
}

function historyStamps(run: ValidationRun, count: number) {
  const { day, month, year } = parseRanOn(run.ranOn)
  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index
    const date = new Date(year, month, day)
    date.setDate(date.getDate() - Math.floor(offset / 2))
    const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return {
      date: stamp,
      hour: hours[index % hours.length],
      run: Math.max(1, run.run - offset),
    }
  })
}

function pickColumns(run: ValidationRun, count: number) {
  const columns = columnsFor(run.id)
  const start = hash(run.id) % Math.max(1, columns.length)
  return Array.from({ length: Math.min(count, columns.length) }, (_, index) => columns[(start + index) % columns.length])
}

function extraFor(checkName: string, column: CatalogColumn, seed: number) {
  const text = checkName.toLowerCase()
  if (text.includes('regex') || text.includes('default pattern')) {
    if (column.name.includes('email')) return { key: 'pattern', label: 'Good Pattern', value: '^[A-Z0-9._%+-]+@' }
    if (column.name.includes('phone')) return { key: 'pattern', label: 'Good Pattern', value: '^\\+?[0-9]{10,15}$' }
    if (column.format === 'Date') return { key: 'pattern', label: 'Good Pattern', value: 'YYYY-MM-DD' }
    return { key: 'pattern', label: 'Good Pattern', value: seed % 2 === 0 ? '^[A-Z0-9_-]+$' : '^[A-Za-z ]+$' }
  }
  if (text.includes('length')) {
    const min = 1 + (seed % 3)
    const max = column.format === 'String' ? 40 + (seed % 80) : 12 + (seed % 8)
    return { key: 'length', label: 'Length', value: `${min} – ${max}` }
  }
  if (text.includes('date')) {
    return { key: 'dateField', label: 'Date Field', value: column.format === 'Date' ? column.name : `${column.name}_date` }
  }
  if (text.includes('microsegment')) {
    return { key: 'microsegment', label: 'Microsegment', value: seed % 2 === 0 ? 'region' : 'status' }
  }
  return null
}

function failedSet(run: ValidationRun, checkName: string, columns: CatalogColumn[], seed: number) {
  const failed = new Set<string>()
  const budget = run.failedChecks > 0 ? 1 + (seed % Math.min(3, columns.length)) : seed % 5 === 0 ? 1 : 0
  for (let index = 0; index < columns.length && failed.size < budget; index += 1) {
    if ((seed + index) % 3 !== 0) failed.add(columns[index].id)
  }
  if (budget > 0 && failed.size === 0 && columns[0]) failed.add(columns[0].id)
  if (checkName === 'Record Count Anomaly' && columns[0] && run.failedChecks > 0) failed.add(columns[0].id)
  return failed
}

function seriesFor(
  kind: ChartKind,
  stamps: { date: string; run: number }[],
  seed: number,
  passed: boolean,
  threshold: number,
) {
  const next = rng(seed)
  if (kind === 'band') {
    const mean = 1_800_000 + (seed % 400_000)
    const keys: SeriesKey[] = [
      { key: 'count', label: 'Count', tone: 'indigo' },
      { key: 'mean', label: 'Mean', dashed: true, tone: 'muted' },
      { key: 'upper', label: 'Upper', dashed: true, tone: 'danger' },
      { key: 'lower', label: 'Lower', dashed: true, tone: 'success' },
    ]
    const series = stamps.map((stamp, index) => {
      const drift = (index - stamps.length + 1) * (passed ? 4000 : 28000)
      const noise = (next() - 0.5) * (passed ? 18000 : 90000)
      const count = Math.max(1000, mean + drift + noise + (index === stamps.length - 1 && !passed ? 160000 : 0))
      return {
        label: stamp.date,
        run: stamp.run,
        values: { count, mean, upper: mean * 1.12, lower: mean * 0.88 },
      }
    })
    return { keys, series }
  }
  if (kind === 'drift') {
    const keys: SeriesKey[] = [
      { key: 'unique', label: 'Unique values', tone: 'indigo' },
      { key: 'missing', label: 'Missing values', tone: 'danger' },
      { key: 'added', label: 'New values', tone: 'success' },
    ]
    const series = stamps.map((stamp, index) => {
      const unique = 40 + Math.round(next() * 18) + index
      const missing = passed ? Math.round(next() * 2) : 2 + Math.round(next() * 6) + (index === stamps.length - 1 ? 4 : 0)
      const added = Math.round(next() * 5)
      return { label: stamp.date, run: stamp.run, values: { unique, missing, added } }
    })
    return { keys, series }
  }
  if (kind === 'distribution') {
    const keys: SeriesKey[] = [
      { key: 'mean', label: 'Mean', tone: 'indigo' },
      { key: 'meanUpper', label: 'Mean upper', dashed: true, tone: 'muted' },
      { key: 'meanLower', label: 'Mean lower', dashed: true, tone: 'muted' },
      { key: 'sd', label: 'SD', tone: 'indigo' },
      { key: 'sdUpper', label: 'SD upper', dashed: true, tone: 'muted' },
      { key: 'sdLower', label: 'SD lower', dashed: true, tone: 'muted' },
      { key: 'sum', label: 'Sum', tone: 'indigo' },
      { key: 'sumUpper', label: 'Sum upper', dashed: true, tone: 'muted' },
      { key: 'sumLower', label: 'Sum lower', dashed: true, tone: 'muted' },
    ]
    const series = stamps.map((stamp, index) => {
      const mean = 128 + (next() - 0.5) * (passed ? 4 : 18) + (index === stamps.length - 1 && !passed ? 22 : 0)
      const sd = 14 + (next() - 0.5) * (passed ? 1.2 : 6)
      const sum = 2_400_000 + (next() - 0.5) * 80_000
      return {
        label: stamp.date,
        run: stamp.run,
        values: {
          mean,
          meanUpper: 136,
          meanLower: 120,
          sd,
          sdUpper: 18,
          sdLower: 10,
          sum,
          sumUpper: 2_560_000,
          sumLower: 2_240_000,
        },
      }
    })
    return { keys, series }
  }
  if (kind === 'failed') {
    const keys: SeriesKey[] = [
      { key: 'failed', label: 'Failed records', tone: 'danger' },
      { key: 'threshold', label: 'Threshold', dashed: true, tone: 'muted' },
    ]
    const series = stamps.map((stamp, index) => {
      const failed = passed
        ? Math.round(next() * 12)
        : 40 + Math.round(next() * 180) + (index === stamps.length - 1 ? 90 : 0)
      return { label: stamp.date, run: stamp.run, values: { failed, threshold } }
    })
    return { keys, series }
  }
  const keys: SeriesKey[] = [
    { key: 'rate', label: 'Fail rate', tone: 'indigo' },
    { key: 'threshold', label: 'Threshold', dashed: true, tone: 'muted' },
  ]
  const series = stamps.map((stamp, index) => {
    const rate = passed
      ? next() * Math.max(0.4, threshold * 0.6)
      : threshold + next() * 4 + (index === stamps.length - 1 ? 1.8 : 0)
    return { label: stamp.date, run: stamp.run, values: { rate, threshold } }
  })
  return { keys, series }
}

function historyRow(
  stamp: { date: string; hour: string; run: number },
  cells: CellValue[],
  passed: boolean,
): HistoryRow {
  return {
    id: `${stamp.run}-${stamp.date}-${stamp.hour}`,
    date: stamp.date,
    hour: stamp.hour,
    run: stamp.run,
    cells,
    passed,
  }
}

function customResults(run: ValidationRun): CheckResultsModel {
  const seed = hash(`${run.id}:custom`)
  const stamps = historyStamps(run, 8)
  const rows: CheckColumnRow[] = customRuleNames.map((name, index) => {
    const passed = run.failedChecks === 0 ? index !== seed % customRuleNames.length || seed % 4 !== 0 : index !== 0
    const history = stamps.map((stamp, stampIndex) =>
      historyRow(
        stamp,
        [{ key: 'result', label: 'Result', value: stampIndex === stamps.length - 1 ? (passed ? 'PASSED' : 'FAILED') : stampIndex % 5 === 0 && !passed ? 'FAILED' : 'PASSED', mono: true }],
        stampIndex === stamps.length - 1 ? passed : stampIndex % 5 !== 0 || passed,
      ),
    )
    return {
      id: name,
      name,
      passed,
      cells: [{ key: 'result', label: 'Result', value: passed ? 'PASSED' : 'FAILED', mono: true, danger: !passed }],
      history,
    }
  })
  const failed = rows.filter((row) => !row.passed).length
  const chart = seriesFor('rate', stamps, seed, failed === 0, 0)
  return {
    checkName: 'Custom rules',
    catalogId: null,
    passed: failed === 0,
    kind: 'rate',
    series: chart.series,
    seriesKeys: chart.keys,
    kpis: [
      { label: 'Failed rules', value: String(failed), tone: failed ? 'danger' : 'success' },
      { label: 'Rules run', value: String(rows.length), tone: 'muted' },
      { label: 'Status', value: failed ? 'FAILED' : 'PASSED', tone: failed ? 'danger' : 'success' },
    ],
    columnHeaders: [{ key: 'result', label: 'Result', align: 'left' }],
    historyHeaders: [{ key: 'result', label: 'Result', align: 'left' }],
    rows,
    custom: true,
  }
}

export function resultsFor(run: ValidationRun, checkName: string): CheckResultsModel {
  if (checkName === 'Custom rules') return customResults(run)

  const kind = kindFor(checkName)
  const catalogId = catalogIdForCheck(checkName)
  const seed = hash(`${run.id}:${checkName}`)
  const next = rng(seed)
  const total = volumeFor(run)
  const columns = pickColumns(run, 5 + (seed % 4))
  const failedIds = failedSet(run, checkName, columns, seed)
  const passed = failedIds.size === 0
  const threshold =
    kind === 'failed' ? 25 + (seed % 40) : kind === 'band' ? 0 : Number((0.5 + (seed % 20) / 10).toFixed(2))
  const stamps = historyStamps(run, 10)
  const extra = (column: CatalogColumn) => extraFor(checkName, column, hash(`${column.id}:${checkName}`))
  const chart = seriesFor(kind, stamps, seed, passed, threshold)

  const rows: CheckColumnRow[] = columns.map((column) => {
    const columnFailed = failedIds.has(column.id)
    const localTotal = Math.round(total * (0.12 + (hash(column.id) % 40) / 100))
    const failedRecords = columnFailed ? Math.round(localTotal * (0.004 + next() * 0.03)) : Math.round(next() * 8)
    const failRate = localTotal === 0 ? 0 : (failedRecords / localTotal) * 100
    const columnThreshold = kind === 'rate' ? threshold : undefined
    const extraCell = extra(column)
    const count = Math.round(1_700_000 + next() * 400_000)
    const mean = 1_820_000
    const unique = 38 + (hash(column.id) % 22)
    const missing = columnFailed ? 3 + (hash(column.id) % 8) : hash(column.id) % 2
    const added = hash(`${column.id}:new`) % 6
    const distMean = 124 + (next() - 0.4) * (columnFailed ? 28 : 4)
    const distSd = 13 + (next() - 0.5) * (columnFailed ? 8 : 1.4)
    const distSum = 2_380_000 + next() * 90_000

    const cells: CellValue[] = []
    if (extraCell) cells.push({ ...extraCell, align: 'left', mono: extraCell.key === 'pattern' })
    if (kind === 'rate' || kind === 'failed') {
      cells.push(
        { key: 'total', label: 'Total Records', value: fmt(localTotal), align: 'right', mono: true },
        { key: 'failed', label: 'Failed Records', value: fmt(failedRecords), align: 'right', mono: true, danger: failedRecords > 0 },
        { key: 'failRate', label: 'Failed %', value: pct(failRate), align: 'right', mono: true, danger: columnFailed },
      )
      if (columnThreshold != null) {
        cells.push({ key: 'threshold', label: 'Threshold', value: pct(columnThreshold, 1), align: 'right', mono: true })
      } else if (kind === 'failed') {
        cells.push({ key: 'threshold', label: 'Threshold', value: fmt(threshold), align: 'right', mono: true })
      }
    }
    if (kind === 'band') {
      cells.push(
        { key: 'count', label: 'Count', value: fmt(count), align: 'right', mono: true, danger: columnFailed },
        { key: 'mean', label: 'Mean', value: fmt(mean), align: 'right', mono: true },
        { key: 'upper', label: 'Upper', value: fmt(mean * 1.12), align: 'right', mono: true },
        { key: 'lower', label: 'Lower', value: fmt(mean * 0.88), align: 'right', mono: true },
      )
    }
    if (kind === 'drift') {
      cells.push(
        { key: 'unique', label: 'Unique values', value: String(unique), align: 'right', mono: true },
        { key: 'missing', label: 'Missing values', value: String(missing), align: 'right', mono: true, danger: missing > 2 },
        { key: 'added', label: 'New values', value: String(added), align: 'right', mono: true },
      )
    }
    if (kind === 'distribution') {
      cells.push(
        { key: 'mean', label: 'Mean', value: distMean.toFixed(2), align: 'right', mono: true, danger: columnFailed },
        { key: 'sd', label: 'SD', value: distSd.toFixed(2), align: 'right', mono: true },
        { key: 'sum', label: 'Sum', value: fmt(distSum), align: 'right', mono: true },
        { key: 'threshold', label: 'Threshold', value: '±8%', align: 'right', mono: true },
      )
    }

    const history = stamps.map((stamp, stampIndex) => {
      const historicFailed = stampIndex === stamps.length - 1 ? columnFailed : stampIndex % 4 === 0 && columnFailed
      const historicRate = historicFailed ? failRate + (stampIndex - 6) * 0.15 : Math.max(0, failRate * 0.2)
      const historicCells: CellValue[] = []
      if (kind === 'rate' || kind === 'failed') {
        historicCells.push(
          { key: 'total', label: 'Total Records', value: fmt(localTotal - (stamps.length - 1 - stampIndex) * 1200), align: 'right', mono: true },
          { key: 'failed', label: 'Failed Records', value: fmt(historicFailed ? failedRecords : Math.round(failedRecords * 0.1)), align: 'right', mono: true, danger: historicFailed },
          { key: 'failRate', label: 'Failed %', value: pct(Math.max(0, historicRate)), align: 'right', mono: true, danger: historicFailed },
        )
      } else if (kind === 'band') {
        historicCells.push(
          { key: 'count', label: 'Count', value: fmt(count - (stamps.length - 1 - stampIndex) * 18000), align: 'right', mono: true },
          { key: 'mean', label: 'Mean', value: fmt(mean), align: 'right', mono: true },
        )
      } else if (kind === 'drift') {
        historicCells.push(
          { key: 'unique', label: 'Unique values', value: String(unique - (stamps.length - 1 - stampIndex)), align: 'right', mono: true },
          { key: 'missing', label: 'Missing values', value: String(historicFailed ? missing : 0), align: 'right', mono: true, danger: historicFailed },
          { key: 'added', label: 'New values', value: String(Math.max(0, added - 1)), align: 'right', mono: true },
        )
      } else {
        historicCells.push(
          { key: 'mean', label: 'Mean', value: (distMean - (stamps.length - 1 - stampIndex) * 0.4).toFixed(2), align: 'right', mono: true },
          { key: 'sd', label: 'SD', value: distSd.toFixed(2), align: 'right', mono: true },
          { key: 'sum', label: 'Sum', value: fmt(distSum), align: 'right', mono: true },
        )
      }
      return historyRow(stamp, historicCells, !historicFailed)
    })

    return {
      id: column.id,
      name: column.name,
      passed: !columnFailed,
      threshold: columnThreshold,
      thresholdUnit: columnThreshold != null ? '%' : undefined,
      cells,
      history,
    }
  })

  const failedColumns = rows.filter((row) => !row.passed).length
  const failedRecords = rows.reduce((sum, row) => {
    const cell = row.cells.find((item) => item.key === 'failed')
    return sum + (cell ? Number(cell.value.replace(/,/g, '')) : 0)
  }, 0)

  const kpis: CheckKpi[] = [
    { label: 'Failed columns', value: String(failedColumns), tone: failedColumns ? 'danger' : 'success' },
    {
      label: kind === 'failed' || kind === 'rate' ? 'Failed records' : kind === 'drift' ? 'Missing values' : 'Columns checked',
      value: kind === 'drift' ? String(rows.reduce((sum, row) => sum + Number(row.cells.find((cell) => cell.key === 'missing')?.value ?? 0), 0)) : kind === 'rate' || kind === 'failed' ? fmt(failedRecords) : String(rows.length),
      tone: failedColumns ? 'danger' : 'muted',
    },
    {
      label: 'Threshold',
      value: kind === 'rate' ? pct(threshold, 1) : kind === 'failed' ? fmt(threshold) : kind === 'distribution' ? '±8%' : kind === 'band' ? 'Mean ±12%' : '—',
      tone: 'muted',
    },
    { label: 'Status', value: passed ? 'PASSED' : 'FAILED', tone: passed ? 'success' : 'danger' },
  ]

  const columnHeaders: ColumnHeader[] = rows[0]
    ? rows[0].cells.map((cell) => ({ key: cell.key, label: cell.label, align: cell.align }))
    : []
  const historyHeaders: ColumnHeader[] = rows[0]?.history[0]
    ? rows[0].history[0].cells.map((cell) => ({ key: cell.key, label: cell.label, align: cell.align }))
    : columnHeaders

  return {
    checkName,
    catalogId,
    passed,
    kind,
    series: chart.series,
    seriesKeys: chart.keys,
    kpis,
    columnHeaders,
    historyHeaders,
    rows,
    distributionModes: kind === 'distribution' ? ['mean', 'sd', 'sum'] : undefined,
  }
}

export function resolveCheckName(raw: string) {
  const text = raw.trim().replace(/\s+check$/i, '').trim()
  const direct = catalogChecks.find(
    (check) => check.name.toLowerCase() === raw.trim().toLowerCase() || check.name.toLowerCase() === `${text} check`.toLowerCase(),
  )
  if (direct) return direct.name
  if (/record count/i.test(text)) return 'Record Count Anomaly'
  if (/custom/i.test(text)) return 'Custom rules'
  return raw.trim()
}
