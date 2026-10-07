import { nicknameSuggestion } from '../../data/aiMocks.ts'
import { dataSources, type DataSource, type SourceType } from '../../data/sources.ts'
import { databaseOf, endpointOf, emptyDraft, sourceTypes, tips, typeLabels, type DraftSource } from './model.ts'
import { endpointMeta } from '../../data/connectionFields.ts'
import {
  cardClass,
  DatabaseGlyph,
  Fact,
  Field,
  fieldClass,
  Glyph,
  PlusGlyph,
  Segment,
  Segmented,
  StatusPill,
  TagField,
  TagList,
} from './ui.tsx'

export default function ConnectionStep({
  mode,
  onMode,
  sourceId,
  onSource,
  draft,
  onDraft,
  showPassword,
  onTogglePassword,
  tagDraft,
  onTagDraft,
  sources = dataSources,
}: {
  mode: 'existing' | 'new'
  onMode: (mode: 'existing' | 'new') => void
  sourceId: string | null
  onSource: (id: string) => void
  draft: DraftSource
  onDraft: (draft: DraftSource) => void
  showPassword: boolean
  onTogglePassword: () => void
  tagDraft: string
  onTagDraft: (value: string) => void
  sources?: DataSource[]
}) {
  const selected = sources.find((source) => source.id === sourceId) ?? null
  return (
    <div className="flex flex-col gap-4">
      <Segmented>
        <Segment pressed={mode === 'existing'} onClick={() => onMode('existing')} count={sources.length} icon={<DatabaseGlyph />}>
          Select Existing
        </Segment>
        <Segment pressed={mode === 'new'} onClick={() => onMode('new')} icon={<PlusGlyph />}>
          Create New
        </Segment>
      </Segmented>

      {mode === 'existing' ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <section className={`${cardClass} p-4`}>
            <h2 className="flex items-center gap-2 px-1 font-sans text-sm font-semibold text-ink">
              <span className="text-indigo">
                <DatabaseGlyph />
              </span>
              Available Data Sources
            </h2>
            <ul className="db-scroll mt-3 flex max-h-[28rem] flex-col gap-2 overflow-auto rounded-lg bg-surface p-2">
              {sources.map((source) => {
                const on = source.id === sourceId
                return (
                  <li key={source.id}>
                    <button
                      type="button"
                      onClick={() => onSource(source.id)}
                      aria-pressed={on}
                      className={`flex w-full items-center gap-3 rounded-lg border bg-canvas px-3 py-3 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                        on ? 'border-indigo shadow-card' : 'border-line hover:border-line-strong'
                      }`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface text-muted">
                        <DatabaseGlyph />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-sans text-sm font-semibold text-ink">{source.name}</span>
                        <span className="mt-0.5 block truncate font-mono text-[11px] text-tagline">
                          {source.type} · {endpointOf(source)} · {databaseOf(source)}
                        </span>
                      </span>
                      <StatusPill active={source.active} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
          <ConnectionInfo source={selected} />
        </div>
      ) : (
        <CreateSource
          draft={draft}
          onDraft={onDraft}
          showPassword={showPassword}
          onTogglePassword={onTogglePassword}
          tagDraft={tagDraft}
          onTagDraft={onTagDraft}
        />
      )}
    </div>
  )
}

function ConnectionInfo({ source }: { source: DataSource | null }) {
  return (
    <section className={`flex min-h-[22rem] flex-col ${cardClass} p-5`}>
      <h2 className="font-sans text-sm font-semibold text-ink">Connection Info</h2>
      {source ? (
        <div className="mt-5 flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-sans text-lg font-semibold tracking-[-0.02em] text-ink">{source.name}</p>
              <p className="mt-1 font-sans text-sm text-muted">{typeLabels[source.type]}</p>
            </div>
            <StatusPill active={source.active} />
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
            <Fact label={endpointMeta(source).label} value={endpointOf(source)} mono />
            <Fact label="Database" value={databaseOf(source)} mono />
            <Fact label="Tables" value={String(source.tables.length)} />
            <Fact label="User" value={source.properties.username || '—'} mono />
          </dl>
          <p className={`mt-auto pt-6 text-sm leading-6 ${source.active ? 'text-success-ink' : 'text-muted'}`}>
            {source.active
              ? 'This source is connected and can be used for the validation.'
              : 'This source is offline, so it cannot be used yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="text-tagline">
            <DatabaseGlyph size={36} />
          </span>
          <p className="mt-3 max-w-[14rem] text-sm leading-6 text-muted">Select a data source to view its details</p>
        </div>
      )}
    </section>
  )
}

export function CreateSource({
  draft,
  onDraft,
  showPassword,
  onTogglePassword,
  tagDraft,
  onTagDraft,
}: {
  draft: DraftSource
  onDraft: (draft: DraftSource) => void
  showPassword: boolean
  onTogglePassword: () => void
  tagDraft: string
  onTagDraft: (value: string) => void
}) {
  function addTag() {
    const next = tagDraft.trim()
    if (!next || draft.tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) return
    onDraft({ ...draft, tags: [...draft.tags, next] })
    onTagDraft('')
  }

  function chooseType(type: SourceType) {
    const previous = emptyDraft(draft.type)
    const next = emptyDraft(type)
    onDraft({
      type,
      nickname: draft.nickname === previous.nickname ? next.nickname : draft.nickname,
      host: draft.host === previous.host ? next.host : draft.host,
      database: draft.database === previous.database ? next.database : draft.database,
      port: draft.port === previous.port ? next.port : draft.port,
      tags: draft.tags.length === 1 && draft.tags[0] === draft.type ? [type] : draft.tags,
      username: draft.username === previous.username ? next.username : draft.username,
      password: draft.password,
    })
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)]">
      <div className="flex flex-col gap-4">
        <section className={`${cardClass} p-5`}>
          <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
            <span className="text-indigo">
              <DatabaseGlyph />
            </span>
            Connection
          </h2>
          <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
            <Field label="Data source type" required>
              <select value={draft.type} onChange={(event) => chooseType(event.target.value as SourceType)} className={fieldClass}>
                {sourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {typeLabels[type]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Source nickname" required>
              <input
                value={draft.nickname}
                placeholder="e.g. Production DB"
                onChange={(event) => onDraft({ ...draft, nickname: event.target.value })}
                className={fieldClass}
              />
              <button
                type="button"
                className="mt-1 font-sans text-xs font-medium text-indigo"
                onClick={() => onDraft({ ...draft, nickname: nicknameSuggestion(draft.type, draft.host, draft.database) })}
              >
                Use suggested name
              </button>
            </Field>
            <Field label="URI / Host" required>
              <input
                value={draft.host}
                placeholder="e.g. sql.internal"
                onChange={(event) => onDraft({ ...draft, host: event.target.value })}
                className={fieldClass}
              />
            </Field>
            <Field label="Database / Schema" required>
              <input
                value={draft.database}
                placeholder="e.g. erp.dbo"
                onChange={(event) => onDraft({ ...draft, database: event.target.value })}
                className={fieldClass}
              />
            </Field>
            <Field label="Port" required>
              <input
                value={draft.port}
                inputMode="numeric"
                onChange={(event) => onDraft({ ...draft, port: event.target.value })}
                className={`${fieldClass} font-mono`}
              />
            </Field>
            <Field label="Tags">
              <TagField value={tagDraft} onChange={onTagDraft} onAdd={addTag} placeholder="Add tag…" />
              <TagList tags={draft.tags} onRemove={(tag) => onDraft({ ...draft, tags: draft.tags.filter((item) => item !== tag) })} />
            </Field>
          </div>
        </section>

        <section className={`${cardClass} p-5`}>
          <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
            <span className="text-indigo">
              <Glyph>
                <path d="M12 3 19 6v6c0 4.2-2.8 7.2-7 8.5C7.8 19.2 5 16.2 5 12V6l7-3z" />
              </Glyph>
            </span>
            Authentication
          </h2>
          <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
            <Field label="Username">
              <input
                value={draft.username}
                placeholder="e.g. reader"
                autoComplete="off"
                onChange={(event) => onDraft({ ...draft, username: event.target.value })}
                className={fieldClass}
              />
            </Field>
            <Field label="Password">
              <span className="relative block">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={draft.password}
                  placeholder="Enter password"
                  autoComplete="new-password"
                  onChange={(event) => onDraft({ ...draft, password: event.target.value })}
                  className={`${fieldClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
                >
                  <Glyph>
                    {showPassword ? (
                      <path d="M3 3l18 18M10.5 10.7A2 2 0 0 0 12 14a2 2 0 0 0 1.3-.5M9.9 5.2A9 9 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.3-2.3 3.5M6.1 6.8C4.2 8.2 2.9 10.2 2.5 12c.5 1.2 1.6 2.8 3.1 4.1A11 11 0 0 0 12 19c1.1 0 2.1-.2 3.1-.6" />
                    ) : (
                      <>
                        <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </>
                    )}
                  </Glyph>
                </button>
              </span>
            </Field>
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-4">
        <section className={`${cardClass} p-5`}>
          <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
            <span className="grid size-5 place-items-center rounded-full border border-indigo text-indigo">
              <Glyph size={12}>
                <circle cx="12" cy="12" r="8" />
                <path d="M12 11v5" />
                <path d="M12 8h.01" />
              </Glyph>
            </span>
            Quick Tips
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm leading-5 text-muted">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo" />
                {tip}
              </li>
            ))}
          </ul>
        </section>
        <section className={`${cardClass} p-5`}>
          <h2 className="font-sans text-sm font-semibold text-ink">Supported Sources</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {sourceTypes.map((type) => {
              const on = draft.type === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => chooseType(type)}
                  className={`rounded-md px-2.5 py-1 font-sans text-xs font-medium transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                    on ? 'bg-indigo text-white' : 'bg-surface text-ink hover:bg-container-high'
                  }`}
                >
                  {typeLabels[type]}
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
