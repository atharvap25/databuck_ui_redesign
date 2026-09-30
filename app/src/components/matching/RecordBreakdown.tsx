import { formatCount, formatPct, type BreakdownRow, type BreakdownTone } from '../../data/matchResults.ts'
import { matchViz } from './viz.ts'

const dotColor: Record<BreakdownTone, string> = {
  full: 'var(--db-success)',
  mismatch: 'var(--db-danger)',
  source: matchViz.sourceDot,
  target: matchViz.targetDot,
  'source-dup': matchViz.sourceDot,
  'target-dup': matchViz.targetDot,
}

const zoneClass: Record<BreakdownRow['zone'], string> = {
  'Records Matched': 'bg-success-tint text-success-ink',
  'Only Source': 'bg-info-tint text-info-ink',
  'Only Target': 'bg-secondary-fixed text-indigo',
}

export default function RecordBreakdown({ rows }: { rows: BreakdownRow[] }) {
  return (
    <section className="flex min-w-0 flex-col rounded-lg border border-line bg-canvas shadow-card">
      <header className="border-b border-line px-5 py-3">
        <h3 className="font-label text-xs font-medium tracking-[0.1em] text-muted uppercase">Record Breakdown</h3>
      </header>
      <div className="db-scroll min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              {['Category', 'Count', '%', 'Zone'].map((label) => (
                <th
                  key={label}
                  className="sticky top-0 bg-canvas px-4 py-2 font-label text-[10px] font-medium tracking-[0.1em] text-muted uppercase shadow-[inset_0_-1px_0_var(--db-border)]"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category} className="border-b border-line last:border-b-0">
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: dotColor[row.tone] }} aria-hidden="true" />
                    <span className="font-sans text-sm text-ink">{row.category}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-sm tabular-nums text-ink">{formatCount(row.count)}</td>
                <td className="px-4 py-2.5 font-mono text-sm tabular-nums text-muted">{formatPct(row.percent)}</td>
                <td className="px-4 py-2.5">
                  <ZonePill zone={row.zone} tone={row.tone} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ZonePill({ zone, tone }: { zone: BreakdownRow['zone']; tone: BreakdownTone }) {
  const mismatched = zone === 'Records Matched' && tone === 'mismatch'
  const className = mismatched ? 'bg-danger-tint text-danger' : zoneClass[zone]

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 font-sans text-[11px] font-medium ${className}`}>{zone}</span>
  )
}
