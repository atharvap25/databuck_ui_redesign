import { catalogSummary, type CatalogColumn, type CatalogState } from '../../data/ruleCatalog.ts'
import { catalogWhy } from '../../data/aiMocks.ts'
import { SparkIcon } from '../icons.tsx'
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
  const why = `Null — ${catalogWhy('null', columns)} Regex — ${catalogWhy('regex', columns)}`

  return (
    <section className={`flex h-[40rem] flex-col overflow-hidden ${cardClass}`}>
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-secondary-fixed px-4 py-2.5">
        <span className="text-indigo">
          <SparkIcon size={16} />
        </span>
        <p className="font-sans text-sm font-medium text-indigo">Suggested for {tableName || 'this table'}</p>
        <span className="rounded-full bg-canvas px-2 py-0.5 font-mono text-[11px] tabular-nums text-ink">
          {summary.essential} Essential
        </span>
        <span className="rounded-full bg-canvas px-2 py-0.5 font-mono text-[11px] tabular-nums text-ink">
          {summary.advanced} Advanced
        </span>
        <span className="rounded-full bg-canvas px-2 py-0.5 font-mono text-[11px] tabular-nums text-ink">
          {summary.total} Applied
        </span>
        <p className="min-w-0 flex-1 truncate text-xs leading-5 text-muted" title={why}>
          {why}
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <RuleCatalog shown columns={columns} state={state} onChange={onChange} suggestionWhy={(id) => catalogWhy(id, columns)} />
      </div>
    </section>
  )
}
