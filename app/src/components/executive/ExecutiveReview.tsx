import { executiveReviewFor, formatMoney, savingsCost, type ExecutiveSnapshot } from '../../data/executiveDashboard.ts'
import { AiBanner, ConfidencePill, GenerateButton, GeneratePulse, InsightCard } from '../ai/AiKit.tsx'

export default function ExecutiveReview({
  pairLabel,
  snapshot,
  rate,
  generating,
  onRegenerate,
}: {
  pairLabel: string
  snapshot: ExecutiveSnapshot
  rate: number
  generating: boolean
  onRegenerate: () => void
}) {
  const review = executiveReviewFor(pairLabel, rate)
  const cost = savingsCost(snapshot.hoursSaved, rate)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-sans text-lg font-semibold tracking-[-0.02em] text-ink">Buck’s Executive Review</h2>
            <ConfidencePill value={review.confidence} />
          </div>
          <p className="mt-1 text-sm text-muted">AI summary of this dashboard · {snapshot.asOf}</p>
        </div>
        <GenerateButton busy={generating} onClick={onRegenerate}>
          Regenerate
        </GenerateButton>
      </div>

      {generating ? (
        <GeneratePulse rows={6} />
      ) : (
        <>
          <AiBanner title="Headline">{review.headline}</AiBanner>

          <div className="grid gap-4 lg:grid-cols-3">
            <Stat label="Enterprise DTS" value={`${snapshot.dts.toFixed(1)}%`} hint={`${snapshot.dtsDelta30.toFixed(1)} vs 30d`} tone={snapshot.dtsDelta30 < 0 ? 'danger' : 'success'} />
            <Stat label="High-trust tables" value={String(snapshot.trustCounts.high)} hint={`of ${snapshot.trustCounts.total} monitored`} tone="success" />
            <Stat label="Time recovered" value={`${snapshot.hoursSaved} hrs`} hint={formatMoney(cost)} tone="muted" />
          </div>

          <InsightCard title="Score">
            <p className="text-ink">{review.dtsBody}</p>
          </InsightCard>

          <InsightCard title="What moved the score">
            <ul className="flex flex-col gap-3">
              {review.drivers.map((item) => (
                <li key={item.title}>
                  <p className="font-sans text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          </InsightCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <InsightCard title="Trust mix">
              <p className="text-ink">{review.trustBody}</p>
            </InsightCard>
            <InsightCard title="Issues">
              <p className="text-ink">{review.issuesBody}</p>
            </InsightCard>
            <InsightCard title="Matching watch">
              <p className="text-ink">{review.matchingBody}</p>
            </InsightCard>
            <InsightCard title="Savings">
              <p className="text-ink">{review.savingsBody}</p>
            </InsightCard>
          </div>

          <InsightCard title="Board actions">
            <ol className="flex flex-col gap-2">
              {review.actions.map((item, index) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-ink">
                  <span className="font-mono text-xs text-muted tabular-nums">{index + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          </InsightCard>

          <p className="font-label text-[0.6875rem] tracking-[0.08em] text-muted uppercase">
            Based on {review.citations.map((item) => item.label).join(' · ')}
          </p>
        </>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint: string
  tone: 'success' | 'danger' | 'muted'
}) {
  return (
    <article className="rounded-lg border border-line bg-canvas px-4 py-3 shadow-card">
      <p className="font-label text-[0.6875rem] tracking-[0.08em] text-muted uppercase">{label}</p>
      <p
        className={`mt-1 font-mono text-2xl font-medium tabular-nums ${
          tone === 'danger' ? 'text-danger' : tone === 'success' ? 'text-success-ink' : 'text-ink'
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </article>
  )
}
