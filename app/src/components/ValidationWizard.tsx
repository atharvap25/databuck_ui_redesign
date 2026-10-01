import { useCallback, useState } from 'react'
import { catalogSummary, suggestCatalog, type CatalogState } from '../data/ruleCatalog.ts'
import { libraryCustomRules, suggestedCustomRuleIds, type CustomRule } from '../data/customRules.ts'
import { dataSources, type DataSource } from '../data/sources.ts'
import CatalogStep from './wizard/CatalogStep.tsx'
import ConfigureStep from './wizard/ConfigureStep.tsx'
import ConnectionStep from './wizard/ConnectionStep.tsx'
import CustomRulesStep from './wizard/CustomRulesStep.tsx'
import MatchAdditionalStep from './wizard/MatchAdditionalStep.tsx'
import MatchConfigureStep from './wizard/MatchConfigureStep.tsx'
import MatchMappingStep from './wizard/MatchMappingStep.tsx'
import MatchPreviewStep from './wizard/MatchPreviewStep.tsx'
import MatchTablesStep from './wizard/MatchTablesStep.tsx'
import {
  catalogColumnsFrom,
  defaultAlerts,
  defaultConfigure,
  defaultMatchAdditional,
  defaultMatchFlags,
  defaultSchedule,
  emptyCatalog,
  emptyDraft,
  emptyMatchSide,
  firstActiveSource,
  inferDomain,
  isStubMatchType,
  matchingNameFor,
  matchingPages,
  matchingSteps,
  pages,
  schemaFor,
  seedMatchMappings,
  sourceFromDraft,
  steps,
  validationNameFor,
  type DraftSource,
  type MatchAdditionalState,
  type MatchFlagState,
  type MatchMappingRow,
  type MatchSideState,
  type ProfileMode,
  type TableKind,
  type WizardMatchType,
} from './wizard/model.ts'
import NotificationsStep from './wizard/NotificationsStep.tsx'
import PathStep, { type WizardPath } from './wizard/PathStep.tsx'
import PreviewStep from './wizard/PreviewStep.tsx'
import RunOverlay from './wizard/RunOverlay.tsx'
import ScheduleStep from './wizard/ScheduleStep.tsx'
import TableStep from './wizard/TableStep.tsx'
import { Glyph, StepGlyph } from './wizard/ui.tsx'

const firstSource = firstActiveSource()

export default function ValidationWizard({
  startStep = 1,
  entry = 'quality',
  sources = dataSources,
  onSourceCreated,
  onExit,
}: {
  startStep?: number
  entry?: 'quality' | 'connections' | 'matching'
  sources?: DataSource[]
  onSourceCreated?: (source: DataSource) => void
  onExit: () => void
}) {
  const fromConnections = entry === 'connections'
  const fromMatching = entry === 'matching'
  const [step, setStep] = useState(Math.min(Math.max(startStep, 1), steps.length))
  const [maxReached, setMaxReached] = useState(Math.min(Math.max(startStep, 1), steps.length))
  const [mode, setMode] = useState<'existing' | 'new'>(fromConnections ? 'new' : 'existing')
  const [sourceId, setSourceId] = useState<string | null>(fromConnections ? null : (firstSource?.id ?? null))
  const [catalog, setCatalogSources] = useState<DataSource[]>(sources)
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null)
  const [fork, setFork] = useState<'form' | 'path' | 'matching'>(fromMatching ? 'matching' : 'form')
  const [pathChoice, setPathChoice] = useState<WizardPath | null>(fromMatching ? 'matching' : null)
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
  const [ruleCatalog, setRuleCatalog] = useState<CatalogState>(() => emptyCatalog())
  const [customRules, setCustomRules] = useState<CustomRule[]>(() => libraryCustomRules)
  const [selectedCustomIds, setSelectedCustomIds] = useState<string[]>([])
  const [alerts, setAlerts] = useState(() => defaultAlerts())
  const [schedule, setSchedule] = useState(() => defaultSchedule(fromMatching ? matchingNameFor('', '') : validationNameFor('New_Table')))
  const [visitedAlerts, setVisitedAlerts] = useState(false)
  const [visitedSchedule, setVisitedSchedule] = useState(false)
  const [running, setRunning] = useState(false)

  const [matchingStep, setMatchingStep] = useState(1)
  const [matchingMax, setMatchingMax] = useState(1)
  const [matchType, setMatchType] = useState<WizardMatchType | ''>('')
  const [matchMode, setMatchMode] = useState<'existing' | 'new'>('existing')
  const [matchLeft, setMatchLeft] = useState<MatchSideState>(() => emptyMatchSide())
  const [matchRight, setMatchRight] = useState<MatchSideState>(() => emptyMatchSide())
  const [matchName, setMatchName] = useState('')
  const [matchDescription, setMatchDescription] = useState('')
  const [matchFlags, setMatchFlags] = useState<MatchFlagState>(() => defaultMatchFlags())
  const [matchAdditional, setMatchAdditional] = useState<MatchAdditionalState>(() => defaultMatchAdditional())
  const [matchMappings, setMatchMappings] = useState<MatchMappingRow[]>([])
  const [mappingSeedKey, setMappingSeedKey] = useState('')

  const isMatchingFlow = fromMatching || (fromConnections && fork === 'matching')
  const choosingPath = fromConnections && step === 1 && fork === 'path'
  const showStepper = fromMatching || (fromConnections && fork === 'matching') || (!fromConnections && !fromMatching) || (pathChoice === 'quality' && step >= 2 && fork !== 'path' && fork !== 'matching')

  const existing = catalog.find((source) => source.id === sourceId) ?? null
  const connectionName = mode === 'existing' ? (existing?.name ?? 'Connection') : draft.nickname
  const connectionType = mode === 'existing' ? (existing?.type ?? 'MSSQL') : draft.type
  const connectionTables = mode === 'existing' ? (existing?.tables ?? []) : []
  const selectedTable = connectionTables.find((table) => table.id === tableId) ?? null
  const schema = selectedTable ? schemaFor(selectedTable) : []
  const columns = catalogColumnsFrom(schema)
  const summary = catalogSummary(ruleCatalog, columns)

  const leftSource = catalog.find((source) => source.id === matchLeft.sourceId) ?? null
  const rightSource = catalog.find((source) => source.id === matchRight.sourceId) ?? null
  const leftTable = leftSource?.tables.find((table) => table.id === matchLeft.tableId) ?? null
  const rightTable = rightSource?.tables.find((table) => table.id === matchRight.tableId) ?? null
  const leftSchema = leftTable ? schemaFor(leftTable) : []
  const rightSchema = rightTable ? schemaFor(rightTable) : []

  const page = choosingPath
    ? { title: 'What do you want to create?', subtitle: 'Continue with data quality checks, or matching.' }
    : isMatchingFlow
      ? (matchingPages[matchingStep - 1] ?? { title: matchingSteps[matchingStep - 1].label, subtitle: matchingSteps[matchingStep - 1].hint })
      : (pages[step - 1] ?? { title: steps[step - 1].label, subtitle: steps[step - 1].hint })

  const connectReady =
    mode === 'existing'
      ? Boolean(existing?.active)
      : draft.nickname.trim() !== '' && draft.host.trim() !== '' && draft.database.trim() !== ''

  const matchConnectReady = draft.nickname.trim() !== '' && draft.host.trim() !== '' && draft.database.trim() !== ''
  const matchTablesReady = Boolean(matchType && matchLeft.sourceId && matchLeft.tableId && matchRight.sourceId && matchRight.tableId)

  const stepReady = isMatchingFlow
    ? matchingStep === 1 && matchMode === 'new'
      ? matchConnectReady
      : matchingStep === 1
        ? matchTablesReady
        : matchingStep === 2
          ? matchName.trim() !== '' && !isStubMatchType(matchType)
          : true
    : choosingPath
      ? Boolean(pathChoice)
      : step === 1
        ? connectReady
        : step === 2
          ? tableKind === 'data' && Boolean(selectedTable)
          : true

  const activeSteps = isMatchingFlow ? matchingSteps : steps
  const activeStep = isMatchingFlow ? matchingStep : step
  const activeMax = isMatchingFlow ? matchingMax : maxReached

  function resetForkToForm() {
    setFork('form')
    setPathChoice(null)
  }

  function goToQuality(next: number) {
    const target = Math.min(Math.max(next, 1), steps.length)
    if (fromConnections && target <= 1) {
      resetForkToForm()
      setStep(1)
      return
    }
    if (target === 7) setVisitedAlerts(true)
    if (target === 8) setVisitedSchedule(true)
    setMaxReached((current) => Math.max(current, target))
    setStep(target)
  }

  function seedMappings() {
    const key = `${matchType}|${matchLeft.tableId}|${matchRight.tableId}|${matchFlags.autoMapPrimaryKeys}|${matchFlags.autoMapMatchValues}|${matchFlags.autoMapAggregateKeys}|${matchFlags.autoMapAggregateField}`
    if (key === mappingSeedKey) return
    setMatchMappings(seedMatchMappings(leftSchema, rightSchema, matchFlags, matchType))
    setMappingSeedKey(key)
  }

  function goToMatching(next: number) {
    const target = Math.min(Math.max(next, 1), matchingSteps.length)
    if (target === 4) seedMappings()
    if (target === 6) setVisitedAlerts(true)
    if (target === 7) setVisitedSchedule(true)
    setMatchingMax((current) => Math.max(current, target))
    setMatchingStep(target)
  }

  function goTo(next: number) {
    if (isMatchingFlow) goToMatching(next)
    else goToQuality(next)
  }

  function clearTable() {
    setTableId('')
    setNickname('')
    setDescription('')
    setTableTags([])
    setDomain('')
    setFilterText('')
    setRuleCatalog(emptyCatalog())
    setSelectedCustomIds([])
  }

  function persistNewSource() {
    if (savedDraftId) {
      setSourceId(savedDraftId)
      setMode('existing')
      return savedDraftId
    }
    const next = sourceFromDraft(draft, catalog)
    setCatalogSources((current) => [...current, next])
    setSavedDraftId(next.id)
    setSourceId(next.id)
    setMode('existing')
    onSourceCreated?.(next)
    return next.id
  }

  function persistMatchSource() {
    const next = sourceFromDraft(draft, catalog)
    setCatalogSources((current) => [next, ...current])
    setSavedDraftId(next.id)
    setMatchMode('existing')
    setDraft(emptyDraft())
    onSourceCreated?.(next)
  }

  function applyMatchTables() {
    const leftName = leftTable?.nickname ?? ''
    const rightName = rightTable?.nickname ?? ''
    const nextName = matchingNameFor(leftName, rightName)
    setMatchName(nextName)
    setMatchDescription(`Match ${leftName} to ${rightName}`)
    setMatchAdditional((current) => ({
      ...current,
      domain: current.domain || inferDomain(leftSource?.name ?? '', leftName),
    }))
    setSchedule((current) => ({
      ...current,
      validationName: nextName,
    }))
    setMappingSeedKey('')
  }

  function applyPath() {
    if (pathChoice === 'matching') {
      setFork('matching')
      setMatchingStep(1)
      setMatchingMax(1)
      setMatchMode('existing')
      setMatchLeft((current) => ({ ...emptyMatchSide(), sourceId: sourceId ?? current.sourceId }))
      setMatchRight(emptyMatchSide())
      return
    }
    if (pathChoice === 'quality') {
      setFork('form')
      goToQuality(2)
    }
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
    setRuleCatalog(suggestCatalog(nextColumns, table.nickname))
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

  function goBack() {
    if (isMatchingFlow && matchingStep === 1 && fromConnections) {
      setFork('path')
      return
    }
    if (isMatchingFlow && matchingStep === 1) {
      onExit()
      return
    }
    if (isMatchingFlow) {
      goToMatching(matchingStep - 1)
      return
    }
    if (choosingPath) {
      resetForkToForm()
      return
    }
    if (fromConnections && step === 2) {
      setStep(1)
      setFork('path')
      return
    }
    if (step === 1) {
      onExit()
      return
    }
    goToQuality(step - 1)
  }

  function goNext() {
    if (!stepReady) return
    if (isMatchingFlow && matchingStep === 1 && matchMode === 'new') {
      persistMatchSource()
      return
    }
    if (isMatchingFlow && matchingStep === 1) {
      applyMatchTables()
      goToMatching(2)
      return
    }
    if (isMatchingFlow && matchingStep === matchingSteps.length) {
      onExit()
      return
    }
    if (isMatchingFlow) {
      goToMatching(matchingStep + 1)
      return
    }
    if (fromConnections && step === 1 && fork === 'form') {
      if (mode === 'new') persistNewSource()
      setFork('path')
      return
    }
    if (choosingPath) {
      applyPath()
      return
    }
    if (step === steps.length) {
      onExit()
      return
    }
    goToQuality(step + 1)
  }

  const finishRun = useCallback(() => {
    setRunning(false)
    setVisitedAlerts(true)
    if (fromMatching || fork === 'matching') {
      setMatchingMax((current) => Math.max(current, 6))
      setMatchingStep(6)
      return
    }
    setMaxReached((current) => Math.max(current, 7))
    setStep(7)
  }, [fork, fromMatching])

  const showConnect = !fromMatching && step === 1 && !choosingPath && !isMatchingFlow
  const showQualitySteps = !fromMatching && !choosingPath && !isMatchingFlow

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <div className="db-scroll min-h-0 flex-1 overflow-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-6 lg:px-8 lg:py-8">
          {showStepper ? <Stepper items={activeSteps} step={activeStep} maxReached={activeMax} onJump={goTo} /> : null}

          <header className={`flex items-start justify-between gap-6 ${showStepper ? 'mt-8' : ''}`}>
            <div className="min-w-0">
              <h1 className="font-sans text-[1.75rem] leading-9 font-semibold tracking-[-0.03em] text-ink">{page.title}</h1>
              <p className="mt-1 text-sm leading-6 text-muted">{page.subtitle}</p>
            </div>
            {showConnect ? (
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
            {showConnect ? (
              <ConnectionStep
                sources={catalog}
                mode={mode}
                onMode={(next) => {
                  setMode(next)
                  clearTable()
                  if (fromConnections) resetForkToForm()
                }}
                sourceId={sourceId}
                onSource={(id) => {
                  setSourceId(id)
                  clearTable()
                  if (fromConnections) {
                    setPathChoice(null)
                    setFork('path')
                  }
                }}
                draft={draft}
                onDraft={setDraft}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((current) => !current)}
                tagDraft={tagDraft}
                onTagDraft={setTagDraft}
              />
            ) : null}
            {choosingPath ? <PathStep value={pathChoice} onChange={setPathChoice} /> : null}
            {isMatchingFlow && matchingStep === 1 ? (
              <MatchTablesStep
                matchType={matchType}
                onMatchType={setMatchType}
                mode={matchMode}
                onMode={setMatchMode}
                catalog={catalog}
                left={matchLeft}
                right={matchRight}
                onLeft={setMatchLeft}
                onRight={setMatchRight}
                draft={draft}
                onDraft={setDraft}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((current) => !current)}
                tagDraft={tagDraft}
                onTagDraft={setTagDraft}
              />
            ) : null}
            {isMatchingFlow && matchingStep === 2 ? (
              <MatchConfigureStep
                matchType={matchType}
                name={matchName}
                onName={setMatchName}
                description={matchDescription}
                onDescription={setMatchDescription}
                flags={matchFlags}
                onFlags={(next) => {
                  setMatchFlags(next)
                  setMappingSeedKey('')
                }}
              />
            ) : null}
            {isMatchingFlow && matchingStep === 3 ? (
              <MatchAdditionalStep value={matchAdditional} onChange={setMatchAdditional} />
            ) : null}
            {isMatchingFlow && matchingStep === 4 ? (
              <MatchMappingStep
                sourceName={leftSource?.name ?? 'source'}
                sourceTable={leftTable?.name ?? leftTable?.nickname ?? 'source'}
                targetName={rightSource?.name ?? 'target'}
                targetTable={rightTable?.name ?? rightTable?.nickname ?? 'target'}
                targetSchema={rightSchema}
                rows={matchMappings}
                onRows={setMatchMappings}
              />
            ) : null}
            {isMatchingFlow && matchingStep === 5 ? (
              <MatchPreviewStep
                matchType={matchType}
                name={matchName}
                description={matchDescription}
                sourceName={leftSource?.name ?? '—'}
                sourceTable={leftTable?.nickname ?? ''}
                targetName={rightSource?.name ?? '—'}
                targetTable={rightTable?.nickname ?? ''}
                flags={matchFlags}
                additional={matchAdditional}
                rows={matchMappings}
                alerts={alerts}
                schedule={schedule}
                visitedAlerts={visitedAlerts}
                visitedSchedule={visitedSchedule}
                onJump={goToMatching}
                onRun={() => setRunning(true)}
              />
            ) : null}
            {isMatchingFlow && matchingStep === 6 ? <NotificationsStep alerts={alerts} onChange={setAlerts} /> : null}
            {isMatchingFlow && matchingStep === 7 ? <ScheduleStep schedule={schedule} onChange={setSchedule} /> : null}
            {showQualitySteps && step === 2 ? (
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
            {showQualitySteps && step === 3 ? (
              <ConfigureStep
                configure={configure}
                onConfigure={setConfigure}
                domain={domain}
                onDomain={setDomain}
                description={description}
                onDescription={setDescription}
              />
            ) : null}
            {showQualitySteps && step === 4 ? (
              <CatalogStep tableName={nickname} columns={columns} state={ruleCatalog} onChange={setRuleCatalog} />
            ) : null}
            {showQualitySteps && step === 5 ? (
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
            {showQualitySteps && step === 6 ? (
              <PreviewStep
                sourceName={connectionName}
                tableName={nickname}
                configure={configure}
                domain={domain}
                description={description}
                columns={columns}
                catalog={ruleCatalog}
                customRules={customRules}
                selectedCustomIds={selectedCustomIds}
                alerts={alerts}
                schedule={schedule}
                visitedAlerts={visitedAlerts}
                visitedSchedule={visitedSchedule}
                onJump={goToQuality}
                onRun={() => setRunning(true)}
              />
            ) : null}
            {showQualitySteps && step === 7 ? <NotificationsStep alerts={alerts} onChange={setAlerts} /> : null}
            {showQualitySteps && step === 8 ? <ScheduleStep schedule={schedule} onChange={setSchedule} /> : null}
          </div>
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-line bg-canvas px-6 py-3.5 lg:px-8">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-10 items-center gap-1 rounded-md px-1 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:text-indigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        >
          <Glyph>
            <path d="M15 6 9 12l6 6" />
          </Glyph>
          Back
        </button>
        {showStepper ? (
          <p className="font-sans text-sm text-muted">
            Step {activeStep} of {activeSteps.length}
          </p>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={!stepReady}
          onClick={goNext}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-indigo px-4 font-sans text-sm font-medium text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:bg-container-high disabled:text-outline"
        >
          {activeStep === activeSteps.length && showStepper ? 'Done' : isMatchingFlow && matchingStep === 1 && matchMode === 'new' ? 'Save source' : 'Continue'}
          <Glyph>
            <path d="m9 6 6 6-6 6" />
          </Glyph>
        </button>
      </footer>

      {running ? (
        <RunOverlay
          tableName={isMatchingFlow ? matchName || leftTable?.nickname || 'Matching' : nickname}
          ruleCount={isMatchingFlow ? matchMappings.filter((row) => row.targetColumn).length : summary.total + selectedCustomIds.length}
          kind={isMatchingFlow ? 'matching' : 'validation'}
          onFinished={finishRun}
        />
      ) : null}
    </div>
  )
}

function Stepper({
  items,
  step,
  maxReached,
  onJump,
}: {
  items: readonly { id: string; label: string; hint: string }[]
  step: number
  maxReached: number
  onJump: (step: number) => void
}) {
  return (
    <div className="overflow-x-auto">
      <ol className="flex min-w-[52rem]">
        {items.map((item, index) => {
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
                    <StepGlyph id={item.id as (typeof steps)[number]['id'] | (typeof matchingSteps)[number]['id']} />
                  )}
                </button>
                <span
                  className={`h-px flex-1 ${index === items.length - 1 ? 'bg-transparent' : number < step || number < maxReached ? 'bg-indigo' : 'bg-line'}`}
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
