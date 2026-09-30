import { columnProfiles, type DataSource } from '../../data/sources.ts'
import { SwapIcon } from '../icons.tsx'
import { CreateSource } from './ConnectionStep.tsx'
import {
  isStubMatchType,
  schemaFor,
  wizardMatchTypeHints,
  wizardMatchTypes,
  type DraftSource,
  type MatchSideState,
  type WizardMatchType,
} from './model.ts'
import {
  cardClass,
  CheckControl,
  DatabaseGlyph,
  Field,
  fieldClass,
  PlusGlyph,
  Segment,
  Segmented,
} from './ui.tsx'

export default function MatchTablesStep(props: {
  matchType: WizardMatchType | ''
  onMatchType: (value: WizardMatchType | '') => void
  mode: 'existing' | 'new'
  onMode: (mode: 'existing' | 'new') => void
  catalog: DataSource[]
  left: MatchSideState
  right: MatchSideState
  onLeft: (next: MatchSideState) => void
  onRight: (next: MatchSideState) => void
  draft: DraftSource
  onDraft: (draft: DraftSource) => void
  showPassword: boolean
  onTogglePassword: () => void
  tagDraft: string
  onTagDraft: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <p className="mb-2 font-sans text-xs font-medium text-ink">
          Matching type <span className="text-danger">*</span>
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {wizardMatchTypes.map((item) => {
            const on = props.matchType === item
            const later = isStubMatchType(item)
            return (
              <button
                key={item}
                type="button"
                aria-pressed={on}
                onClick={() => props.onMatchType(item)}
                className={`${cardClass} flex cursor-pointer flex-col gap-1 p-4 text-left transition-colors duration-150 ease-databuck hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                  on ? 'border-indigo bg-secondary-fixed' : later ? 'opacity-70' : ''
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-sans text-sm font-semibold text-ink">{item}</span>
                  {later ? (
                    <span className="shrink-0 rounded-md bg-surface px-1.5 py-0.5 font-label text-[10px] tracking-[0.08em] text-muted uppercase">
                      Later
                    </span>
                  ) : null}
                </span>
                <span className="text-xs leading-5 text-muted">{wizardMatchTypeHints[item]}</span>
              </button>
            )
          })}
        </div>
      </section>

      <Segmented>
        <Segment pressed={props.mode === 'existing'} onClick={() => props.onMode('existing')} count={props.catalog.length} icon={<DatabaseGlyph />}>
          Select Existing
        </Segment>
        <Segment pressed={props.mode === 'new'} onClick={() => props.onMode('new')} icon={<PlusGlyph />}>
          Create New
        </Segment>
      </Segmented>

      {props.mode === 'new' ? (
        <CreateSource
          draft={props.draft}
          onDraft={props.onDraft}
          showPassword={props.showPassword}
          onTogglePassword={props.onTogglePassword}
          tagDraft={props.tagDraft}
          onTagDraft={props.onTagDraft}
        />
      ) : (
        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)]">
          <MatchSideCard title="Source" catalog={props.catalog} value={props.left} onChange={props.onLeft} />
          <div className="relative hidden flex-col items-center py-8 lg:flex" aria-hidden="true">
            <span className="w-px flex-1 bg-line" />
            <span className="grid size-8 place-items-center rounded-full bg-secondary-fixed text-indigo shadow-card">
              <SwapIcon size={14} />
            </span>
            <span className="w-px flex-1 bg-line" />
          </div>
          <MatchSideCard title="Target" catalog={props.catalog} value={props.right} onChange={props.onRight} />
        </div>
      )}
    </div>
  )
}

function MatchSideCard({
  title,
  catalog,
  value,
  onChange,
}: {
  title: string
  catalog: DataSource[]
  value: MatchSideState
  onChange: (next: MatchSideState) => void
}) {
  const source = catalog.find((item) => item.id === value.sourceId) ?? null
  const tables = source?.tables ?? []
  const table = tables.find((item) => item.id === value.tableId) ?? null
  const schema = table ? schemaFor(table) : []
  const profiles = table ? columnProfiles(table) : []

  function patch(partial: Partial<MatchSideState>) {
    onChange({ ...value, ...partial })
  }

  return (
    <section className={`${cardClass} flex flex-col p-5`}>
      <h2 className="font-sans text-sm font-semibold text-ink">{title}</h2>
      <div className="mt-4 flex flex-col gap-4">
        <Field label="Data source" required>
          <select
            value={value.sourceId}
            onChange={(event) => patch({ sourceId: event.target.value, tableId: '', filter: '', sql: '' })}
            className={fieldClass}
          >
            <option value="">Select data source</option>
            {catalog.map((item) => (
              <option key={item.id} value={item.id} disabled={!item.active}>
                {item.name}
                {item.active ? '' : ' (offline)'}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Table" required>
          <select
            value={value.tableId}
            disabled={!source}
            onChange={(event) => {
              const next = tables.find((item) => item.id === event.target.value)
              patch({ tableId: event.target.value, filter: next?.rowFilter ?? '' })
            }}
            className={fieldClass}
          >
            <option value="">{source ? 'Select table' : 'Select a data source first'}</option>
            {tables.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nickname}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="font-label text-[11px] tracking-[0.12em] text-muted uppercase">Advanced</p>
        <div className="mt-3 flex flex-col gap-3">
          <CheckControl checked={value.incremental} label="Incremental" onChange={(checked) => patch({ incremental: checked })} />
          <Field label="Filter condition">
            <input
              value={value.filter}
              placeholder="status = 'Open'"
              onChange={(event) => patch({ filter: event.target.value })}
              className={`${fieldClass} font-mono text-xs`}
            />
          </Field>
          <Field label="Custom SQL">
            <input
              value={value.sql}
              placeholder="SELECT * FROM table"
              onChange={(event) => patch({ sql: event.target.value })}
              className={`${fieldClass} font-mono text-xs`}
            />
          </Field>
        </div>
      </div>

      {table ? (
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-label text-[11px] tracking-[0.12em] text-muted uppercase">Column metadata</p>
            <span className="font-mono text-[11px] tabular-nums text-tagline">{schema.length} columns</span>
          </div>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr>
                {['Name', 'Type', 'Missing', 'Unique'].map((label) => (
                  <th key={label} className="border-b border-line pb-2 font-label text-[10px] tracking-[0.12em] text-muted uppercase">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schema.map((column) => {
                const profile = profiles.find((item) => item.name === column.name)
                return (
                  <tr key={column.name} className="border-b border-line last:border-b-0">
                    <td className="py-2 pr-2 font-mono text-xs text-ink">{column.name}</td>
                    <td className="py-2 pr-2 font-label text-[10px] tracking-[0.08em] text-muted uppercase">{column.format}</td>
                    <td className="py-2 pr-2 text-right font-mono text-xs tabular-nums text-muted">{profile ? `${profile.missingPct}%` : '—'}</td>
                    <td className="py-2 text-right font-mono text-xs tabular-nums text-muted">{profile ? `${profile.uniquePct}%` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
