import { formatCount, formatPct, matchKind, type MatchSnapshot } from '../../data/matchResults.ts'
import type { MatchingJob } from '../../data/matchings.ts'
import { matchViz } from './viz.ts'

export { matchViz }

export default function MatchingChart({ job, snap }: { job: MatchingJob; snap: MatchSnapshot }) {
  const kind = matchKind(job)
  const captionLabel = kind === 'cell' ? 'Records Compared' : 'Records Unmatched'
  const captionValue = kind === 'cell' ? snap.compared : snap.recordsUnmatched

  return (
    <section className="@container rounded-lg border border-line bg-canvas p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-sans text-sm font-semibold tracking-[-0.02em] text-ink">Matching Chart</h3>
        <p className="font-label text-[10px] font-medium tracking-[0.08em] text-muted uppercase">
          {captionLabel}
          <span className="ml-2 font-mono text-sm font-medium tracking-normal text-ink tabular-nums">{formatCount(captionValue)}</span>
        </p>
      </div>

      <div
        className="mt-4 grid min-h-[17rem] grid-cols-[minmax(0,1fr)_minmax(7.5rem,32%)_minmax(0,1fr)] grid-rows-[minmax(2.75rem,1fr)_minmax(10rem,2fr)_minmax(2.75rem,1fr)]"
        role="img"
        aria-label={`${captionLabel} ${formatCount(captionValue)}. Source ${formatCount(snap.sourceTotal)}, target ${formatCount(snap.targetTotal)}, full match ${formatCount(snap.fullMatch)}, mismatch ${formatCount(snap.mismatch)}.`}
      >
        <div
          className="z-0 col-start-1 col-end-3 row-start-1 row-end-3 flex flex-col justify-between overflow-hidden rounded-lg border border-line px-4 py-4 pr-[48%]"
          style={{ background: matchViz.sourceFill }}
        >
          <div>
            <p className="font-label text-[10px] font-medium tracking-[0.08em] text-muted uppercase">Source</p>
            <p className="mt-1 font-mono text-[clamp(1.25rem,4cqi,1.75rem)] leading-none font-medium tracking-[-0.04em] tabular-nums text-ink">
              {formatCount(snap.sourceTotal)}
            </p>
            <p className="mt-1 font-label text-[10px] tracking-[0.08em] text-muted uppercase">Total Records</p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <SideFact label="Duplicate" value={snap.sourceDuplicates} />
            <SideFact label="Only Source" value={snap.onlySource} />
          </div>
        </div>

        <div
          className="z-[1] col-start-2 col-end-4 row-start-2 row-end-4 flex flex-col justify-between overflow-hidden rounded-lg border border-line px-4 py-4 pl-[48%] text-right"
          style={{ background: matchViz.targetFill }}
        >
          <div>
            <p className="font-label text-[10px] font-medium tracking-[0.08em] text-muted uppercase">Target</p>
            <p className="mt-1 font-mono text-[clamp(1.25rem,4cqi,1.75rem)] leading-none font-medium tracking-[-0.04em] tabular-nums text-ink">
              {formatCount(snap.targetTotal)}
            </p>
            <p className="mt-1 font-label text-[10px] tracking-[0.08em] text-muted uppercase">Total Records</p>
          </div>
          <div className="mt-4 flex flex-col items-end gap-2">
            <SideFact label="Duplicate" value={snap.targetDuplicates} align="end" />
            <SideFact label="Only Target" value={snap.onlyTarget} align="end" />
          </div>
        </div>

        <div className="relative z-10 col-start-2 row-start-2 min-h-0 min-w-0">
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg border border-line bg-canvas px-3 py-4 text-center">
            <p className="font-mono text-[clamp(1rem,3.5cqi,1.25rem)] leading-none font-medium tabular-nums text-success-ink">
              {formatCount(snap.fullMatch)}
            </p>
            <p className="mt-1 font-label text-[10px] tracking-[0.08em] text-muted uppercase">
              Full Match <span className="font-mono tabular-nums">{formatPct(snap.fullMatchPctOfCompared)}</span>
            </p>
            <p className="mt-4 font-mono text-[clamp(1rem,3.5cqi,1.25rem)] leading-none font-medium tabular-nums text-danger">
              {formatCount(snap.mismatch)}
            </p>
            <p className="mt-1 font-label text-[10px] tracking-[0.08em] text-muted uppercase">
              Mismatch <span className="font-mono tabular-nums">{formatPct(snap.mismatchPctOfCompared)}</span>
            </p>
          </div>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <LegendDot color="var(--db-success)" label="Full Match" />
        <LegendDot color="var(--db-danger)" label="Mismatch" />
        <LegendDot color={matchViz.sourceDot} label="Only Source" />
        <LegendDot color={matchViz.targetDot} label="Only Target" />
      </ul>
    </section>
  )
}

function SideFact({ label, value, align = 'start' }: { label: string; value: number; align?: 'start' | 'end' }) {
  return (
    <div className={align === 'end' ? 'text-right' : ''}>
      <p className="font-mono text-sm font-medium tabular-nums text-ink">{formatCount(value)}</p>
      <p className="mt-0.5 font-label text-[10px] tracking-[0.08em] text-muted uppercase">{label}</p>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="size-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      <span className="font-sans text-xs text-muted">{label}</span>
    </li>
  )
}
