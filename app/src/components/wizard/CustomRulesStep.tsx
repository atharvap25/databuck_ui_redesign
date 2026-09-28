import { useMemo, useState } from 'react'
import type { CustomRule } from '../../data/customRules.ts'
import { proposeCustomRules } from '../../data/customRules.ts'
import { SparkIcon, SearchIcon } from '../icons.tsx'
import type { SchemaColumn } from './model.ts'
import { cardClass, Field, fieldClass, Modal, PlusGlyph, primaryButton, secondaryButton } from './ui.tsx'

const headClass =
  'sticky top-0 z-10 bg-canvas px-3 py-3 text-left font-label text-xs font-medium tracking-[0.08em] text-muted uppercase shadow-[inset_0_-1px_0_var(--db-border)]'

export default function CustomRulesStep({
  rules,
  selectedIds,
  onSelected,
  onAddRule,
  domain,
  tableName,
  schema,
}: {
  rules: CustomRule[]
  selectedIds: string[]
  onSelected: (ids: string[]) => void
  onAddRule: (rule: CustomRule) => void
  domain: string
  tableName: string
  schema: SchemaColumn[]
}) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [proposals, setProposals] = useState<CustomRule[] | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftExpression, setDraftExpression] = useState('')
  const [draftDescription, setDraftDescription] = useState('')

  const text = query.trim().toLowerCase()
  const visible = useMemo(
    () =>
      rules.filter((rule) => {
        if (!text) return true
        return (
          rule.name.toLowerCase().includes(text) ||
          rule.expression.toLowerCase().includes(text) ||
          rule.domain.toLowerCase().includes(text) ||
          rule.sourceValidation.toLowerCase().includes(text)
        )
      }),
    [rules, text],
  )

  const allVisibleSelected = visible.length > 0 && visible.every((rule) => selectedIds.includes(rule.id))

  function toggle(id: string) {
    onSelected(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id])
  }

  function toggleVisible() {
    if (allVisibleSelected) {
      const hide = new Set(visible.map((rule) => rule.id))
      onSelected(selectedIds.filter((id) => !hide.has(id)))
      return
    }
    const next = new Set(selectedIds)
    for (const rule of visible) next.add(rule.id)
    onSelected([...next])
  }

  function saveDraft() {
    const name = draftName.trim()
    const expression = draftExpression.trim()
    if (!name || !expression) return
    onAddRule({
      id: `local-${Date.now()}`,
      name,
      expression,
      description: draftDescription.trim() || 'Custom rule created in this validation.',
      domain: domain || 'Operations',
      sourceValidation: tableName || 'This validation',
      usedIn: 1,
    })
    setDraftName('')
    setDraftExpression('')
    setDraftDescription('')
    setCreating(false)
  }

  function generate() {
    setGenerating(true)
    setProposals(null)
    window.setTimeout(() => {
      setProposals(proposeCustomRules(schema, tableName, domain))
      setGenerating(false)
    }, 700)
  }

  function addProposal(rule: CustomRule) {
    if (rules.some((item) => item.id === rule.id || item.name === rule.name)) {
      if (!selectedIds.includes(rule.id)) {
        const match = rules.find((item) => item.id === rule.id || item.name === rule.name)
        if (match) onSelected([...selectedIds, match.id])
      }
      return
    }
    onAddRule(rule)
  }

  return (
    <div className="flex flex-col gap-4">
      <aside className="rounded-lg border border-info/20 bg-info-tint px-4 py-3 text-sm leading-6 text-info-ink">
        This section is still under development and will later align with current Databuck custom-rule features.
      </aside>

      <section className={`${cardClass} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-sans text-sm font-semibold text-ink">Reusable custom rules</h2>
            <p className="mt-1 text-sm text-muted">
              {selectedIds.length} selected · rules can come from any validation
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setCreating(true)} className={secondaryButton}>
              <PlusGlyph />
              Create rule
            </button>
            <button type="button" onClick={generate} className={secondaryButton}>
              <SparkIcon size={16} />
              Generate with AI BuckGPT
            </button>
          </div>
        </div>

        <div className="relative mt-4 max-w-sm">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-outline">
            <SearchIcon />
          </span>
          <input
            value={query}
            placeholder="Search rules"
            onChange={(event) => setQuery(event.target.value)}
            className={`${fieldClass} pl-9`}
          />
        </div>

        <div className="db-scroll mt-4 max-h-[28rem] overflow-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left">
            <thead>
              <tr>
                <th scope="col" className={`${headClass} w-10`}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleVisible}
                    aria-label="Select visible rules"
                    className="size-4 accent-indigo"
                  />
                </th>
                <th scope="col" className={headClass}>
                  Rule
                </th>
                <th scope="col" className={headClass}>
                  Expression
                </th>
                <th scope="col" className={headClass}>
                  Domain
                </th>
                <th scope="col" className={headClass}>
                  Used in
                </th>
                <th scope="col" className={headClass}>
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted">
                    No custom rules match.
                  </td>
                </tr>
              ) : (
                visible.map((rule) => {
                  const on = selectedIds.includes(rule.id)
                  return (
                    <tr key={rule.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={on}
                          aria-label={`Select ${rule.name}`}
                          onChange={() => toggle(rule.id)}
                          className="size-4 accent-indigo"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-mono text-sm text-ink">{rule.name}</p>
                        <p className="mt-0.5 max-w-xs truncate text-xs text-muted">{rule.description}</p>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-muted">{rule.expression}</td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-sm bg-surface px-1.5 py-0.5 font-label text-[10px] tracking-[0.08em] text-muted uppercase">
                          {rule.domain}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{rule.usedIn}</td>
                      <td className="px-3 py-2.5 font-sans text-sm text-ink">{rule.sourceValidation}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {generating || proposals ? (
        <section className={`${cardClass} p-5`}>
          <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
            <span className="text-indigo">
              <SparkIcon size={16} />
            </span>
            AI BuckGPT
          </h2>
          {generating ? (
            <div className="mt-4 flex flex-col gap-2">
              <div className="h-12 animate-pulse rounded-md bg-surface" />
              <div className="h-12 animate-pulse rounded-md bg-surface" />
              <div className="h-12 animate-pulse rounded-md bg-surface" />
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {proposals?.map((rule) => {
                const added = rules.some((item) => item.id === rule.id || item.name === rule.name)
                return (
                  <li key={rule.id} className="flex items-start justify-between gap-3 rounded-md border border-line px-3 py-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-ink">{rule.name}</p>
                      <p className="mt-1 font-mono text-xs text-muted">{rule.expression}</p>
                      <p className="mt-1 text-sm text-muted">{rule.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => addProposal(rule)}
                      className={`${secondaryButton} h-8 shrink-0 px-2.5 text-xs disabled:text-outline`}
                    >
                      {added ? 'Added' : 'Add'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}

      {creating ? (
        <Modal
          title="Create custom rule"
          onClose={() => setCreating(false)}
          footer={
            <>
              <button type="button" onClick={() => setCreating(false)} className={secondaryButton}>
                Cancel
              </button>
              <button type="button" onClick={saveDraft} disabled={!draftName.trim() || !draftExpression.trim()} className={primaryButton}>
                Add rule
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="Rule name" required>
              <input value={draftName} placeholder="e.g. amount_positive_check" onChange={(event) => setDraftName(event.target.value)} className={fieldClass} />
            </Field>
            <Field label="Expression" required>
              <input
                value={draftExpression}
                placeholder="e.g. amount > 0"
                onChange={(event) => setDraftExpression(event.target.value)}
                className={`${fieldClass} font-mono`}
              />
            </Field>
            <Field label="Description">
              <input
                value={draftDescription}
                placeholder="What this rule checks"
                onChange={(event) => setDraftDescription(event.target.value)}
                className={fieldClass}
              />
            </Field>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
