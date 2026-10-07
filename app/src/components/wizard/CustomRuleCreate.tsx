import { useMemo, useState } from 'react'
import {
  categoryCopy,
  categoryLabel,
  extrasFor,
  ruleCategories,
  ruleDimensions,
  type CustomRule,
  type RuleCategory,
  type RuleDimension,
  type TableColumnMapping,
} from '../../data/customRules.ts'
import { englishToRule, enrichRuleProposals, rulesFromDocument } from '../../data/aiMocks.ts'
import { dataSources } from '../../data/sources.ts'
import type { WorkspacePair } from '../../data/workspaces.ts'
import { BackIcon, SparkIcon, UploadIcon } from '../icons.tsx'
import { ConfidencePill, GenerateButton } from '../ai/AiKit.tsx'
import type { SchemaColumn } from './model.ts'
import { Field, fieldClass, primaryButton, secondaryButton } from './ui.tsx'

const areaClass =
  'min-h-[7.5rem] w-full resize-y rounded-md border border-line bg-canvas px-3 py-2.5 font-mono text-xs leading-5 text-ink transition-colors duration-150 ease-databuck placeholder:text-tagline hover:border-line-strong focus:outline-none focus-visible:border-indigo focus-visible:ring-2 focus-visible:ring-indigo'

type Draft = {
  name: string
  description: string
  category: RuleCategory
  threshold: string
  dimension: RuleDimension
  anchorColumn: string
  expression: string
  phrase: string
  referenceTable: string
  referenceColumn: string
  parentTable: string
  parentColumn: string
  mappings: TableColumnMapping[]
  condition: string
  checkColumns: string[]
}

function emptyDraft(schema: SchemaColumn[]): Draft {
  return {
    name: '',
    description: '',
    category: 'direct query',
    threshold: '0',
    dimension: 'Validity',
    anchorColumn: schema[0]?.name ?? '',
    expression: '',
    phrase: '',
    referenceTable: '',
    referenceColumn: '',
    parentTable: '',
    parentColumn: '',
    mappings: [{ table: '', column: '' }],
    condition: '',
    checkColumns: [],
  }
}

export default function CustomRuleCreate({
  pair,
  tableName,
  schema,
  onCancel,
  onAdd,
}: {
  pair: WorkspacePair
  tableName: string
  schema: SchemaColumn[]
  onCancel: () => void
  onAdd: (rules: CustomRule[]) => void
}) {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(schema))
  const [fileName, setFileName] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [docRules, setDocRules] = useState<ReturnType<typeof enrichRuleProposals> | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [expressionBusy, setExpressionBusy] = useState(false)
  const extras = extrasFor(draft.category)
  const tables = useMemo(
    () => dataSources.flatMap((source) => source.tables.map((table) => table.nickname)),
    [],
  )
  const columns = schema.map((column) => column.name)

  function patch(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }))
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    setFileName(file.name)
    setScanning(true)
    setDocRules(null)
    window.setTimeout(() => {
      const proposed = enrichRuleProposals(rulesFromDocument(file.name, tableName, pair, schema))
      setDocRules(proposed)
      setPicked(proposed.map((rule) => rule.id))
      setScanning(false)
    }, 800)
  }

  function generateExpression() {
    setExpressionBusy(true)
    window.setTimeout(() => {
      const next = englishToRule(draft.phrase, tableName, pair, schema)
      if (next) {
        patch({
          expression: next.expression,
          name: draft.name.trim() ? draft.name : next.name,
          description: draft.description.trim() ? draft.description : next.description,
          anchorColumn: draft.anchorColumn || next.anchorColumn,
          dimension: next.dimension,
        })
      }
      setExpressionBusy(false)
    }, 650)
  }

  function saveForm() {
    const name = draft.name.trim()
    const expression = draft.expression.trim()
    if (!name || !expression) return
    const threshold = Number(draft.threshold)
    onAdd([
      {
        id: `local-${Date.now()}`,
        name,
        description: draft.description.trim() || categoryCopy[draft.category],
        category: draft.category,
        threshold: Number.isFinite(threshold) ? threshold : 0,
        dimension: draft.dimension,
        anchorColumn: draft.anchorColumn,
        expression,
        domainId: pair.domainId,
        projectId: pair.projectId,
        sourceValidation: tableName || 'This validation',
        usedIn: 1,
        referenceTable: extras.reference ? draft.referenceTable || undefined : undefined,
        referenceColumn: extras.reference ? draft.referenceColumn || undefined : undefined,
        parentTable: extras.parent ? draft.parentTable || undefined : undefined,
        parentColumn: extras.parent ? draft.parentColumn || undefined : undefined,
        mappings: extras.mappings ? draft.mappings.filter((item) => item.table && item.column) : undefined,
        condition: extras.condition ? draft.condition || undefined : undefined,
        checkColumns: extras.checkColumns ? draft.checkColumns : undefined,
      },
    ])
  }

  const showingDocs = scanning || docRules

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button type="button" onClick={onCancel} className={`${secondaryButton} h-8 px-2.5 text-xs`}>
            <BackIcon />
            Back to rules
          </button>
          <h2 className="mt-3 font-sans text-base font-semibold tracking-[-0.02em] text-ink">Create custom rule</h2>
          <p className="mt-1 text-sm text-muted">Upload a spec, or write the rule directly. Direct query is the usual starting point.</p>
        </div>
        {!showingDocs ? (
          <button type="button" onClick={saveForm} disabled={!draft.name.trim() || !draft.expression.trim()} className={primaryButton}>
            Add rule
          </button>
        ) : null}
      </div>

      <section className="rounded-lg border border-dashed border-line-strong bg-surface px-4 py-3">
        <label className="flex cursor-pointer items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-canvas text-indigo">
            <UploadIcon size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-sans text-sm font-medium text-ink">Upload a document</span>
            <span className="mt-0.5 block truncate text-xs text-muted">
              {fileName ? fileName : 'PDF, DOCX, or TXT. BuckGPT reads it and proposes rules.'}
            </span>
          </span>
          <span className={`${secondaryButton} h-8 px-2.5 text-xs`}>Choose file</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,.csv"
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
      </section>

      {showingDocs ? (
        <section className="rounded-lg border border-line bg-canvas p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
                <span className="text-indigo">
                  <SparkIcon size={16} />
                </span>
                Proposed from document
              </h3>
              <p className="mt-1 text-sm text-muted">Select the rules to add to this domain-project.</p>
            </div>
            <button
              type="button"
              className="font-sans text-xs font-medium text-indigo hover:text-indigo-hover"
              onClick={() => {
                setFileName(null)
                setDocRules(null)
                setScanning(false)
                setPicked([])
              }}
            >
              Write a rule instead
            </button>
          </div>
          {scanning ? (
            <div className="mt-4 flex flex-col gap-2" aria-hidden="true">
              <div className="h-16 animate-pulse rounded-md bg-surface" />
              <div className="h-16 animate-pulse rounded-md bg-surface" />
              <div className="h-16 animate-pulse rounded-md bg-surface" />
            </div>
          ) : (
            <>
              <ul className="mt-4 flex flex-col gap-2">
                {docRules?.map((rule) => {
                  const on = picked.includes(rule.id)
                  return (
                    <li key={rule.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line px-3 py-3 transition-colors duration-150 ease-databuck hover:bg-surface">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => setPicked((current) => (on ? current.filter((id) => id !== rule.id) : [...current, rule.id]))}
                          className="mt-1 size-4 accent-indigo"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm text-ink">{rule.name}</span>
                            <ConfidencePill value={rule.confidence} />
                            <span className="rounded-sm bg-surface px-1.5 py-0.5 font-label text-[10px] tracking-[0.08em] text-muted uppercase">
                              {categoryLabel(rule.category)}
                            </span>
                          </span>
                          <span className="mt-1 block font-mono text-xs text-muted">{rule.expression}</span>
                          <span className="mt-1 block text-sm text-muted">{rule.description}</span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={onCancel} className={secondaryButton}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={picked.length === 0}
                  onClick={() => onAdd((docRules ?? []).filter((rule) => picked.includes(rule.id)))}
                  className={primaryButton}
                >
                  Add selected
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <>
          <div className="flex items-center gap-4" role="separator" aria-label="Or write the rule">
            <span className="h-px flex-1 bg-line" />
            <span className="font-label text-[10px] font-medium tracking-[0.14em] text-muted uppercase">Or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <section className="rounded-lg border border-line bg-canvas p-5 shadow-card">
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Name" required>
                <input value={draft.name} onChange={(event) => patch({ name: event.target.value })} placeholder="e.g. amount_positive_check" className={fieldClass} />
              </Field>
              <Field label="Category" required>
                <select
                  value={draft.category}
                  onChange={(event) => patch({ category: event.target.value as RuleCategory })}
                  className={fieldClass}
                >
                  {ruleCategories.map((category) => (
                    <option key={category} value={category}>
                      {categoryLabel(category)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="lg:col-span-2">
                <p className="rounded-md bg-surface px-3 py-2 text-sm leading-6 text-muted">{categoryCopy[draft.category]}</p>
              </div>
              <Field label="Description">
                <input
                  value={draft.description}
                  onChange={(event) => patch({ description: event.target.value })}
                  placeholder="What this rule checks"
                  className={fieldClass}
                />
              </Field>
              <Field label="Rule Threshold">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={draft.threshold}
                  onChange={(event) => patch({ threshold: event.target.value })}
                  className={`${fieldClass} font-mono tabular-nums`}
                />
              </Field>
              <Field label="Dimension">
                <select
                  value={draft.dimension}
                  onChange={(event) => patch({ dimension: event.target.value as RuleDimension })}
                  className={fieldClass}
                >
                  {ruleDimensions.map((dimension) => (
                    <option key={dimension}>{dimension}</option>
                  ))}
                </select>
              </Field>
              <Field label="Anchor Column">
                <select value={draft.anchorColumn} onChange={(event) => patch({ anchorColumn: event.target.value })} className={fieldClass}>
                  <option value="">Select column</option>
                  {columns.map((column) => (
                    <option key={column}>{column}</option>
                  ))}
                </select>
              </Field>
            </div>

            {extras.condition ? (
              <div className="mt-4">
                <Field label="Condition" required>
                  <input
                    value={draft.condition}
                    onChange={(event) => patch({ condition: event.target.value })}
                    placeholder="e.g. status = 'Shipped'"
                    className={`${fieldClass} font-mono`}
                  />
                </Field>
              </div>
            ) : null}

            {extras.reference ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Reference table" required>
                  <select value={draft.referenceTable} onChange={(event) => patch({ referenceTable: event.target.value })} className={fieldClass}>
                    <option value="">Select table</option>
                    {tables.map((table) => (
                      <option key={table}>{table}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Reference column" required>
                  <input
                    value={draft.referenceColumn}
                    onChange={(event) => patch({ referenceColumn: event.target.value })}
                    placeholder="Matching column on the reference table"
                    className={`${fieldClass} font-mono`}
                  />
                </Field>
              </div>
            ) : null}

            {extras.parent ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Parent table" required>
                  <select value={draft.parentTable} onChange={(event) => patch({ parentTable: event.target.value })} className={fieldClass}>
                    <option value="">Select table</option>
                    {tables.map((table) => (
                      <option key={table}>{table}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Parent column" required>
                  <input
                    value={draft.parentColumn}
                    onChange={(event) => patch({ parentColumn: event.target.value })}
                    placeholder="Parent key column"
                    className={`${fieldClass} font-mono`}
                  />
                </Field>
              </div>
            ) : null}

            {extras.mappings ? (
              <div className="mt-4">
                <p className="mb-1.5 font-sans text-xs font-medium text-ink">Reference mappings</p>
                <div className="flex flex-col gap-2">
                  {draft.mappings.map((mapping, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <select
                        value={mapping.table}
                        onChange={(event) => {
                          const mappings = draft.mappings.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, table: event.target.value } : item,
                          )
                          patch({ mappings })
                        }}
                        className={fieldClass}
                      >
                        <option value="">Table</option>
                        {tables.map((table) => (
                          <option key={table}>{table}</option>
                        ))}
                      </select>
                      <input
                        value={mapping.column}
                        onChange={(event) => {
                          const mappings = draft.mappings.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, column: event.target.value } : item,
                          )
                          patch({ mappings })
                        }}
                        placeholder="Column"
                        className={`${fieldClass} font-mono`}
                      />
                      <button
                        type="button"
                        className={`${secondaryButton} px-2.5`}
                        onClick={() => patch({ mappings: draft.mappings.filter((_, itemIndex) => itemIndex !== index) })}
                        disabled={draft.mappings.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 font-sans text-xs font-medium text-indigo hover:text-indigo-hover"
                  onClick={() => patch({ mappings: [...draft.mappings, { table: '', column: '' }] })}
                >
                  Add mapping
                </button>
              </div>
            ) : null}

            {extras.checkColumns ? (
              <div className="mt-4">
                <p className="mb-1.5 font-sans text-xs font-medium text-ink">Check columns</p>
                <div className="grid gap-1 sm:grid-cols-2">
                  {columns.map((column) => {
                    const on = draft.checkColumns.includes(column)
                    return (
                      <label key={column} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() =>
                            patch({
                              checkColumns: on
                                ? draft.checkColumns.filter((item) => item !== column)
                                : [...draft.checkColumns, column],
                            })
                          }
                          className="size-4 accent-indigo"
                        />
                        <span className="font-mono text-sm text-ink">{column}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-5">
              <Field label="Rule Expression" required>
                <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={draft.phrase}
                    onChange={(event) => patch({ phrase: event.target.value })}
                    placeholder="Describe the query in plain English"
                    className={fieldClass}
                  />
                  <GenerateButton onClick={generateExpression} busy={expressionBusy} disabled={!draft.phrase.trim()}>
                    Generate with BuckGPT
                  </GenerateButton>
                </div>
                <textarea
                  value={draft.expression}
                  onChange={(event) => patch({ expression: event.target.value })}
                  placeholder="SELECT * FROM table WHERE …"
                  className={areaClass}
                />
                <p className="mt-1 text-xs text-muted">Generated SQL stays editable. Direct query is the most common category.</p>
              </Field>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
