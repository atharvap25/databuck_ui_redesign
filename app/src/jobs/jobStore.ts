import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  jobGroups as seedGroups,
  jobRuns as seedRuns,
  jobSchedules as seedSchedules,
  jobTriggers as seedTriggers,
  nextRunFor,
  newEntityId,
  type Cadence,
  type JobGroup,
  type JobKind,
  type JobRun,
  type JobSchedule,
  type JobTrigger,
} from '../data/jobs.ts'

export type LiveStatus = 'queued' | 'running' | 'complete' | 'failed'

export type LiveJob = {
  id: string
  targetId: string
  name: string
  kind: JobKind
  progress: number
  status: LiveStatus
  startedMs: number
}

export const JOB_RUN_MS = 4500
export const JOB_TICK_MS = 80
export const JOB_LINGER_MS = 3000
export const JOB_AUTO_COLLAPSE_MS = 2000
export const JOB_MAX_CONCURRENT = 2

export function isValidationRunning(jobs: LiveJob[], targetId: string) {
  return jobs.some((job) => job.targetId === targetId && (job.status === 'running' || job.status === 'queued'))
}

function formatClock(date: Date) {
  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const suffix = hours >= 12 ? 'PM' : 'AM'
  return `Today ${hours % 12 || 12}:${minutes} ${suffix}`
}

function formatDuration(ms: number) {
  const total = Math.max(1, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

function liveToRun(job: LiveJob, now = Date.now()): JobRun {
  const running = job.status === 'running' || job.status === 'queued'
  return {
    id: job.id,
    name: job.name,
    kind: job.kind,
    status: job.status === 'failed' ? 'complete' : job.status === 'complete' ? 'complete' : job.status,
    result: job.status === 'failed' ? 'failed' : job.status === 'complete' ? 'success' : undefined,
    originKind: 'manual',
    originLabel: 'Manual',
    validationId: job.kind === 'quality' ? job.targetId : undefined,
    matchingId: job.kind === 'matching' ? job.targetId : undefined,
    groupId: job.kind === 'group' ? job.targetId : undefined,
    startedAt: job.status === 'queued' ? '—' : formatClock(new Date(job.startedMs)),
    startedMs: job.startedMs,
    duration: running && job.status !== 'running' ? '—' : formatDuration(now - job.startedMs),
    progress: job.progress,
  }
}

type JobsContextValue = {
  liveJobs: LiveJob[]
  wave: number
  history: JobRun[]
  schedules: JobSchedule[]
  groups: JobGroup[]
  triggers: JobTrigger[]
  enqueue: (targetId: string, name: string, kind?: JobKind) => void
  cancel: (id: string) => void
  dismissActive: (id: string) => void
  isRunning: (targetId: string) => boolean
  upsertSchedule: (schedule: JobSchedule) => void
  removeSchedule: (id: string) => string | null
  upsertGroup: (group: JobGroup) => void
  toggleGroup: (id: string, enabled: boolean) => void
  upsertTrigger: (trigger: JobTrigger) => void
  toggleTrigger: (id: string, enabled: boolean) => void
  toggleSchedule: (id: string, enabled: boolean) => void
}

const JobsContext = createContext<JobsContextValue | null>(null)

export function JobsProvider({ children }: { children: ReactNode }) {
  const [liveJobs, setLiveJobs] = useState<LiveJob[]>([])
  const [wave, setWave] = useState(0)
  const [history, setHistory] = useState<JobRun[]>(() => seedRuns)
  const [schedules, setSchedules] = useState<JobSchedule[]>(() => seedSchedules)
  const [groups, setGroups] = useState<JobGroup[]>(() => seedGroups)
  const [triggers, setTriggers] = useState<JobTrigger[]>(() => seedTriggers)
  const runningTargets = useRef(new Set<string>())
  const tickers = useRef(new Map<string, number>())
  const timers = useRef<number[]>([])
  const liveRef = useRef<LiveJob[]>([])
  liveRef.current = liveJobs

  useEffect(() => {
    const stored = timers.current
    return () => {
      stored.forEach((id) => {
        window.clearInterval(id)
        window.clearTimeout(id)
      })
    }
  }, [])

  const beginRun = useCallback((id: string, targetId: string, startedMs: number) => {
    if (tickers.current.has(id)) return
    runningTargets.current.add(targetId)
    const tick = window.setInterval(() => {
      const progress = Math.min(100, Math.round(((Date.now() - startedMs) / JOB_RUN_MS) * 100))
      const done = progress >= 100
      setLiveJobs((current) =>
        current.map((item) =>
          item.id === id ? { ...item, progress, status: done ? 'complete' : 'running' } : item,
        ),
      )
      if (!done) return
      window.clearInterval(tick)
      tickers.current.delete(id)
      runningTargets.current.delete(targetId)
      const job = liveRef.current.find((item) => item.id === id)
      if (job) {
        const record = liveToRun({ ...job, progress: 100, status: 'complete' })
        setHistory((history) => [record, ...history.filter((item) => item.id !== id)])
      }
      const linger = window.setTimeout(() => {
        setLiveJobs((current) => current.filter((item) => item.id !== id))
      }, JOB_LINGER_MS)
      timers.current.push(linger)
    }, JOB_TICK_MS)
    tickers.current.set(id, tick)
    timers.current.push(tick)
  }, [])

  useEffect(() => {
    liveJobs
      .filter((job) => job.status === 'running')
      .forEach((job) => beginRun(job.id, job.targetId, job.startedMs))

    const runningCount = liveJobs.filter((job) => job.status === 'running').length
    const slots = JOB_MAX_CONCURRENT - runningCount
    if (slots <= 0) return
    const toStart = liveJobs.filter((job) => job.status === 'queued').slice(0, slots)
    if (toStart.length === 0) return
    const started = Date.now()
    setLiveJobs((current) =>
      current.map((job) =>
        toStart.some((item) => item.id === job.id)
          ? { ...job, status: 'running', progress: 0, startedMs: started }
          : job,
      ),
    )
  }, [liveJobs, beginRun])

  const enqueue = useCallback((targetId: string, name: string, kind: JobKind = 'quality') => {
    setLiveJobs((current) => {
      if (current.some((job) => job.targetId === targetId && (job.status === 'queued' || job.status === 'running'))) {
        return current
      }
      const running = current.filter((job) => job.status === 'running').length
      const id = `${targetId}-${Date.now()}`
      setWave((value) => value + 1)
      return [
        ...current,
        {
          id,
          targetId,
          name,
          kind,
          progress: 0,
          status: running < JOB_MAX_CONCURRENT ? 'running' : 'queued',
          startedMs: Date.now(),
        },
      ]
    })
  }, [])

  const cancel = useCallback((id: string) => {
    const tick = tickers.current.get(id)
    if (tick) {
      window.clearInterval(tick)
      tickers.current.delete(id)
    }
    setLiveJobs((current) => {
      const job = current.find((item) => item.id === id)
      if (job) runningTargets.current.delete(job.targetId)
      return current.filter((item) => item.id !== id)
    })
    setHistory((current) => current.filter((item) => item.id !== id || item.status === 'complete'))
  }, [])

  const dismissActive = useCallback((id: string) => {
    cancel(id)
    setHistory((current) => current.filter((item) => item.id !== id || item.status === 'complete'))
  }, [cancel])

  const isRunning = useCallback(
    (targetId: string) => isValidationRunning(liveJobs, targetId),
    [liveJobs],
  )

  const upsertSchedule = useCallback((schedule: JobSchedule) => {
    setSchedules((current) => {
      const exists = current.some((item) => item.id === schedule.id)
      const next = { ...schedule, nextRun: nextRunFor(schedule.cadence) }
      return exists ? current.map((item) => (item.id === schedule.id ? next : item)) : [next, ...current]
    })
  }, [])

  const removeSchedule = useCallback((id: string) => {
    const dependents = groups.filter((group) => group.scheduleId === id)
    if (dependents.length > 0) {
      return dependents.map((group) => group.name).join(', ')
    }
    setSchedules((current) => current.filter((item) => item.id !== id))
    return null
  }, [groups])

  const toggleSchedule = useCallback((id: string, enabled: boolean) => {
    setSchedules((current) => current.map((item) => (item.id === id ? { ...item, enabled } : item)))
  }, [])

  const upsertGroup = useCallback((group: JobGroup) => {
    setGroups((current) => {
      const exists = current.some((item) => item.id === group.id)
      return exists ? current.map((item) => (item.id === group.id ? group : item)) : [group, ...current]
    })
  }, [])

  const toggleGroup = useCallback((id: string, enabled: boolean) => {
    setGroups((current) =>
      current.map((item) => (item.id === id ? { ...item, enabled, nextRun: enabled ? item.nextRun : 'Paused' } : item)),
    )
  }, [])

  const upsertTrigger = useCallback((trigger: JobTrigger) => {
    setTriggers((current) => {
      const exists = current.some((item) => item.id === trigger.id)
      return exists ? current.map((item) => (item.id === trigger.id ? trigger : item)) : [trigger, ...current]
    })
    setGroups((current) =>
      current.map((group) =>
        group.id === trigger.targetId && trigger.targetType === 'group' ? { ...group, triggerId: trigger.id } : group,
      ),
    )
  }, [])

  const toggleTrigger = useCallback((id: string, enabled: boolean) => {
    setTriggers((current) => current.map((item) => (item.id === id ? { ...item, enabled } : item)))
  }, [])

  const value = useMemo<JobsContextValue>(
    () => ({
      liveJobs,
      wave,
      history,
      schedules,
      groups,
      triggers,
      enqueue,
      cancel,
      dismissActive,
      isRunning,
      upsertSchedule,
      removeSchedule,
      upsertGroup,
      toggleGroup,
      upsertTrigger,
      toggleTrigger,
      toggleSchedule,
    }),
    [
      liveJobs,
      wave,
      history,
      schedules,
      groups,
      triggers,
      enqueue,
      cancel,
      dismissActive,
      isRunning,
      upsertSchedule,
      removeSchedule,
      upsertGroup,
      toggleGroup,
      upsertTrigger,
      toggleTrigger,
      toggleSchedule,
    ],
  )

  return createElement(JobsContext.Provider, { value }, children)
}

export function useJobs() {
  const value = useContext(JobsContext)
  if (!value) throw new Error('useJobs must be used within JobsProvider')
  return value
}

export function mergeBoardJobs(history: JobRun[], liveJobs: LiveJob[]): JobRun[] {
  const liveRuns = liveJobs.map((job) => liveToRun(job))
  const liveIds = new Set(liveRuns.map((job) => job.id))
  const rest = history.filter((job) => !liveIds.has(job.id))
  return [...liveRuns, ...rest].sort((a, b) => {
    const rank = (job: JobRun) => (job.status === 'running' ? 0 : job.status === 'queued' ? 1 : 2)
    const delta = rank(a) - rank(b)
    return delta !== 0 ? delta : b.startedMs - a.startedMs
  })
}

export function cadenceFrom(cadence: Cadence): Cadence {
  return { ...cadence }
}

export function createSchedule(name: string, cadence: Cadence): JobSchedule {
  return {
    id: newEntityId('sch'),
    name,
    cadence,
    enabled: true,
    nextRun: nextRunFor(cadence),
  }
}
