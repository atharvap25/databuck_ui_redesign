import {
  columnsFor,
  type CatalogColumn,
  type CatalogState,
  type ColumnFormat,
} from '../../data/ruleCatalog.ts'
import { columnProfiles, dataSources, type DataSource, type SourceTable, type SourceType } from '../../data/sources.ts'
import { validationRuns } from '../../data/validations.ts'

export const steps = [
  { id: 'connect', label: 'Connect', hint: 'Where is your data?' },
  { id: 'table', label: 'Choose Table', hint: 'What to check?' },
  { id: 'configure', label: 'Configure', hint: 'Foundation settings' },
  { id: 'catalog', label: 'Rule Catalog', hint: 'Suggested checks' },
  { id: 'custom', label: 'Custom Rules', hint: 'Reusable rules' },
  { id: 'preview', label: 'Preview and Run', hint: 'Review then run' },
  { id: 'alerts', label: 'Notifications', hint: 'Stay informed' },
  { id: 'schedule', label: 'Schedule', hint: 'When to run?' },
] as const

export const pages = [
  {
    title: 'Connect to Your Data',
    subtitle: 'Pick a database you’ve already connected, or set up a new one',
  },
  {
    title: 'Choose a Table',
    subtitle: 'Select which table you want to monitor for data quality',
  },
  {
    title: 'Configure Validation',
    subtitle: 'Set the foundation for how this validation measures quality',
  },
  {
    title: 'Rule Catalog',
    subtitle: 'Databuck suggested essential and advanced checks for this table',
  },
  {
    title: 'Custom Rules',
    subtitle: 'Reuse rules already configured in Databuck, or add new ones',
  },
  {
    title: 'Preview and Run',
    subtitle: 'Review the essentials, then run this validation',
  },
  {
    title: 'Stay Notified',
    subtitle: 'Choose how you want to hear about results — email, Slack, Jira, or incident assignment',
  },
  {
    title: 'Set Your Schedule',
    subtitle: 'Choose how often your data quality checks should run automatically',
  },
] as const

export type StepId = (typeof steps)[number]['id']
export type ProfileMode = 'historic' | 'metadata' | 'profile' | 'discovery'
export type TableKind = 'data' | 'derived' | 'reference'
export type Cyclicality = 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Day of Week'
export type Frequency = 'hourly' | 'daily' | 'weekly' | 'custom'

export type DraftSource = {
  type: SourceType
  nickname: string
  host: string
  database: string
  port: string
  tags: string[]
  username: string
  password: string
}

export type SchemaColumn = { name: string; format: string }

export type ConfigureState = {
  applicationType: string
  dateFormat: string
  anomalyType: string
  stdDev: string
  validityThreshold: string
  reprofiling: boolean
  priority: string
  sigmaDays: string
  cyclicality: Cyclicality
}

export type AlertState = {
  email: string
  slack: string
  jira: string
  assignIncident: string
  severity: string
  trigger: string
  showRules: boolean
  includeSummary: boolean
  onlyOnFailure: boolean
}

export type ScheduleState = {
  scheduler: string
  triggerType: string
  validationName: string
  frequency: Frequency
  startDate: string
  startTime: string
  cron: string
}

export const sourceTypes: SourceType[] = ['MSSQL', 'BigQuery', 'Databricks', 'Teradata']

export const typeLabels: Record<SourceType, string> = {
  MSSQL: 'Microsoft SQL Server',
  BigQuery: 'Google BigQuery',
  Databricks: 'Databricks',
  Teradata: 'Teradata',
}

export const defaultPorts: Record<SourceType, string> = {
  MSSQL: '1433',
  BigQuery: '443',
  Databricks: '443',
  Teradata: '1025',
}

export const sourceDefaults: Record<SourceType, { nickname: string; host: string; database: string; username: string }> = {
  MSSQL: { nickname: 'MSSQL source', host: 'sql.internal', database: 'app.dbo', username: 'readonly' },
  BigQuery: { nickname: 'BigQuery source', host: 'bigquery.googleapis.com', database: 'acme.analytics', username: 'analytics-job' },
  Databricks: { nickname: 'Databricks source', host: 'adb.azuredatabricks.net', database: 'main.default', username: 'token' },
  Teradata: { nickname: 'Teradata source', host: 'td.internal', database: 'prod_db', username: 'readonly' },
}

export const domains = ['Finance', 'Customer', 'Inventory', 'People', 'Operations'] as const

export const profileModes = [
  { id: 'historic', label: 'Historic analysis' },
  { id: 'metadata', label: 'Extract only metadata' },
  { id: 'profile', label: 'Metadata + Profile' },
  { id: 'discovery', label: 'Metadata + Profile + Rule Discovery' },
] as const

export const applicationTypes = ['Bulk Load', 'Incremental', 'Streaming', 'On Demand']
export const anomalyTypes = ['Record Count Anomaly', 'Volume Anomaly', 'None']
export const priorities = ['Low', 'Medium', 'High', 'Critical']
export const cyclicalityOptions: Cyclicality[] = ['None', 'Daily', 'Weekly', 'Monthly', 'Day of Week']
export const severityLevels = ['Low', 'Medium', 'High', 'Critical']
export const alertTriggers = ['On Failure', 'On Warning', 'Always', 'On Success']
export const schedulers = ['Production Scheduler', 'Staging Scheduler', 'Adhoc Scheduler']
export const triggerTypes = ['Validation', 'Profiling', 'Matching']

export const tips = [
  'Ensure your database allows external connections from this platform',
  'Use a read-only user for security best practices',
  'Source nickname helps you identify this connection later',
  'Tags help organize sources across your team',
]

export const scheduleTips = [
  'Run checks after your data loads finish for best results',
  'Daily checks work best for important tables',
  'Use Custom if you need a specific schedule pattern',
  'All times shown are in UTC timezone',
]

export function emptyDraft(type: SourceType = 'MSSQL'): DraftSource {
  const defaults = sourceDefaults[type]
  return {
    type,
    nickname: defaults.nickname,
    host: defaults.host,
    database: defaults.database,
    port: defaultPorts[type],
    tags: [type],
    username: defaults.username,
    password: '',
  }
}

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function sourceFromDraft(draft: DraftSource, existing: DataSource[]): DataSource {
  const base = draft.nickname.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'source'
  const taken = new Set(existing.map((source) => source.id))
  let id = base
  let suffix = 2
  while (taken.has(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }
  const now = new Date()
  const createdOn = `${now.getDate()} ${monthLabels[now.getMonth()]} ${now.getFullYear()}`
  const host = draft.host.trim()
  const database = draft.database.trim()
  return {
    id,
    name: draft.nickname.trim(),
    type: draft.type,
    schema: database,
    active: true,
    connection: {
      host,
      port: draft.port.trim(),
      username: draft.username.trim(),
      createdOn,
      encrypt: draft.type === 'MSSQL' ? 'Yes' : '',
      logon: draft.type === 'Teradata' ? 'TD2' : '',
      project: draft.type === 'BigQuery' ? host : '',
      location: draft.type === 'BigQuery' ? 'US' : '',
      serviceAccount: '',
      workspaceUrl: draft.type === 'Databricks' ? host : '',
      catalog: draft.type === 'Databricks' ? database.split('.')[0] ?? '' : '',
      warehouse: '',
    },
    tables: [],
  }
}

export function firstActiveSource(): DataSource | null {
  return dataSources.find((source) => source.active) ?? null
}

export function todayInputDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function defaultConfigure(dateFormat = 'YYYY-MM-DD'): ConfigureState {
  return {
    applicationType: 'Bulk Load',
    dateFormat,
    anomalyType: 'Record Count Anomaly',
    stdDev: '3.0',
    validityThreshold: '1.0',
    reprofiling: false,
    priority: 'Medium',
    sigmaDays: '30',
    cyclicality: 'None',
  }
}

export function defaultAlerts(): AlertState {
  return {
    email: 'dq.alerts@acme.com',
    slack: '#data-quality',
    jira: '',
    assignIncident: '',
    severity: 'Medium',
    trigger: 'On Failure',
    showRules: true,
    includeSummary: true,
    onlyOnFailure: false,
  }
}

export function defaultSchedule(validationName: string): ScheduleState {
  return {
    scheduler: 'Production Scheduler',
    triggerType: 'Validation',
    validationName,
    frequency: 'daily',
    startDate: todayInputDate(),
    startTime: '09:00',
    cron: '0 9 * * *',
  }
}

export function validationNameFor(nickname: string) {
  const base = nickname.trim() ? nickname.trim().replace(/\s+/g, '_') : 'New_Table'
  return `${base}_Validation`
}

export function inferDomain(sourceName: string, tableName: string) {
  const text = `${sourceName} ${tableName}`.toLowerCase()
  if (/finance|invoice|payment|ledger|journal|ar |account_code|debit|credit/.test(text)) return 'Finance'
  if (/customer|account|campaign|crm/.test(text)) return 'Customer'
  if (/inventory|stock|warehouse|sku|shipment|product|vendor|balance|movement/.test(text)) return 'Inventory'
  if (/worker|people|position|hire|hr|job/.test(text)) return 'People'
  return 'Operations'
}

export function dateFormatFor(schema: SchemaColumn[]) {
  const dateColumn = schema.find((column) => column.format === 'Date')
  return dateColumn ? 'YYYY-MM-DD' : 'YYYY-MM-DD'
}

export function endpointOf(source: DataSource) {
  return source.connection.host || source.connection.project || source.connection.workspaceUrl || source.schema
}

export function databaseOf(source: DataSource) {
  return source.schema || source.connection.catalog || source.connection.project || '—'
}

export function schemaFor(table: SourceTable): SchemaColumn[] {
  const run = validationRuns.find((item) => item.tableName === table.nickname)
  if (run) return columnsFor(run.id).map((column) => ({ name: column.name, format: column.format }))
  return columnProfiles(table).map((column) => ({
    name: column.name,
    format:
      column.dataType === 'int'
        ? 'Integer'
        : column.dataType === 'decimal'
          ? 'Decimal'
          : column.dataType === 'timestamp'
            ? 'Date'
            : 'String',
  }))
}

export function catalogColumnsFrom(schema: SchemaColumn[]): CatalogColumn[] {
  const formats: ColumnFormat[] = ['String', 'Integer', 'Decimal', 'Date']
  return schema.map((column) => ({
    id: column.name,
    name: column.name,
    format: formats.includes(column.format as ColumnFormat) ? (column.format as ColumnFormat) : 'String',
  }))
}

export function emptyCatalog(): CatalogState {
  return { checks: {}, segmentColumnIds: [] }
}

export function frequencyLabel(frequency: Frequency) {
  if (frequency === 'hourly') return 'Hourly'
  if (frequency === 'weekly') return 'Weekly'
  if (frequency === 'custom') return 'Custom'
  return 'Daily'
}
