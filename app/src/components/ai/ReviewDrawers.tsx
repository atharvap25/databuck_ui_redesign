import { buckReviewFor, rcaFor, runById, type BuckReview, type RootCause } from '../../data/aiMocks.ts'
import { validationRuns } from '../../data/validations.ts'
import { useWorkspaceAi } from '../../ai/WorkspaceAiContext.tsx'
import StatusBadge from '../StatusBadge.tsx'
import { AiDrawer, aiSecondaryButton, ConfidencePill, GeneratePulse } from './AiKit.tsx'
import { useEffect, useState } from 'react'

function ReviewBody({ review }: { review: BuckReview }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <p className="font-sans text-sm font-medium leading-6 text-ink">{review.headline}</p>
          <ConfidencePill value={review.confidence} />
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">{review.summary}</p>
        <p className="mt-2 font-label text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">
          {review.priorDelta} · {review.owner}
        </p>
      </div>
      <div>
        <p className="font-label text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">Score drivers</p>
        <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
          {review.drivers.map((driver) => (
            <li key={driver.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="font-sans text-sm text-ink">{driver.label}</span>
              <span
                className={`font-mono text-sm tabular-nums ${
                  driver.tone === 'danger' ? 'text-danger' : driver.tone === 'success' ? 'text-success-ink' : 'text-warning-ink'
                }`}
              >
                {driver.delta}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {review.failures.length > 0 ? (
        <div>
          <p className="font-label text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">Critical failures</p>
          <ul className="mt-2 flex flex-col gap-2">
            {review.failures.map((item) => (
              <li key={item} className="rounded-md border border-line bg-surface px-3 py-2 text-sm leading-6 text-ink">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <p className="font-label text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">Recommended actions</p>
        <ol className="mt-2 flex flex-col gap-2">
          {review.actions.map((item, index) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-ink">
              <span className="font-mono text-xs text-muted tabular-nums">{index + 1}</span>
              {item}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function RcaBody({ rca }: { rca: RootCause }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-sm font-medium leading-6 text-ink">{rca.headline}</p>
        <ConfidencePill value={rca.confidence} />
      </div>
      <ol className="flex flex-col gap-3">
        {rca.hypotheses.map((item, index) => (
          <li key={item.title} className="rounded-lg border border-line p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-sans text-sm font-semibold text-ink">
                <span className="mr-2 font-mono text-xs text-muted tabular-nums">{index + 1}</span>
                {' '}
                {item.title}
              </p>
              <StatusBadge
                tone={item.likelihood === 'High' ? 'danger' : item.likelihood === 'Medium' ? 'warning' : 'success'}
                label={item.likelihood}
              />
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{item.evidence}</p>
            <p className="mt-2 text-sm leading-6 text-ink">Next: {item.next}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function WorkspaceReviewHost() {
  const { reviewId, rcaId, clearReview, clearRca, openAgent } = useWorkspaceAi()
  const reviewRun = reviewId ? runById(reviewId) ?? validationRuns[0] : null
  const rcaRun = rcaId ? runById(rcaId) ?? validationRuns[0] : null
  const [reviewReady, setReviewReady] = useState(false)
  const [rcaReady, setRcaReady] = useState(false)

  useEffect(() => {
    if (!reviewRun) {
      setReviewReady(false)
      return
    }
    setReviewReady(false)
    const timer = window.setTimeout(() => setReviewReady(true), 600)
    return () => window.clearTimeout(timer)
  }, [reviewRun?.id])

  useEffect(() => {
    if (!rcaRun) {
      setRcaReady(false)
      return
    }
    setRcaReady(false)
    const timer = window.setTimeout(() => setRcaReady(true), 600)
    return () => window.clearTimeout(timer)
  }, [rcaRun?.id])

  return (
    <>
      {reviewRun ? (
        <AiDrawer
          title={`Buck's Review · ${reviewRun.tableName}`}
          generating={!reviewReady}
          onClose={clearReview}
          footer={
            <>
              <button type="button" className={aiSecondaryButton} onClick={openAgent}>
                Ask agent
              </button>
              <button type="button" className={aiSecondaryButton} onClick={clearReview}>
                Close
              </button>
            </>
          }
        >
          {reviewReady ? <ReviewBody review={buckReviewFor(reviewRun)} /> : <GeneratePulse rows={5} />}
        </AiDrawer>
      ) : null}
      {rcaRun ? (
        <AiDrawer
          title={`Root cause · ${rcaRun.tableName}`}
          generating={!rcaReady}
          onClose={clearRca}
          footer={
            <>
              <button type="button" className={aiSecondaryButton} onClick={openAgent}>
                Ask agent
              </button>
              <button type="button" className={aiSecondaryButton} onClick={clearRca}>
                Close
              </button>
            </>
          }
        >
          {rcaReady ? <RcaBody rca={rcaFor(rcaRun)} /> : <GeneratePulse rows={4} />}
        </AiDrawer>
      ) : null}
    </>
  )
}

export function LocalReviewDrawer({
  kind,
  runId,
  onClose,
}: {
  kind: 'review' | 'rca'
  runId: string
  onClose: () => void
}) {
  const run = runById(runId) ?? validationRuns.find((item) => item.tableName === runId) ?? validationRuns[0]
  const [ready, setReady] = useState(false)
  const { openAgent } = useWorkspaceAi()

  useEffect(() => {
    setReady(false)
    const timer = window.setTimeout(() => setReady(true), 600)
    return () => window.clearTimeout(timer)
  }, [runId, kind])

  if (!run) return null

  return (
    <AiDrawer
      title={kind === 'review' ? `Buck's Review · ${run.tableName}` : `Root cause · ${run.tableName}`}
      generating={!ready}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={aiSecondaryButton} onClick={openAgent}>
            Ask agent
          </button>
          <button type="button" className={aiSecondaryButton} onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      {ready ? kind === 'review' ? <ReviewBody review={buckReviewFor(run)} /> : <RcaBody rca={rcaFor(run)} /> : <GeneratePulse />}
    </AiDrawer>
  )
}
