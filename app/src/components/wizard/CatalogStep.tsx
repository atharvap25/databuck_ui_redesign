import { catalogSummary, type CatalogColumn, type CatalogState } from '../../data/ruleCatalog.ts'
import RuleCatalog from '../RuleCatalog.tsx'
import { cardClass } from './ui.tsx'

export default function CatalogStep({
  tableName,
  columns,
  state,
  onChange,
}: {
  tableName: string
  columns: CatalogColumn[]
  state: CatalogState
  onChange: (state: CatalogState) => void
}) {
  const summary = catalogSummary(state, columns)

  return (
    <div className="flex flex-col gap-4">
      <section className={`${cardClass} px-5 py-4`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-label text-[11px] tracking-[0.12em] text-indigo uppercase">Databuck suggested</p>
            <h2 className="mt-1 font-sans text-sm font-semibold text-ink">
              Checks for {tableName || 'this table'}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Essential and advanced rules are pre-selected from the table schema. Remove, add, or retune any check before you continue.
            </p>
          </div>
          <dl className="flex shrink-0 gap-6">
            <div>
              <dt className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">Essential</dt>
              <dd className="mt-1 font-mono text-lg font-medium text-ink">{summary.essential}</dd>
            </div>
            <div>
              <dt className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">Advanced</dt>
              <dd className="mt-1 font-mono text-lg font-medium text-ink">{summary.advanced}</dd>
            </div>
            <div>
              <dt className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">Applied</dt>
              <dd className="mt-1 font-mono text-lg font-medium text-ink">{summary.total}</dd>
            </div>
          </dl>
        </div>
      </section>
      <section className={`flex h-[36rem] flex-col overflow-hidden ${cardClass}`}>
        <RuleCatalog shown columns={columns} state={state} onChange={onChange} />
      </section>
    </div>
  )
}
