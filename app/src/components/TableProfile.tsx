import {
  columnProfiles,
  correlations,
  microsegments,
  previewRows,
  type SourceTable,
} from '../data/sources.ts'
import type { ProfileInsight } from '../data/aiMocks.ts'
import { AiBanner } from './ai/AiKit.tsx'

export default function TableProfile({ table, insights = [] }: { table: SourceTable; insights?: ProfileInsight[] }) {
  const columns = columnProfiles(table)
  const segments = microsegments(table)
  const pairs = correlations(table)
  const rows = previewRows(table)

  return (
    <div className="flex flex-col gap-8">
      {insights.length > 0 ? (
        <div className="flex flex-col gap-2">
          {insights.map((insight) => (
            <AiBanner key={insight.title} title={insight.title}>
              {insight.body}
            </AiBanner>
          ))}
        </div>
      ) : null}
      <section>
        <h3 className="mb-4 font-sans text-sm font-semibold text-ink">Column profile</h3>
        <div className="db-scroll overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="sticky top-0 bg-canvas">
              <tr className="border-b border-line">
                {[
                  ['Column', 'text-left'],
                  ['Data type', 'text-left'],
                  ['Missing count', 'text-right'],
                  ['Missing %', 'text-right'],
                  ['Unique %', 'text-right'],
                  ['Mean', 'text-right'],
                  ['Std dev', 'text-right'],
                ].map(([heading, align]) => (
                  <th
                    key={heading}
                    className={`px-4 py-2 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase ${align}`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {columns.map((column) => (
                <tr
                  key={column.name}
                  className="border-b border-line transition-colors duration-150 ease-databuck last:border-0 even:bg-surface hover:bg-container"
                >
                  <td className="px-4 py-2 font-mono text-sm text-ink">{column.name}</td>
                  <td className="px-4 py-2 font-mono text-sm text-muted">{column.dataType}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-ink tabular-nums">
                    {column.missingCount.toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-ink tabular-nums">{column.missingPct}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-ink tabular-nums">{column.uniquePct}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-ink tabular-nums">{column.mean}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-ink tabular-nums">{column.stdDev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-sans text-sm font-semibold text-ink">Microsegments</h3>
        <ul className="divide-y divide-line rounded-lg border border-line">
          {segments.map((segment) => (
            <li key={segment.name} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="font-sans text-sm text-ink">{segment.name}</span>
              <span className="font-mono text-sm text-muted tabular-nums">
                {segment.rows.toLocaleString('en-US')} · {segment.share}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-4 font-sans text-sm font-semibold text-ink">Column correlation</h3>
        <ul className="divide-y divide-line rounded-lg border border-line">
          {pairs.map((pair) => (
            <li key={`${pair.left}-${pair.right}`} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="font-mono text-sm text-ink">
                {pair.left} · {pair.right}
              </span>
              <span className="font-mono text-sm text-muted tabular-nums">{pair.coefficient}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-4 font-sans text-sm font-semibold text-ink">Data view</h3>
        <div className="db-scroll overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="sticky top-0 bg-canvas">
              <tr className="border-b border-line">
                {columns.map((column) => (
                  <th
                    key={column.name}
                    className="px-4 py-2 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase"
                  >
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-line transition-colors duration-150 ease-databuck last:border-0 even:bg-surface hover:bg-container"
                >
                  {columns.map((column) => (
                    <td key={column.name} className="px-4 py-2 font-mono text-sm text-ink tabular-nums">
                      {row[column.name]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
