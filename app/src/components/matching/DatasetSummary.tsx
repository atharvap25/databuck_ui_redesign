import { formatCount, formatPct, type MatchSnapshot } from '../../data/matchResults.ts'
import type { MatchingJob } from '../../data/matchings.ts'

export default function DatasetSummary({ job, snap }: { job: MatchingJob; snap: MatchSnapshot }) {
  const rows = [
    { label: 'Table Name', source: job.source.tableName, target: job.target.tableName, mono: false },
    { label: 'Total Records', source: formatCount(snap.sourceTotal), target: formatCount(snap.targetTotal), mono: true },
    {
      label: 'Non-Duplicates',
      source: `${formatCount(snap.sourceNonDuplicates)} (${formatPct(pctOf(snap.sourceNonDuplicates, snap.sourceTotal))})`,
      target: `${formatCount(snap.targetNonDuplicates)} (${formatPct(pctOf(snap.targetNonDuplicates, snap.targetTotal))})`,
      mono: true,
    },
    {
      label: 'Duplicates',
      source: formatCount(snap.sourceDuplicates),
      target: formatCount(snap.targetDuplicates),
      mono: true,
    },
  ]

  return (
    <section className="rounded-lg border border-line bg-canvas shadow-card">
      <header className="grid grid-cols-[minmax(8rem,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] items-end gap-4 border-b border-line px-5 py-3">
        <h3 className="font-label text-xs font-medium tracking-[0.1em] text-muted uppercase">Dataset Summary</h3>
        <p className="font-label text-[10px] font-medium tracking-[0.12em] text-muted uppercase">Source</p>
        <p className="font-label text-[10px] font-medium tracking-[0.12em] text-muted uppercase">Target</p>
      </header>
      <table className="w-full text-left">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-line last:border-b-0">
              <th className="w-[11rem] px-5 py-2.5 font-sans text-sm font-medium text-ink">{row.label}</th>
              <td className={`px-5 py-2.5 text-sm text-ink ${row.mono ? 'font-mono tabular-nums' : 'font-sans'}`}>{row.source}</td>
              <td className={`px-5 py-2.5 text-sm text-ink ${row.mono ? 'font-mono tabular-nums' : 'font-sans'}`}>{row.target}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function pctOf(part: number, whole: number) {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 10000) / 100
}
