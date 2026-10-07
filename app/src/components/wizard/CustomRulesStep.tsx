import { useMemo, useState, type ReactNode } from 'react'
import {
  categoryLabel,
  globalRules,
  projectRules,
  proposeCustomRules,
  proposeDistributionMetrics,
  type CustomRule,
  type DistributionMetric,
} from '../../data/customRules.ts'
import { dataSources, microsegments, tableForNickname } from '../../data/sources.ts'
import { enrichRuleProposals } from '../../data/aiMocks.ts'
import { useWorkspaceSession } from '../../workspace/WorkspaceSession.tsx'
import { SearchIcon, SparkIcon } from '../icons.tsx'
import { ConfidencePill, GenerateButton } from '../ai/AiKit.tsx'
import type { SchemaColumn } from './model.ts'
import { cardClass, fieldClass, PlusGlyph, primaryButton, secondaryButton } from './ui.tsx'
import CustomRuleCreate from './CustomRuleCreate.tsx'
import DdmCreate from './DdmCreate.tsx'

const headClass =
  'sticky top-0 z-10 bg-canvas px-3 py-3 text-left font-label text-xs font-medium tracking-[0.08em] text-muted uppercase shadow-[inset_0_-1px_0_var(--db-border)]'

type InnerTab = 'project' | 'global' | 'ddm'
type Mode = 'list' | 'create' | 'ddm-create'

export default function CustomRulesStep({
  selectedIds,
  onSelected,
  selectedDdmIds,
  onSelectedDdms,
  tableName,
  schema,
}: {
  selectedIds: string[]
  onSelected: (ids: string[]) => void
  selectedDdmIds: string[]
  onSelectedDdms: (ids: string[]) => void
  tableName: string
  schema: SchemaColumn[]
}) {
  const { selected, selectedLabel, labelFor, rules, ddms, addRules, importGlobalRule, addDdms } = useWorkspaceSession()
  const [tab, setTab] = useState<InnerTab>('project')
  const [mode, setMode] = useState<Mode>('list')
  const [query, setQuery] = useState('')
  const [generating, setGenerating] = useState(false)
  const [proposals, setProposals] = useState<ReturnType<typeof enrichRuleProposals> | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [ddmGenerating, setDdmGenerating] = useState(false)
  const [ddmProposals, setDdmProposals] = useState<DistributionMetric[] | null>(null)
  const [ddmDismissed, setDdmDismissed] = useState<string[]>([])

  const pair = selected
  const project = useMemo(() => projectRules(rules, pair), [pair, rules])
  const global = useMemo(() => globalRules(rules, pair), [pair, rules])
  const text = query.trim().toLowerCase()
  const visibleProject = useMemo(() => filterRules(project, text), [project, text])
  const visibleGlobal = useMemo(() => filterRules(global, text), [global, text])
  const visibleDdms = useMemo(
    () =>
      ddms.filter((item) => {
        if (!text) return true
        return (
          item.name.toLowerCase().includes(text) ||
          item.tableName.toLowerCase().includes(text) ||
          item.column.toLowerCase().includes(text) ||
          item.fn.toLowerCase().includes(text)
        )
      }),
    [ddms, text],
  )
  const tableOptions = useMemo(() => {
    const nicknames = dataSources.flatMap((source) => source.tables.map((table) => table.nickname))
    return tableName && !nicknames.includes(tableName) ? [tableName, ...nicknames] : nicknames
  }, [tableName])
  const segmentNames = useMemo(() => microsegments(tableForNickname(tableName || 'Orders')).map((item) => item.name), [tableName])

  if (!pair) {
    return (
      <section className={`${cardClass} p-8 text-center`}>
        <h2 className="font-sans text-sm font-semibold text-ink">Select a domain-project</h2>
        <p className="mt-1 text-sm text-muted">Custom rules are scoped to the pair in the header.</p>
      </section>
    )
  }

  if (mode === 'create') {
    return (
      <CustomRuleCreate
        pair={pair}
        tableName={tableName}
        schema={schema}
        onCancel={() => setMode('list')}
        onAdd={(next) => {
          addRules(next)
          onSelected([...new Set([...selectedIds, ...next.map((rule) => rule.id)])])
          setMode('list')
          setTab('project')
        }}
      />
    )
  }

  if (mode === 'ddm-create') {
    return (
      <DdmCreate
        tableName={tableName}
        tableOptions={tableOptions}
        schema={schema}
        microsegments={segmentNames}
        onCancel={() => setMode('list')}
        onAdd={(metric) => {
          addDdms([metric])
          onSelectedDdms(selectedDdmIds.includes(metric.id) ? selectedDdmIds : [...selectedDdmIds, metric.id])
          setMode('list')
          setTab('ddm')
        }}
      />
    )
  }

  function generate() {
    if (!pair) return
    const workspace = pair
    setGenerating(true)
    setProposals(null)
    window.setTimeout(() => {
      setProposals(enrichRuleProposals(proposeCustomRules(schema, tableName, workspace)))
      setGenerating(false)
    }, 700)
  }

  function generateDdms() {
    setDdmGenerating(true)
    setDdmProposals(null)
    window.setTimeout(() => {
      setDdmProposals(proposeDistributionMetrics(schema, tableName, segmentNames))
      setDdmGenerating(false)
    }, 700)
  }

  function addProposal(rule: CustomRule) {
    const match = rules.find((item) => item.id === rule.id || item.name === rule.name)
    if (match) {
      if (!selectedIds.includes(match.id)) onSelected([...selectedIds, match.id])
      return
    }
    addRules([rule])
    onSelected([...selectedIds, rule.id])
  }

  const allVisibleSelected = visibleProject.length > 0 && visibleProject.every((rule) => selectedIds.includes(rule.id))
  const allDdmsSelected = visibleDdms.length > 0 && visibleDdms.every((item) => selectedDdmIds.includes(item.id))

  return (
    <div className="flex flex-col gap-4">
      <section className={`${cardClass} overflow-hidden`}>
        <div role="tablist" aria-label="Custom rule libraries" className="flex gap-6 border-b border-line px-5">
          {(
            [
              ['project', 'Custom Rules'],
              ['global', 'Global Custom Rules'],
              ['ddm', 'Data Distribution Metrics'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => {
                setTab(id)
                setQuery('')
              }}
              className={`-mb-px cursor-pointer border-b-2 py-3 font-label text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                tab === id ? 'border-indigo text-indigo' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'project' ? (
            <>
              <ListHeader
                title="Custom rules"
                subtitle={`${selectedIds.filter((id) => project.some((rule) => rule.id === id)).length} selected for this validation · ${selectedLabel}`}
                search={query}
                onSearch={setQuery}
                actions={
                  <>
                    <button type="button" onClick={() => setMode('create')} className={secondaryButton}>
                      <PlusGlyph />
                      Create rule
                    </button>
                    <GenerateButton onClick={generate} busy={generating}>
                      Generate with AI BuckGPT
                    </GenerateButton>
                  </>
                }
              />
              {generating || proposals ? (
                <ProposalList
                  generating={generating}
                  proposals={proposals?.filter((rule) => !dismissed.includes(rule.id)) ?? []}
                  existing={rules}
                  onAccept={addProposal}
                  onDismiss={(id) => setDismissed((current) => [...current, id])}
                />
              ) : null}
              <RuleTable
                rows={visibleProject}
                selectedIds={selectedIds}
                allVisibleSelected={allVisibleSelected}
                onToggleAll={() => {
                  if (allVisibleSelected) {
                    const hide = new Set(visibleProject.map((rule) => rule.id))
                    onSelected(selectedIds.filter((id) => !hide.has(id)))
                    return
                  }
                  const next = new Set(selectedIds)
                  for (const rule of visibleProject) next.add(rule.id)
                  onSelected([...next])
                }}
                onToggle={(id) => onSelected(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id])}
                empty="No custom rules in this domain-project."
              />
            </>
          ) : null}

          {tab === 'global' ? (
            <>
              <ListHeader
                title="Global custom rules"
                subtitle="Rules from other domain-projects. Add one here before you can attach it to this validation."
                search={query}
                onSearch={setQuery}
              />
              <GlobalTable
                rows={visibleGlobal}
                labelFor={labelFor}
                alreadyInProject={new Set(project.map((rule) => rule.name))}
                onAdd={(id) => {
                  const copied = importGlobalRule(id)
                  if (copied) {
                    onSelected(selectedIds.includes(copied.id) ? selectedIds : [...selectedIds, copied.id])
                    setTab('project')
                  }
                }}
              />
            </>
          ) : null}

          {tab === 'ddm' ? (
            <>
              <ListHeader
                title="Data distribution metrics"
                subtitle={`${selectedDdmIds.length} selected for this validation`}
                search={query}
                onSearch={setQuery}
                actions={
                  <>
                    <button type="button" onClick={() => setMode('ddm-create')} className={secondaryButton}>
                      <PlusGlyph />
                      Add DDM
                    </button>
                    <GenerateButton onClick={generateDdms} busy={ddmGenerating}>
                      Generate DDM
                    </GenerateButton>
                  </>
                }
              />
              {ddmGenerating || ddmProposals ? (
                <ul className="mb-4 flex flex-col gap-2">
                  {ddmGenerating ? (
                    <>
                      <li className="h-12 animate-pulse rounded-md bg-surface" />
                      <li className="h-12 animate-pulse rounded-md bg-surface" />
                    </>
                  ) : (
                    ddmProposals
                      ?.filter((item) => !ddmDismissed.includes(item.id))
                      .map((item) => {
                        const added = ddms.some((metric) => metric.id === item.id || metric.name === item.name)
                        return (
                          <li key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-line px-3 py-3">
                            <div className="min-w-0">
                              <p className="font-sans text-sm font-medium text-ink">{item.name}</p>
                              <p className="mt-1 font-mono text-xs text-muted">
                                {item.fn} · {item.column} · {item.microsegment || 'All rows'}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col gap-1">
                              <button
                                type="button"
                                disabled={added}
                                onClick={() => {
                                  addDdms([item])
                                  onSelectedDdms(selectedDdmIds.includes(item.id) ? selectedDdmIds : [...selectedDdmIds, item.id])
                                }}
                                className={`${secondaryButton} h-8 px-2.5 text-xs disabled:text-outline`}
                              >
                                {added ? 'Added' : 'Accept'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDdmDismissed((current) => [...current, item.id])}
                                className="h-8 px-2.5 font-sans text-xs text-muted hover:text-ink"
                              >
                                Dismiss
                              </button>
                            </div>
                          </li>
                        )
                      })
                  )}
                </ul>
              ) : null}
              <DdmTable
                rows={visibleDdms}
                selectedIds={selectedDdmIds}
                allVisibleSelected={allDdmsSelected}
                onToggleAll={() => {
                  if (allDdmsSelected) {
                    const hide = new Set(visibleDdms.map((item) => item.id))
                    onSelectedDdms(selectedDdmIds.filter((id) => !hide.has(id)))
                    return
                  }
                  const next = new Set(selectedDdmIds)
                  for (const item of visibleDdms) next.add(item.id)
                  onSelectedDdms([...next])
                }}
                onToggle={(id) =>
                  onSelectedDdms(selectedDdmIds.includes(id) ? selectedDdmIds.filter((item) => item !== id) : [...selectedDdmIds, id])
                }
              />
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function filterRules(rules: CustomRule[], text: string) {
  if (!text) return rules
  return rules.filter((rule) => {
    return (
      rule.name.toLowerCase().includes(text) ||
      rule.expression.toLowerCase().includes(text) ||
      rule.category.includes(text) ||
      rule.description.toLowerCase().includes(text) ||
      rule.sourceValidation.toLowerCase().includes(text)
    )
  })
}

function ListHeader({
  title,
  subtitle,
  search,
  onSearch,
  actions,
}: {
  title: string
  subtitle: string
  search: string
  onSearch: (value: string) => void
  actions?: ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-sans text-sm font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="relative mt-4 max-w-sm">
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-outline">
          <SearchIcon />
        </span>
        <input value={search} placeholder="Search" onChange={(event) => onSearch(event.target.value)} className={`${fieldClass} pl-9`} />
      </div>
    </div>
  )
}

function ProposalList({
  generating,
  proposals,
  existing,
  onAccept,
  onDismiss,
}: {
  generating: boolean
  proposals: ReturnType<typeof enrichRuleProposals>
  existing: CustomRule[]
  onAccept: (rule: CustomRule) => void
  onDismiss: (id: string) => void
}) {
  return (
    <div className="mb-4 rounded-md border border-line bg-surface px-4 py-3">
      <h3 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
        <span className="text-indigo">
          <SparkIcon size={16} />
        </span>
        AI BuckGPT
      </h3>
      {generating ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="h-12 animate-pulse rounded-md bg-canvas" />
          <div className="h-12 animate-pulse rounded-md bg-canvas" />
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {proposals.map((rule) => {
            const added = existing.some((item) => item.id === rule.id || item.name === rule.name)
            return (
              <li key={rule.id} className="flex items-start justify-between gap-3 rounded-md border border-line bg-canvas px-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm text-ink">{rule.name}</p>
                    <ConfidencePill value={rule.confidence} />
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted">{rule.expression}</p>
                  <p className="mt-1 text-sm text-muted">{rule.why}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => onAccept(rule)}
                    className={`${secondaryButton} h-8 px-2.5 text-xs disabled:text-outline`}
                  >
                    {added ? 'Added' : 'Accept'}
                  </button>
                  <button type="button" onClick={() => onDismiss(rule.id)} className="h-8 px-2.5 font-sans text-xs text-muted hover:text-ink">
                    Dismiss
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function RuleTable({
  rows,
  selectedIds,
  allVisibleSelected,
  onToggleAll,
  onToggle,
  empty,
}: {
  rows: CustomRule[]
  selectedIds: string[]
  allVisibleSelected: boolean
  onToggleAll: () => void
  onToggle: (id: string) => void
  empty: string
}) {
  return (
    <div className="db-scroll max-h-[28rem] overflow-auto">
      <table className="w-full min-w-[52rem] border-collapse text-left">
        <thead>
          <tr>
            <th scope="col" className={`${headClass} w-10`}>
              <input type="checkbox" checked={allVisibleSelected} onChange={onToggleAll} aria-label="Select visible rules" className="size-4 accent-indigo" />
            </th>
            <th scope="col" className={headClass}>
              Rule
            </th>
            <th scope="col" className={headClass}>
              Category
            </th>
            <th scope="col" className={headClass}>
              Expression
            </th>
            <th scope="col" className={headClass}>
              Threshold
            </th>
            <th scope="col" className={headClass}>
              Dimension
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
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((rule) => {
              const on = selectedIds.includes(rule.id)
              return (
                <tr key={rule.id} className="border-b border-line transition-colors duration-150 ease-databuck last:border-0 hover:bg-surface">
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={on} aria-label={`Select ${rule.name}`} onChange={() => onToggle(rule.id)} className="size-4 accent-indigo" />
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-mono text-sm text-ink">{rule.name}</p>
                    <p className="mt-0.5 max-w-xs truncate text-xs text-muted">{rule.description}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-sm bg-surface px-1.5 py-0.5 font-label text-[10px] tracking-[0.08em] text-muted uppercase">
                      {categoryLabel(rule.category)}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-3 py-2.5 font-mono text-xs text-muted">{rule.expression}</td>
                  <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{rule.threshold}</td>
                  <td className="px-3 py-2.5 font-sans text-sm text-ink">{rule.dimension}</td>
                  <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{rule.usedIn}</td>
                  <td className="px-3 py-2.5 font-sans text-sm text-ink">{rule.sourceValidation}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function GlobalTable({
  rows,
  labelFor,
  alreadyInProject,
  onAdd,
}: {
  rows: CustomRule[]
  labelFor: (pair: Pick<CustomRule, 'domainId' | 'projectId'>) => string
  alreadyInProject: Set<string>
  onAdd: (id: string) => void
}) {
  return (
    <div className="db-scroll max-h-[28rem] overflow-auto">
      <table className="w-full min-w-[48rem] border-collapse text-left">
        <thead>
          <tr>
            <th scope="col" className={headClass}>
              Rule
            </th>
            <th scope="col" className={headClass}>
              Category
            </th>
            <th scope="col" className={headClass}>
              Domain-project
            </th>
            <th scope="col" className={headClass}>
              Expression
            </th>
            <th scope="col" className={headClass}>
              Used in
            </th>
            <th scope="col" className={`${headClass} w-40`}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted">
                No global custom rules to import.
              </td>
            </tr>
          ) : (
            rows.map((rule) => {
              const present = alreadyInProject.has(rule.name)
              return (
                <tr key={rule.id} className="border-b border-line last:border-0 hover:bg-surface">
                  <td className="px-3 py-2.5">
                    <p className="font-mono text-sm text-ink">{rule.name}</p>
                    <p className="mt-0.5 max-w-xs truncate text-xs text-muted">{rule.description}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-sm bg-surface px-1.5 py-0.5 font-label text-[10px] tracking-[0.08em] text-muted uppercase">
                      {categoryLabel(rule.category)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-sans text-sm text-ink">{labelFor(rule)}</td>
                  <td className="max-w-xs truncate px-3 py-2.5 font-mono text-xs text-muted">{rule.expression}</td>
                  <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{rule.usedIn}</td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      disabled={present}
                      onClick={() => onAdd(rule.id)}
                      className={`${present ? secondaryButton : primaryButton} h-8 px-2.5 text-xs`}
                    >
                      {present ? 'In this project' : 'Add to this project'}
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function DdmTable({
  rows,
  selectedIds,
  allVisibleSelected,
  onToggleAll,
  onToggle,
}: {
  rows: DistributionMetric[]
  selectedIds: string[]
  allVisibleSelected: boolean
  onToggleAll: () => void
  onToggle: (id: string) => void
}) {
  return (
    <div className="db-scroll max-h-[28rem] overflow-auto">
      <table className="w-full min-w-[52rem] border-collapse text-left">
        <thead>
          <tr>
            <th scope="col" className={`${headClass} w-10`}>
              <input type="checkbox" checked={allVisibleSelected} onChange={onToggleAll} aria-label="Select visible metrics" className="size-4 accent-indigo" />
            </th>
            <th scope="col" className={headClass}>
              Metric
            </th>
            <th scope="col" className={headClass}>
              Table
            </th>
            <th scope="col" className={headClass}>
              Column
            </th>
            <th scope="col" className={headClass}>
              Function
            </th>
            <th scope="col" className={headClass}>
              Microsegment
            </th>
            <th scope="col" className={headClass}>
              Threshold
            </th>
            <th scope="col" className={headClass}>
              Dimension
            </th>
            <th scope="col" className={headClass}>
              Filter
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-sm text-muted">
                No distribution metrics yet.
              </td>
            </tr>
          ) : (
            rows.map((item) => {
              const on = selectedIds.includes(item.id)
              return (
                <tr key={item.id} className="border-b border-line last:border-0 hover:bg-surface">
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={on} aria-label={`Select ${item.name}`} onChange={() => onToggle(item.id)} className="size-4 accent-indigo" />
                  </td>
                  <td className="px-3 py-2.5 font-sans text-sm font-medium text-ink">{item.name}</td>
                  <td className="px-3 py-2.5 font-sans text-sm text-ink">{item.tableName}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-ink">{item.column}</td>
                  <td className="px-3 py-2.5 font-sans text-sm text-ink">{item.fn}</td>
                  <td className="px-3 py-2.5 font-sans text-sm text-muted">{item.microsegment || '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{item.threshold}</td>
                  <td className="px-3 py-2.5 font-sans text-sm text-ink">{item.dimension}</td>
                  <td className="max-w-[12rem] truncate px-3 py-2.5 font-mono text-xs text-muted">{item.filter || '—'}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
