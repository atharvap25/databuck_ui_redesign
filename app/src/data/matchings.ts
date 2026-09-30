export const matchTypes = [
  'Migration',
  'Aggregate',
  'Aggregate (multiple segments)',
  'Cell-to-cell',
] as const

export type MatchType = (typeof matchTypes)[number]

export type MatchEndpoint = {
  tableName: string
  sourceName: string
  schema: string
}

export type MatchingJob = {
  id: string
  numericId: string
  name: string
  type: MatchType
  source: MatchEndpoint
  target: MatchEndpoint
  matchRate: number
  unmatched: number
  lastRun: string
}

export type MatchingRun = {
  date: string
  rate: number
  unmatched: number
}

export const matchingSummaryId = 'summary'

export function matchingTitle(job: MatchingJob) {
  return `${job.numericId}_${job.name}`
}

export function matchRateTone(job: Pick<MatchingJob, 'matchRate' | 'unmatched'>) {
  if (job.unmatched > 0 || job.matchRate < 50) return 'danger' as const
  if (job.matchRate >= 95) return 'success' as const
  return 'warning' as const
}

function job(
  numericId: string,
  name: string,
  type: MatchType,
  source: MatchEndpoint,
  target: MatchEndpoint,
  matchRate: number,
  unmatched: number,
  lastRun: string,
): MatchingJob {
  return { id: numericId, numericId, name, type, source, target, matchRate, unmatched, lastRun }
}

const acmeErp: MatchEndpoint = { tableName: '', sourceName: 'Acme ERP', schema: 'erp.dbo' }
const warehouse: MatchEndpoint = { tableName: '', sourceName: 'Analytics Warehouse', schema: 'acme.analytics' }
const finance: MatchEndpoint = { tableName: '', sourceName: 'Finance Mart', schema: 'finance.dbo' }
const crm: MatchEndpoint = { tableName: '', sourceName: 'CRM Sync', schema: 'crm.dbo' }
const lake: MatchEndpoint = { tableName: '', sourceName: 'Lakehouse Gold', schema: 'lakehouse.gold' }
const hr: MatchEndpoint = { tableName: '', sourceName: 'PeopleSoft HR', schema: 'hr.dbo' }
const inventory: MatchEndpoint = { tableName: '', sourceName: 'Inventory Facts', schema: 'inventory.gold' }
const marketing: MatchEndpoint = { tableName: '', sourceName: 'Marketing Events', schema: 'acme.events' }
const clickstream: MatchEndpoint = { tableName: '', sourceName: 'Clickstream', schema: 'acme.clickstream' }

export const matchingJobs: MatchingJob[] = [
  job('3102', 'ERP Customers to Warehouse', 'Migration', { ...acmeErp, tableName: 'Customer Master' }, { ...warehouse, tableName: 'Customer Dim' }, 98.4, 0, '19 Sep 2026'),
  job('3108', 'Orders to Fact Orders', 'Aggregate', { ...acmeErp, tableName: 'Orders' }, { ...warehouse, tableName: 'Order Facts' }, 91.9, 0, '19 Sep 2026'),
  job('3114', 'Order Lines by Region', 'Aggregate (multiple segments)', { ...acmeErp, tableName: 'Order Lines' }, { ...warehouse, tableName: 'Order Facts' }, 86.6, 142, '18 Sep 2026'),
  job('3120', 'AR Invoices to GL', 'Cell-to-cell', { ...finance, tableName: 'AR Invoices' }, { ...finance, tableName: 'GL Entries' }, 88.3, 24, '19 Sep 2026'),
  job('3126', 'Accounts to Customer 360', 'Migration', { ...crm, tableName: 'Accounts' }, { ...lake, tableName: 'Customer 360' }, 93.1, 0, '19 Sep 2026'),
  job('3132', 'HR Workers to Positions', 'Cell-to-cell', { ...hr, tableName: 'Workers' }, { ...hr, tableName: 'Positions' }, 100, 0, '17 Sep 2026'),
  job('3138', 'Balances to Movements', 'Aggregate', { ...inventory, tableName: 'Balances' }, { ...inventory, tableName: 'Movements' }, 96.2, 0, '19 Sep 2026'),
  job('3144', 'Shipments to Returns', 'Cell-to-cell', { ...warehouse, tableName: 'Shipments' }, { ...warehouse, tableName: 'Returns' }, 90.4, 0, '19 Sep 2026'),
  job('3150', 'Campaigns by Channel', 'Aggregate (multiple segments)', { ...marketing, tableName: 'Campaigns' }, { ...clickstream, tableName: 'Events' }, 62.4, 318, '12 Sep 2026'),
  job('3156', 'AR Payments to GL', 'Cell-to-cell', { ...finance, tableName: 'AR Payments' }, { ...finance, tableName: 'GL Entries' }, 84.6, 11, '18 Sep 2026'),
]

export function matchingPortfolio() {
  const jobs = matchingJobs.length
  const unmatched = matchingJobs.reduce((sum, item) => sum + item.unmatched, 0)
  const avg = matchingJobs.reduce((sum, item) => sum + item.matchRate, 0) / jobs
  return { jobs, unmatched, avg: Math.round(avg * 10) / 10 }
}

export function matchingHistory(job: MatchingJob): MatchingRun[] {
  const seed = [...job.id].reduce((total, character) => total + character.charCodeAt(0), 0)
  const dates = ['12 Sep 2026', '15 Sep 2026', '17 Sep 2026', job.lastRun]
  return dates.map((date, index) => {
    const steps = dates.length - 1 - index
    const rate = Math.max(18, Math.min(100, job.matchRate - steps * (1.4 + (seed % 8) / 10)))
    const unmatched = index === dates.length - 1 ? job.unmatched : Math.max(0, job.unmatched + steps * (18 + (seed % 12)))
    return { date, rate: Math.round(rate * 10) / 10, unmatched }
  })
}

export function jobMatchesQuery(job: MatchingJob, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const haystack = [
    matchingTitle(job),
    job.numericId,
    job.name,
    job.type,
    job.source.tableName,
    job.source.sourceName,
    job.source.schema,
    job.target.tableName,
    job.target.sourceName,
    job.target.schema,
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(needle)
}
