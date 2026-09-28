import { useCallback, useEffect, useRef, useState } from 'react'

export type JobStatus = 'running' | 'complete'

export type Job = {
  id: string
  validationId: string
  name: string
  progress: number
  status: JobStatus
}

export const JOB_RUN_MS = 4500
export const JOB_TICK_MS = 80
export const JOB_LINGER_MS = 3000
export const JOB_AUTO_COLLAPSE_MS = 2000

export function isValidationRunning(jobs: Job[], validationId: string) {
  return jobs.some((job) => job.validationId === validationId && job.status === 'running')
}

export function useJobQueue() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [wave, setWave] = useState(0)
  const runningIds = useRef(new Set<string>())
  const timers = useRef<number[]>([])

  useEffect(() => {
    const stored = timers.current
    return () => {
      stored.forEach((id) => {
        window.clearInterval(id)
        window.clearTimeout(id)
      })
    }
  }, [])

  const enqueue = useCallback((validationId: string, name: string) => {
    if (runningIds.current.has(validationId)) return

    const id = `${validationId}-${Date.now()}`
    runningIds.current.add(validationId)
    setWave((current) => current + 1)
    setJobs((current) => [...current, { id, validationId, name, progress: 0, status: 'running' }])

    const started = Date.now()
    const tick = window.setInterval(() => {
      const progress = Math.min(100, Math.round(((Date.now() - started) / JOB_RUN_MS) * 100))
      const done = progress >= 100
      setJobs((current) =>
        current.map((job) =>
          job.id === id ? { ...job, progress, status: done ? 'complete' : 'running' } : job,
        ),
      )
      if (!done) return
      window.clearInterval(tick)
      runningIds.current.delete(validationId)
      const linger = window.setTimeout(() => {
        setJobs((current) => current.filter((job) => job.id !== id))
      }, JOB_LINGER_MS)
      timers.current.push(linger)
    }, JOB_TICK_MS)

    timers.current.push(tick)
  }, [])

  const isRunning = useCallback(
    (validationId: string) => isValidationRunning(jobs, validationId),
    [jobs],
  )

  return { jobs, wave, enqueue, isRunning }
}
