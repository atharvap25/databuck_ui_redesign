import { useId } from 'react'
import { SparkIcon } from '../icons.tsx'
import type { SourceTable, SourceType } from '../../data/sources.ts'
import { domains, profileModes, type ProfileMode, type SchemaColumn, type TableKind } from './model.ts'
import {
  BookGlyph,
  cardClass,
  DerivedGlyph,
  Field,
  fieldClass,
  Glyph,
  LaterNote,
  ReadOnly,
  Segment,
  Segmented,
  SwitchControl,
  TableGlyph,
  TagField,
  TagList,
} from './ui.tsx'

export default function TableStep(props: {
  connectionType: SourceType
  connectionName: string
  tables: SourceTable[]
  tableKind: TableKind
  onKind: (kind: TableKind) => void
  tableId: string
  onTable: (id: string) => void
  nickname: string
  onNickname: (value: string) => void
  description: string
  onDescription: (value: string) => void
  tags: string[]
  tagDraft: string
  onTagDraft: (value: string) => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
  domain: string
  onDomain: (value: string) => void
  schema: SchemaColumn[]
  advanced: boolean
  onAdvanced: (value: boolean) => void
  filterText: string
  onFilterText: (value: string) => void
  sqlText: string
  onSqlText: (value: string) => void
  profile: ProfileMode
  onProfile: (value: ProfileMode) => void
  suggestedName?: string
  currentName?: string
  onApplyName?: (name: string) => void
}) {
  const descriptionId = useId()
  const filterId = useId()
  const sqlId = useId()
  return (
    <div className="flex flex-col gap-4">
      <Segmented>
        <Segment pressed={props.tableKind === 'data'} onClick={() => props.onKind('data')} count={props.tables.length} icon={<TableGlyph />}>
          Data Tables
        </Segment>
        <Segment pressed={props.tableKind === 'derived'} onClick={() => props.onKind('derived')} icon={<DerivedGlyph />}>
          Derived Tables
        </Segment>
        <Segment pressed={props.tableKind === 'reference'} onClick={() => props.onKind('reference')} icon={<BookGlyph />}>
          Reference Data
        </Segment>
      </Segmented>

      {props.tableKind !== 'data' ? (
        <LaterNote>
          {props.tableKind === 'derived' ? 'Derived tables' : 'Reference data'} are not in this pass.
        </LaterNote>
      ) : (
        <>
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)]">
            <section className={`${cardClass} p-5`}>
              <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                <Field label="Data source type">
                  <ReadOnly value={props.connectionType} />
                </Field>
                <Field label="Data source">
                  <ReadOnly value={props.connectionName} />
                </Field>
                <Field label="Table name" required>
                  <select value={props.tableId} onChange={(event) => props.onTable(event.target.value)} className={fieldClass}>
                    <option value="">{props.tables.length === 0 ? 'This connection has no tables yet' : 'Select table'}</option>
                    {props.tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.nickname}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Table nickname">
                  <input
                    value={props.nickname}
                    placeholder="Enter table nickname"
                    onChange={(event) => props.onNickname(event.target.value)}
                    className={fieldClass}
                  />
                </Field>
                {props.suggestedName && props.onApplyName ? (
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
                    <span className="font-sans text-xs text-muted">Suggested validation name</span>
                    <span className="font-mono text-xs text-ink">{props.suggestedName}</span>
                    <button
                      type="button"
                      className="ml-auto font-sans text-xs font-medium text-indigo"
                      onClick={() => props.onApplyName?.(props.suggestedName ?? '')}
                    >
                      {props.currentName === props.suggestedName ? 'Applied' : 'Use name'}
                    </button>
                  </div>
                ) : null}
                <Field label="Description">
                  <input
                    id={descriptionId}
                    value={props.description}
                    placeholder="What this table is used for"
                    onChange={(event) => props.onDescription(event.target.value)}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Tags">
                  <TagField value={props.tagDraft} onChange={props.onTagDraft} onAdd={props.onAddTag} placeholder="Add tag…" />
                  <TagList tags={props.tags} onRemove={props.onRemoveTag} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="BuckGPT domain" icon={<SparkIcon size={14} />}>
                    <select value={props.domain} onChange={(event) => props.onDomain(event.target.value)} className={fieldClass}>
                      <option value="">Select BuckGPT domain</option>
                      {domains.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </section>
            <ColumnPreview columns={props.schema} />
          </div>

          <section className={cardClass}>
            <div className="flex w-full items-center gap-3 px-4 py-3.5">
              <SwitchControl checked={props.advanced} onChange={props.onAdvanced} />
              <span className="text-muted">
                <Glyph>
                  <path d="M4 8h10" />
                  <path d="M18 8h2" />
                  <circle cx="16" cy="8" r="2" />
                  <path d="M4 16h2" />
                  <path d="M10 16h10" />
                  <circle cx="8" cy="16" r="2" />
                </Glyph>
              </span>
              <span className="font-sans text-sm font-medium text-ink">Advanced Option</span>
            </div>
            {props.advanced ? (
              <div className="border-t border-line px-5 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Filter condition">
                    <input
                      id={filterId}
                      value={props.filterText}
                      placeholder="status = 'Open' AND amount > 0"
                      onChange={(event) => props.onFilterText(event.target.value)}
                      className={`${fieldClass} font-mono text-xs`}
                    />
                  </Field>
                  <Field label="Custom SQL">
                    <input
                      id={sqlId}
                      value={props.sqlText}
                      placeholder="SELECT * FROM customers"
                      onChange={(event) => props.onSqlText(event.target.value)}
                      className={`${fieldClass} font-mono text-xs`}
                    />
                  </Field>
                </div>
                <fieldset className="mt-5">
                  <legend className="font-label text-[11px] tracking-[0.12em] text-muted uppercase">Profile</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {profileModes.map((item) => {
                      const on = props.profile === item.id
                      return (
                        <label
                          key={item.id}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors duration-150 ease-databuck ${
                            on ? 'border-indigo bg-secondary-fixed text-ink' : 'border-line bg-canvas text-ink hover:border-line-strong hover:bg-surface'
                          }`}
                        >
                          <input
                            type="radio"
                            name="profile-mode"
                            checked={on}
                            onChange={() => props.onProfile(item.id)}
                            className="accent-indigo"
                          />
                          {item.label}
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  )
}

function ColumnPreview({ columns }: { columns: SchemaColumn[] }) {
  return (
    <section className={`flex min-h-[22rem] flex-col ${cardClass} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-sans text-sm font-semibold text-ink">Column Preview</h2>
        {columns.length > 0 ? <span className="font-mono text-[11px] text-tagline">{columns.length} columns</span> : null}
      </div>
      {columns.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="text-tagline">
            <TableGlyph size={36} />
          </span>
          <p className="mt-3 max-w-[14rem] text-sm leading-6 text-muted">Select a table to preview its schema</p>
        </div>
      ) : (
        <ul className="db-scroll mt-4 max-h-[24rem] overflow-auto">
          {columns.map((column) => (
            <li key={column.name} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
              <span className="truncate font-mono text-xs text-ink">{column.name}</span>
              <span className="shrink-0 rounded-sm bg-surface px-1.5 py-0.5 font-label text-[10px] tracking-[0.08em] text-muted uppercase">
                {column.format}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
