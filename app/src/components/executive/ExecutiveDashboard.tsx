import { useEffect, useState } from 'react'
import { useWorkspaceAi } from '../../ai/WorkspaceAiContext.tsx'
import {
  DEFAULT_LABOR_RATE,
  dailyBriefingPrompt,
  executiveSnapshot,
  formatMoney,
  savingsCost,
} from '../../data/executiveDashboard.ts'
import { useWorkspaceSession } from '../../workspace/WorkspaceSession.tsx'
import { AiAction, useMockGenerate } from '../ai/AiKit.tsx'
import StatusBadge from '../StatusBadge.tsx'
import {
  AreaLineChart,
  ChartCard,
  ColumnChart,
  HorizontalStack,
  LineChart,
  MultiLineChart,
  RingChart,
} from './ExecutiveCharts.tsx'
import ExecutiveReview from './ExecutiveReview.tsx'

type DashTab = 'dashboard' | 'review'

export default function ExecutiveDashboard() {
  const { selectedLabel } = useWorkspaceSession()
  const { enabled, askAgent, setFocus } = useWorkspaceAi()
  const snapshot = executiveSnapshot()
  const [tab, setTab] = useState<DashTab>('dashboard')
  const [rate, setRate] = useState(String(DEFAULT_LABOR_RATE))
  const laborRate = Number(rate) > 0 ? Number(rate) : DEFAULT_LABOR_RATE
  const { busy, run } = useMockGenerate(700)
  const [reviewReady, setReviewReady] = useState(true)
  const cost = savingsCost(snapshot.hoursSaved, laborRate)

  useEffect(() => {
    setFocus({ screen: 'dashboard' })
  }, [setFocus])

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-line bg-canvas px-6 py-4">
        <div className="min-w-0">
          <p className="font-label text-[0.6875rem] font-medium tracking-[0.08em] text-indigo uppercase">{selectedLabel}</p>
          <h1 className="mt-1 font-sans text-xl font-semibold tracking-[-0.03em] text-ink">Executive Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted">As of {snapshot.asOf}</p>
        </div>
        {enabled ? (
          <AiAction onClick={() => askAgent(dailyBriefingPrompt(selectedLabel))}>Get Daily Briefing</AiAction>
        ) : null}
      </header>

      <div role="tablist" className="flex shrink-0 gap-6 border-b border-line bg-canvas px-6">
        {(
          [
            ['dashboard', 'Dashboard'],
            ['review', "Buck's Executive Review"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px cursor-pointer border-b-2 py-3 font-label text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
              tab === id ? 'border-indigo text-indigo' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="db-scroll min-h-0 flex-1 overflow-auto p-6">
        {tab === 'review' ? (
          <div className="mx-auto max-w-5xl">
            <ExecutiveReview
              pairLabel={selectedLabel}
              snapshot={snapshot}
              rate={laborRate}
              generating={!reviewReady || busy}
              onRegenerate={() => {
                setReviewReady(false)
                run(() => setReviewReady(true))
              }}
            />
          </div>
        ) : (
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {snapshot.kpis.map((kpi) => (
                <article key={kpi.label} className="rounded-lg border border-line bg-canvas p-4 shadow-card">
                  <p className="font-label text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">{kpi.label}</p>
                  <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.04em] tabular-nums text-ink">{kpi.value}</p>
                  <p
                    className={`mt-1 font-mono text-xs tabular-nums ${
                      kpi.deltaTone === 'danger' ? 'text-danger' : kpi.deltaTone === 'success' ? 'text-success-ink' : 'text-muted'
                    }`}
                  >
                    {kpi.delta}
                  </p>
                  <p className="mt-1 text-xs text-muted">{kpi.hint}</p>
                </article>
              ))}
            </div>

            <ChartCard
              title="Enterprise Data Trust Score"
              hint="Portfolio DTS across monitored tables"
              action={
                <div className="flex items-center gap-2">
                  <StatusBadge tone={snapshot.dtsDelta30 < 0 ? 'warning' : 'success'} label={`${snapshot.dts.toFixed(1)}% DTS`} />
                  <span className={`font-mono text-xs tabular-nums ${snapshot.dtsDelta30 < 0 ? 'text-danger' : 'text-success-ink'}`}>
                    {snapshot.dtsDelta30.toFixed(1)} vs 30d
                  </span>
                </div>
              }
            >
              <AreaLineChart
                points={snapshot.dtsSeries}
                label="Enterprise data trust score"
                current={`${snapshot.dts.toFixed(1)}%`}
              />
            </ChartCard>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Number of issues" hint="Failed checks and unmatched keys, last 32 days">
                <LineChart points={snapshot.issueSeries} label="Number of issues" tone="indigo" spikeFrom={24} />
              </ChartCard>
              <ChartCard title="Your savings with Databuck" hint="Estimated steward hours avoided in the last 30 days">
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <article className="rounded-md border border-line bg-surface px-4 py-3">
                    <p className="font-label text-[0.6875rem] tracking-[0.08em] text-muted uppercase">Time saved</p>
                    <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-ink">{snapshot.hoursSaved}</p>
                    <p className="mt-0.5 text-xs text-muted">hours</p>
                  </article>
                  <article className="rounded-md border border-line bg-surface px-4 py-3">
                    <p className="font-label text-[0.6875rem] tracking-[0.08em] text-muted uppercase">Cost saved</p>
                    <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-success-ink">{formatMoney(cost)}</p>
                    <p className="mt-0.5 text-xs text-muted">at ${laborRate}/hr</p>
                  </article>
                </div>
                <label className="mt-4 block">
                  <span className="font-label text-[0.6875rem] tracking-[0.08em] text-muted uppercase">Hourly labor rate</span>
                  <span className="mt-1 flex h-10 max-w-[12rem] items-center rounded-md border border-line bg-canvas px-3 font-mono text-sm text-ink focus-within:ring-2 focus-within:ring-indigo">
                    $
                    <input
                      value={rate}
                      onChange={(event) => setRate(event.target.value)}
                      inputMode="decimal"
                      className="ml-1 w-full bg-transparent font-mono text-sm tabular-nums outline-none"
                      aria-label="Hourly labor rate"
                    />
                  </span>
                </label>
              </ChartCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Tables by trust band" hint={`${snapshot.trustCounts.total} monitored tables`}>
                <HorizontalStack
                  caption="Tables by trust band"
                  segments={[
                    { label: 'High trust', value: snapshot.trustCounts.high, tone: 'success' },
                    { label: 'Watch', value: snapshot.trustCounts.watch, tone: 'warning' },
                    { label: 'Failed', value: snapshot.trustCounts.failed, tone: 'danger' },
                  ]}
                />
              </ChartCard>
              <ChartCard title="Records monitored" hint="Weekly volume on the latest profiles">
                <ColumnChart points={snapshot.recordsWeekly} label="Records monitored by week" />
              </ChartCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Project trust status" hint={selectedLabel}>
                <HorizontalStack
                  caption="Project trust status"
                  segments={[
                    { label: 'High trust', value: snapshot.trustCounts.high, tone: 'success' },
                    { label: 'Watch', value: snapshot.trustCounts.watch, tone: 'warning' },
                    { label: 'Failed', value: snapshot.trustCounts.failed, tone: 'danger' },
                  ]}
                />
                <ul className="mt-4 divide-y divide-line border-t border-line">
                  {snapshot.drivers.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="font-sans text-sm text-ink">{item.name}</span>
                      <span className="font-mono text-sm tabular-nums text-danger">{item.score.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </ChartCard>
              <ChartCard title="Issues detected by type" hint="Null, duplicate, drift, anomaly, matching">
                <MultiLineChart series={snapshot.issuesByType} label="Issues by check type" />
              </ChartCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="High-trust tables" hint="Count of tables at or above 95% DTS">
                <ColumnChart points={snapshot.highTrustTrend} label="High-trust tables over 30 days" />
              </ChartCard>
              <ChartCard title="Latest status" hint={snapshot.asOf}>
                <div className="mt-4 flex flex-col gap-5">
                  <RingChart
                    title="Scored"
                    value={snapshot.mix.scored}
                    total={snapshot.trustCounts.total}
                    tone="indigo"
                    caption={`${snapshot.mix.scored} of ${snapshot.trustCounts.total} tables scored this cycle. ${snapshot.mix.stale} are stale (last run before 17 Sep).`}
                  />
                  <RingChart
                    title="High"
                    value={snapshot.mix.high}
                    total={snapshot.trustCounts.total}
                    tone="success"
                    caption={`${snapshot.mix.high} high-trust (${((snapshot.mix.high / snapshot.trustCounts.total) * 100).toFixed(1)}%). ${snapshot.mix.low} sit in watch or failed.`}
                  />
                </div>
              </ChartCard>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
