import { useCallback, useState } from 'react'
import { catalogSummary, suggestCatalog, type CatalogState } from '../data/ruleCatalog.ts'
import { libraryCustomRules, suggestedCustomRuleIds, type CustomRule } from '../data/customRules.ts'
import { dataSources } from '../data/sources.ts'
import CatalogStep from './wizard/CatalogStep.tsx'
import ConfigureStep from './wizard/ConfigureStep.tsx'
import ConnectionStep from './wizard/ConnectionStep.tsx'
import CustomRulesStep from './wizard/CustomRulesStep.tsx'
import {
  catalogColumnsFrom,
  defaultAlerts,
  defaultConfigure,
  defaultSchedule,
  emptyCatalog,
  emptyDraft,
  firstActiveSource,
  inferDomain,
  pages,
  schemaFor,
  steps,
  validationNameFor,
  type DraftSource,
  type ProfileMode,
  type TableKind,
} from './wizard/model.ts'
import NotificationsStep from './wizard/NotificationsStep.tsx'
import PreviewStep from './wizard/PreviewStep.tsx'
import RunOverlay from './wizard/RunOverlay.tsx'
import ScheduleStep from './wizard/ScheduleStep.tsx'
import TableStep from './wizard/TableStep.tsx'
import { Glyph, StepGlyph } from './wizard/ui.tsx'

const firstSource = firstActiveSource()

export default function ValidationWizard({
  startStep = 1,
  onExit,
}: {
  startStep?: number
  onExit: () => void
}) {
  const [step, setStep] = useState(Math.min(Math.max(startStep, 1), steps.length))
  const [maxReached, setMaxReached] = useState(Math.min(Math.max(startStep, 1), steps.length))
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [sourceId, setSourceId] = useState<string | null>(firstSource?.id ?? null)
  const [draft, setDraft] = useState<DraftSource>(() => emptyDraft())
  const [showPassword, setShowPassword] = useState(false)
  const [tagDraft, setTagDraft] = useState('')
  const [tableKind, setTableKind] = useState<TableKind>('data')
  const [tableId, setTableId] = useState('')
  const [nickname, setNickname] = useState('')
  const [description, setDescription] = useState('')
  const [tableTags, setTableTags] = useState<string[]>([])
  const [tableTagDraft, setTableTagDraft] = useState('')
  const [domain, setDomain] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [sqlText, setSqlText] = useState('')
  const [profile, setProfile] = useState<ProfileMode>('profile')
  const [configure, setConfigure] = useState(() => defaultConfigure())
  const [catalog, setCatalog] = useState<CatalogState>(() => emptyCatalog())
  const [customRules, setCustomRules] = useState<CustomRule[]>(() => libraryCustomRules)
  const [selectedCustomIds, setSelectedCustomIds] = useState<string[]>([])
  const [alerts, setAlerts] = useState(() => defaultAlerts())
  const [schedule, setSchedule] = useState(() => defaultSchedule(validationNameFor('New_Table')))
  const [visitedAlerts, setVisitedAlerts] = useState(false)
  const [visitedSchedule, setVisitedSchedule] = useState(false)
  const [running, setRunning] = useState(false)

  const existing = dataSources.find((source) => source.id === sourceId) ?? null
  const connectionName = mode === 'existing' ? (existing?.name ?? 'Connection') : draft.nickname
  const connectionType = mode === 'existing' ? (existing?.type ?? 'MSSQL') : draft.type
  const connectionTables = mode === 'existing' ? (existing?.tables ?? []) : []
  const selectedTable = connectionTables.find((table) => table.id === tableId) ?? null
  const schema = selectedTable ? schemaFor(selectedTable) : []
  const columns = catalogColumnsFrom(schema)
  const page = pages[step - 1] ?? { title: steps[step - 1].label, subtitle: steps[step - 1].hint }
  const summary = catalogSummary(catalog, columns)

  const stepReady =
    step === 1
      ? mode === 'existing'
        ? Boolean(existing?.active)
        : draft.nickname.trim() !== '' && draft.host.trim() !== '' && draft.database.trim() !== ''
      : step === 2
        ? tableKind === 'data' && Boolean(selectedTable)
        : true

  function goTo(next: number) {
    const target = Math.min(Math.max(next, 1), steps.length)
    if (target === 7) setVisitedAlerts(true)
    if (target === 8) setVisitedSchedule(true)
    setMaxReached((current) => Math.max(current, target))
    setStep(target)
  }

  function clearTable() {
    setTableId('')
    setNickname('')
    setDescription('')
    setTableTags([])
    setDomain('')
    setFilterText('')
    setCatalog(emptyCatalog())
    setSelectedCustomIds([])
  }

  function chooseTable(id: string) {
    setTableId(id)
    const table = connectionTables.find((item) => item.id === id)
    if (!table) return
    const nextDomain = inferDomain(connectionName, table.nickname)
    const nextSchema = schemaFor(table)
    const nextColumns = catalogColumnsFrom(nextSchema)
    setNickname(table.nickname)
    setDescription(`Quality checks for ${table.nickname}`)
    setDomain(nextDomain)
    setTableTags([connectionType, nextDomain])
    setFilterText(table.rowFilter)
    setCatalog(suggestCatalog(nextColumns, table.nickname))
    setSelectedCustomIds(suggestedCustomRuleIds(nextDomain, table.nickname))
    setSchedule((current) => ({
      ...current,
      validationName: validationNameFor(table.nickname),
    }))
    setConfigure((current) => ({
      ...current,
      dateFormat: nextSchema.some((column) => column.format === 'Date') ? 'YYYY-MM-DD' : current.dateFormat,
    }))
  }

  function goNext() {
    if (!stepReady) return
    if (step === steps.length) {
      onExit()
      return
    }
    goTo(step + 1)
  }

  const finishRun = useCallback(() => {
    setRunning(false)
    setVisitedAlerts(true)
    setMaxReached((current) => Math.max(current, 7))
    setStep(7)
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <div className="db-scroll min-h-0 flex-1 overflow-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-6 lg:px-8 lg:py-8">
          <Stepper step={step} maxReached={maxReached} onJump={goTo} />

          <header className="mt-8 flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="font-sans text-[1.75rem] leading-9 font-semibold tracking-[-0.03em] text-ink">{page.title}</h1>
              <p className="mt-1 text-sm leading-6 text-muted">{page.subtitle}</p>
            </div>
            {step === 1 ? (
              <button
                type="button"
                title="Not set up yet"
                className="hidden h-9 shrink-0 items-center gap-2 rounded-md border border-line bg-canvas px-3 font-sans text-sm font-medium text-ink shadow-card transition-colors duration-150 ease-databuck hover:border-line-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo sm:inline-flex"
              >
                <Glyph>
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 8v4l2.5 1.5" />
                </Glyph>
                Configure from History
              </button>
            ) : null}
          </header>

          <div className="mt-5">
            {step === 1 ? (
              <ConnectionStep
                mode={mode}
                onMode={(next) => {
                  setMode(next)
                  clearTable()
                }}
                sourceId={sourceId}
                onSource={(id) => {
                  setSourceId(id)
                  clearTable()
                }}
                draft={draft}
                onDraft={setDraft}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((current) => !current)}
                tagDraft={tagDraft}
                onTagDraft={setTagDraft}
              />
            ) : null}
            {step === 2 ? (
              <TableStep
                connectionType={connectionType}
                connectionName={connectionName}
                tables={connectionTables}
                tableKind={tableKind}
                onKind={setTableKind}
                tableId={tableId}
                onTable={chooseTable}
                nickname={nickname}
                onNickname={(value) => {
                  setNickname(value)
                  setSchedule((current) => ({ ...current, validationName: validationNameFor(value) }))
                }}
                description={description}
                onDescription={setDescription}
                tags={tableTags}
                tagDraft={tableTagDraft}
                onTagDraft={setTableTagDraft}
                onAddTag={() => {
                  const next = tableTagDraft.trim()
                  if (!next || tableTags.some((tag) => tag.toLowerCase() === next.toLowerCase())) return
                  setTableTags((current) => [...current, next])
                  setTableTagDraft('')
                }}
                onRemoveTag={(tag) => setTableTags((current) => current.filter((item) => item !== tag))}
                domain={domain}
                onDomain={setDomain}
                schema={schema}
                advanced={advanced}
                onAdvanced={setAdvanced}
                filterText={filterText}
                onFilterText={setFilterText}
                sqlText={sqlText}
                onSqlText={setSqlText}
                profile={profile}
                onProfile={setProfile}
              />
            ) : null}
            {step === 3 ? (
              <ConfigureStep
                configure={configure}
                onConfigure={setConfigure}
                domain={domain}
                onDomain={setDomain}
                description={description}
                onDescription={setDescription}
              />
            ) : null}
            {step === 4 ? (
              <CatalogStep tableName={nickname} columns={columns} state={catalog} onChange={setCatalog} />
            ) : null}
            {step === 5 ? (
              <CustomRulesStep
                rules={customRules}
                selectedIds={selectedCustomIds}
                onSelected={setSelectedCustomIds}
                onAddRule={(rule) => {
                  setCustomRules((current) => [rule, ...current])
                  setSelectedCustomIds((current) => (current.includes(rule.id) ? current : [...current, rule.id]))
                }}
                domain={domain}
                tableName={nickname}
                schema={schema}
              />
            ) : null}
            {step === 6 ? (
              <PreviewStep
                sourceName={connectionName}
                tableName={nickname}
                configure={configure}
                domain={domain}
                description={description}
                columns={columns}
                catalog={catalog}
                customRules={customRules}
                selectedCustomIds={selectedCustomIds}
                alerts={alerts}
                schedule={schedule}
                visitedAlerts={visitedAlerts}
                visitedSchedule={visitedSchedule}
                onJump={goTo}
                onRun={() => setRunning(true)}
              />
            ) : null}
            {step === 7 ? <NotificationsStep alerts={alerts} onChange={setAlerts} /> : null}
            {step === 8 ? <ScheduleStep schedule={schedule} onChange={setSchedule} /> : null}
          </div>
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-line bg-canvas px-6 py-3.5 lg:px-8">
        <button
          type="button"
          onClick={() => (step === 1 ? onExit() : goTo(step - 1))}
          className="inline-flex h-10 items-center gap-1 rounded-md px-1 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:text-indigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        >
          <Glyph>
            <path d="M15 6 9 12l6 6" />
          </Glyph>
          Back
        </button>
        <p className="font-sans text-sm text-muted">
          Step {step} of {steps.length}
        </p>
        <button
          type="button"
          disabled={!stepReady}
          onClick={goNext}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-indigo px-4 font-sans text-sm font-medium text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:bg-container-high disabled:text-outline"
        >
          {step === steps.length ? 'Done' : 'Continue'}
          <Glyph>
            <path d="m9 6 6 6-6 6" />
          </Glyph>
        </button>
      </footer>

      {running ? <RunOverlay tableName={nickname} ruleCount={summary.total + selectedCustomIds.length} onFinished={finishRun} /> : null}
    </div>
  )
}

function Stepper({
  step,
  maxReached,
  onJump,
}: {
  step: number
  maxReached: number
  onJump: (step: number) => void
}) {
  return (
    <div className="overflow-x-auto">
      <ol className="flex min-w-[52rem]">
        {steps.map((item, index) => {
          const number = index + 1
          const done = number < step
          const current = number === step
          const reached = done || current
          const clickable = number <= maxReached && number !== step
          return (
            <li key={item.id} className="flex min-w-0 flex-1 flex-col items-center" aria-current={current ? 'step' : undefined}>
              <div className="flex w-full items-center">
                <span className={`h-px flex-1 ${index === 0 ? 'bg-transparent' : reached || number <= maxReached ? 'bg-indigo' : 'bg-line'}`} />
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => onJump(number)}
                  className={`grid size-10 shrink-0 place-items-center rounded-full border transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:cursor-default ${
                    reached ? 'border-indigo bg-indigo text-white' : number <= maxReached ? 'border-indigo bg-canvas text-indigo' : 'border-line bg-canvas text-tagline'
                  }`}
                >
                  {done ? (
                    <Glyph>
                      <path d="m8 12.5 2.5 2.5L16 9" />
                    </Glyph>
                  ) : (
                    <StepGlyph id={item.id} />
                  )}
                </button>
                <span
                  className={`h-px flex-1 ${index === steps.length - 1 ? 'bg-transparent' : number < step || number < maxReached ? 'bg-indigo' : 'bg-line'}`}
                />
              </div>
              <p className={`mt-2.5 text-center font-sans text-xs font-semibold ${reached ? 'text-ink' : 'text-muted'}`}>{item.label}</p>
              <p className="mt-0.5 px-1 text-center font-sans text-[11px] leading-4 text-tagline">{item.hint}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
