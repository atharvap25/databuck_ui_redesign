import { matchingJobs, matchingTitle } from './matchings.ts'
import { validationRuns } from './validations.ts'

export const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Weekday = (typeof weekdays)[number]

export type Frequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'
export type JobKind = 'quality' | 'matching' | 'group'
export type JobRunStatus = 'queued' | 'running' | 'complete'
export type JobResult = 'success' | 'failed'
export type JobOriginKind = 'manual' | 'schedule' | 'trigger'
export type TriggerKind = 'api' | 'file' | 'after-job'
export type AfterJobWhen = 'success' | 'always'
export type JobTargetType = 'group' | 'quality' | 'matching'

export type Cadence = {
  frequency: Frequency
  startDate: string
  startTime: string
  cron: string
  weekdays: Weekday[]
  monthDay: number
}

export type JobMember = {
  id: string
  name: string
  kind: Exclude<JobKind, 'group'>
}

export type JobSchedule = {
  id: string
  name: string
  cadence: Cadence
  enabled: boolean
  nextRun: string
}

export type JobGroup = {
  id: string
  name: string
  members: JobMember[]
  scheduleId: string | null
  triggerId: string | null
  enabled: boolean
  lastRun: string
  nextRun: string
}

export type JobTrigger = {
  id: string
  name: string
  kind: TriggerKind
  targetType: JobTargetType
  targetId: string
  enabled: boolean
  lastFired: string
  endpoint?: string
  path?: string
  debounceSeconds?: number
  afterGroupId?: string
  afterWhen?: AfterJobWhen
}

export type JobRun = {
  id: string
  name: string
  kind: JobKind
  status: JobRunStatus
  result?: JobResult
  originKind: JobOriginKind
  originLabel: string
  validationId?: string
  matchingId?: string
  groupId?: string
  members?: JobMember[]
  startedAt: string
  startedMs: number
  duration: string
  progress: number
}

const weekdayShort: Record<Weekday, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

const weekdayLong: Record<Weekday, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

export const weekdayLabels = weekdays.map((id) => ({ id, short: weekdayShort[id], long: weekdayLong[id] }))

export function defaultCadence(): Cadence {
  return {
    frequency: 'daily',
    startDate: '2026-10-01',
    startTime: '09:00',
    cron: '0 9 * * *',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    monthDay: 1,
  }
}

export function frequencyLabel(frequency: Frequency) {
  if (frequency === 'hourly') return 'Hourly'
  if (frequency === 'weekly') return 'Weekly'
  if (frequency === 'monthly') return 'Monthly'
  if (frequency === 'custom') return 'Custom'
  return 'Daily'
}

function formatClock(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hour = hours % 12 || 12
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export function cadenceSummary(cadence: Cadence) {
  const time = formatClock(cadence.startTime)
  if (cadence.frequency === 'hourly') return `Hourly from ${time}`
  if (cadence.frequency === 'daily') return `Daily at ${time}`
  if (cadence.frequency === 'weekly') {
    const days = cadence.weekdays.length === 0
      ? 'No days selected'
      : cadence.weekdays.length === 7
        ? 'Every day'
        : cadence.weekdays.map((day) => weekdayShort[day]).join(', ')
    return `${days} at ${time}`
  }
  if (cadence.frequency === 'monthly') return `Day ${cadence.monthDay} of each month at ${time}`
  return cadence.cron.trim() ? `Cron ${cadence.cron}` : 'Custom cadence'
}

export function kindLabel(kind: JobKind) {
  if (kind === 'matching') return 'Matching'
  if (kind === 'group') return 'Group'
  return 'Quality'
}

export function triggerKindLabel(kind: TriggerKind) {
  if (kind === 'file') return 'File arrival'
  if (kind === 'after-job') return 'After job'
  return 'API call'
}

export function triggerSummary(trigger: JobTrigger) {
  if (trigger.kind === 'file') return trigger.path || 'Watched path'
  if (trigger.kind === 'after-job') return trigger.afterWhen === 'always' ? 'After any outcome' : 'After success'
  return trigger.endpoint || 'POST /jobs/run'
}

export function jobTargetOptions(groups: JobGroup[]): { id: string; type: JobTargetType; label: string }[] {
  return [
    ...groups.map((group) => ({ id: group.id, type: 'group' as const, label: group.name })),
    ...validationRuns.map((run) => ({ id: run.id, type: 'quality' as const, label: run.tableName })),
    ...matchingJobs.map((job) => ({ id: job.id, type: 'matching' as const, label: matchingTitle(job) })),
  ]
}

export function jobTargetLabel(type: JobTargetType, id: string, groups: JobGroup[]) {
  if (type === 'group') return groups.find((group) => group.id === id)?.name ?? 'Job group'
  if (type === 'matching') {
    const job = matchingJobs.find((item) => item.id === id)
    return job ? matchingTitle(job) : 'Matching job'
  }
  return validationRuns.find((run) => run.id === id)?.tableName ?? 'Validation'
}

export function memberCatalog(): JobMember[] {
  return [
    ...validationRuns.map((run) => ({ id: run.id, name: run.tableName, kind: 'quality' as const })),
    ...matchingJobs.map((job) => ({ id: job.id, name: matchingTitle(job), kind: 'matching' as const })),
  ]
}

export function scheduleUsedBy(scheduleId: string, groups: JobGroup[]) {
  return groups.filter((group) => group.scheduleId === scheduleId)
}

export function nextRunFor(cadence: Cadence) {
  if (cadence.frequency === 'hourly') return `Today ${formatClock(cadence.startTime)}`
  if (cadence.frequency === 'monthly') return `${cadence.monthDay} Oct ${formatClock(cadence.startTime)}`
  if (cadence.frequency === 'weekly') {
    const lead = cadence.weekdays[0]
    return lead ? `${weekdayShort[lead]} ${formatClock(cadence.startTime)}` : `Next run ${formatClock(cadence.startTime)}`
  }
  if (cadence.frequency === 'custom') return cadence.cron
  return `Tomorrow ${formatClock(cadence.startTime)}`
}

function cadence(
  frequency: Frequency,
  startTime: string,
  extra: Partial<Cadence> = {},
): Cadence {
  return {
    ...defaultCadence(),
    frequency,
    startTime,
    cron:
      frequency === 'hourly'
        ? `0 * * * *`
        : frequency === 'weekly'
          ? `0 ${startTime.slice(0, 2)} * * 1-5`
          : frequency === 'monthly'
            ? `0 ${startTime.slice(0, 2)} ${extra.monthDay ?? 1} * *`
            : frequency === 'custom'
              ? extra.cron ?? '0 9 * * *'
              : `0 ${startTime.slice(0, 2)} * * *`,
    ...extra,
  }
}

const quality = (id: string, name?: string): JobMember => {
  const run = validationRuns.find((item) => item.id === id)
  return { id, name: name ?? run?.tableName ?? id, kind: 'quality' }
}

const matching = (id: string): JobMember => {
  const job = matchingJobs.find((item) => item.id === id)
  return { id, name: job ? matchingTitle(job) : id, kind: 'matching' }
}

export const jobSchedules: JobSchedule[] = [
  {
    id: 'sch-weekday',
    name: 'Weekday morning checks',
    cadence: cadence('weekly', '09:00', { weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'] }),
    enabled: true,
    nextRun: 'Thu 9:00 AM',
  },
  {
    id: 'sch-nightly',
    name: 'Finance nightly',
    cadence: cadence('daily', '02:00'),
    enabled: true,
    nextRun: 'Tomorrow 2:00 AM',
  },
  {
    id: 'sch-hourly',
    name: 'Hourly CDC',
    cadence: cadence('hourly', '00:00'),
    enabled: true,
    nextRun: 'Today 11:00 AM',
  },
  {
    id: 'sch-month-end',
    name: 'Month-end close',
    cadence: cadence('monthly', '06:00', { monthDay: 1 }),
    enabled: true,
    nextRun: '1 Nov 6:00 AM',
  },
  {
    id: 'sch-weekly-mon',
    name: 'Monday customer pack',
    cadence: cadence('weekly', '08:00', { weekdays: ['mon'] }),
    enabled: false,
    nextRun: 'Mon 8:00 AM',
  },
]

export const jobGroups: JobGroup[] = [
  {
    id: 'grp-finance',
    name: 'Finance nightly',
    members: [quality('invoices'), quality('payments'), quality('ledger'), quality('journals')],
    scheduleId: 'sch-nightly',
    triggerId: 'trg-api-finance',
    enabled: true,
    lastRun: 'Today 2:04 AM',
    nextRun: 'Tomorrow 2:00 AM',
  },
  {
    id: 'grp-customer',
    name: 'Customer matching pack',
    members: [quality('customers'), quality('accounts'), quality('customer-360'), matching('3102'), matching('3126')],
    scheduleId: 'sch-weekly-mon',
    triggerId: 'trg-after-finance',
    enabled: true,
    lastRun: '29 Sep 8:12 AM',
    nextRun: 'Mon 8:00 AM',
  },
  {
    id: 'grp-orders',
    name: 'Orders landing',
    members: [quality('orders'), quality('order-lines'), quality('shipments'), matching('3108')],
    scheduleId: 'sch-hourly',
    triggerId: 'trg-file-orders',
    enabled: true,
    lastRun: 'Today 10:02 AM',
    nextRun: 'Today 11:00 AM',
  },
  {
    id: 'grp-hr',
    name: 'People ops',
    members: [quality('workers'), quality('positions'), matching('3132')],
    scheduleId: 'sch-weekday',
    triggerId: null,
    enabled: false,
    lastRun: '26 Sep 9:04 AM',
    nextRun: 'Paused',
  },
]

export const jobTriggers: JobTrigger[] = [
  {
    id: 'trg-api-finance',
    name: 'Close pipeline API',
    kind: 'api',
    targetType: 'group',
    targetId: 'grp-finance',
    enabled: true,
    lastFired: 'Today 2:00 AM',
    endpoint: 'POST /api/jobs/groups/grp-finance/run',
  },
  {
    id: 'trg-file-orders',
    name: 'Orders file landing',
    kind: 'file',
    targetType: 'group',
    targetId: 'grp-orders',
    enabled: true,
    lastFired: 'Today 10:01 AM',
    path: 's3://acme-landing/orders/',
    debounceSeconds: 120,
  },
  {
    id: 'trg-after-finance',
    name: 'After finance close',
    kind: 'after-job',
    targetType: 'group',
    targetId: 'grp-customer',
    enabled: true,
    lastFired: 'Today 2:18 AM',
    afterGroupId: 'grp-finance',
    afterWhen: 'success',
  },
  {
    id: 'trg-api-ledger',
    name: 'Ledger adhoc API',
    kind: 'api',
    targetType: 'quality',
    targetId: 'ledger',
    enabled: false,
    lastFired: '12 Sep 4:22 PM',
    endpoint: 'POST /api/jobs/validations/ledger/run',
  },
]

function run(partial: JobRun): JobRun {
  return partial
}

export const jobRuns: JobRun[] = [
  run({
    id: 'job-live-1',
    name: 'Orders landing',
    kind: 'group',
    status: 'running',
    originKind: 'trigger',
    originLabel: 'Orders file landing',
    groupId: 'grp-orders',
    members: jobGroups[2].members,
    startedAt: 'Today 10:32 AM',
    startedMs: Date.parse('2026-10-01T10:32:00'),
    duration: '6m 12s',
    progress: 64,
  }),
  run({
    id: 'job-live-2',
    name: 'AR Invoices',
    kind: 'quality',
    status: 'running',
    originKind: 'manual',
    originLabel: 'Manual',
    validationId: 'invoices',
    startedAt: 'Today 10:29 AM',
    startedMs: Date.parse('2026-10-01T10:29:00'),
    duration: '8m 40s',
    progress: 41,
  }),
  run({
    id: 'job-queue-1',
    name: 'Finance nightly',
    kind: 'group',
    status: 'queued',
    originKind: 'schedule',
    originLabel: 'Finance nightly',
    groupId: 'grp-finance',
    members: jobGroups[0].members,
    startedAt: '—',
    startedMs: Date.parse('2026-10-01T10:40:00'),
    duration: '—',
    progress: 0,
  }),
  run({
    id: 'job-queue-2',
    name: '3102_ERP Customers to Warehouse',
    kind: 'matching',
    status: 'queued',
    originKind: 'schedule',
    originLabel: 'Monday customer pack',
    matchingId: '3102',
    startedAt: '—',
    startedMs: Date.parse('2026-10-01T10:39:00'),
    duration: '—',
    progress: 0,
  }),
  run({
    id: 'job-queue-3',
    name: 'Customer 360',
    kind: 'quality',
    status: 'queued',
    originKind: 'trigger',
    originLabel: 'After finance close',
    validationId: 'customer-360',
    startedAt: '—',
    startedMs: Date.parse('2026-10-01T10:38:00'),
    duration: '—',
    progress: 0,
  }),
  run({
    id: 'job-done-1',
    name: 'Finance nightly',
    kind: 'group',
    status: 'complete',
    result: 'success',
    originKind: 'schedule',
    originLabel: 'Finance nightly',
    groupId: 'grp-finance',
    members: jobGroups[0].members,
    startedAt: 'Today 2:00 AM',
    startedMs: Date.parse('2026-10-01T02:00:00'),
    duration: '18m 04s',
    progress: 100,
  }),
  run({
    id: 'job-done-2',
    name: 'Orders',
    kind: 'quality',
    status: 'complete',
    result: 'success',
    originKind: 'trigger',
    originLabel: 'Orders file landing',
    validationId: 'orders',
    startedAt: 'Today 10:02 AM',
    startedMs: Date.parse('2026-10-01T10:02:00'),
    duration: '4m 11s',
    progress: 100,
  }),
  run({
    id: 'job-done-3',
    name: 'Campaigns',
    kind: 'quality',
    status: 'complete',
    result: 'failed',
    originKind: 'schedule',
    originLabel: 'Weekday morning checks',
    validationId: 'campaigns',
    startedAt: 'Today 9:00 AM',
    startedMs: Date.parse('2026-10-01T09:00:00'),
    duration: '6m 48s',
    progress: 100,
  }),
  run({
    id: 'job-done-4',
    name: '3120_AR Invoices to GL',
    kind: 'matching',
    status: 'complete',
    result: 'failed',
    originKind: 'manual',
    originLabel: 'Manual',
    matchingId: '3120',
    startedAt: 'Today 8:14 AM',
    startedMs: Date.parse('2026-10-01T08:14:00'),
    duration: '11m 02s',
    progress: 100,
  }),
  run({
    id: 'job-done-5',
    name: 'Customer matching pack',
    kind: 'group',
    status: 'complete',
    result: 'success',
    originKind: 'trigger',
    originLabel: 'After finance close',
    groupId: 'grp-customer',
    members: jobGroups[1].members,
    startedAt: 'Today 2:18 AM',
    startedMs: Date.parse('2026-10-01T02:18:00'),
    duration: '22m 31s',
    progress: 100,
  }),
  run({
    id: 'job-done-6',
    name: 'Workers',
    kind: 'quality',
    status: 'complete',
    result: 'success',
    originKind: 'schedule',
    originLabel: 'Weekday morning checks',
    validationId: 'workers',
    startedAt: '30 Sep 9:00 AM',
    startedMs: Date.parse('2026-09-30T09:00:00'),
    duration: '3m 40s',
    progress: 100,
  }),
  run({
    id: 'job-done-7',
    name: '3138_Balances to Movements',
    kind: 'matching',
    status: 'complete',
    result: 'success',
    originKind: 'manual',
    originLabel: 'Manual',
    matchingId: '3138',
    startedAt: '30 Sep 4:22 PM',
    startedMs: Date.parse('2026-09-30T16:22:00'),
    duration: '9m 16s',
    progress: 100,
  }),
  run({
    id: 'job-done-8',
    name: 'General Ledger',
    kind: 'quality',
    status: 'complete',
    result: 'failed',
    originKind: 'trigger',
    originLabel: 'Ledger adhoc API',
    validationId: 'ledger',
    startedAt: '29 Sep 4:22 PM',
    startedMs: Date.parse('2026-09-29T16:22:00'),
    duration: '7m 55s',
    progress: 100,
  }),
]

export function isActiveJob(job: JobRun) {
  return job.status === 'running' || job.status === 'queued'
}

export function jobStatusLabel(job: JobRun) {
  if (job.status === 'running') return 'Running'
  if (job.status === 'queued') return 'Queued'
  return job.result === 'failed' ? 'Failed' : 'Complete'
}

export function newEntityId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

export function apiEndpointFor(type: JobTargetType, id: string) {
  if (type === 'group') return `POST /api/jobs/groups/${id}/run`
  if (type === 'matching') return `POST /api/jobs/matching/${id}/run`
  return `POST /api/jobs/validations/${id}/run`
}
