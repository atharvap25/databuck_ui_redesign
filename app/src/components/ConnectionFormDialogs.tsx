import { useState } from 'react'
import { discoverableTables, type DataSource, type SourceTable } from '../data/sources.ts'
import { CreateSource } from './wizard/ConnectionStep.tsx'
import { emptyDraft, inferDomain, schemaFor, type DraftSource, type ProfileMode, type TableKind } from './wizard/model.ts'
import TableStep from './wizard/TableStep.tsx'
import { Modal, primaryButton, secondaryButton } from './wizard/ui.tsx'

export function SourceCreateDialog({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (draft: DraftSource) => void
}) {
  const [draft, setDraft] = useState<DraftSource>(() => emptyDraft())
  const [showPassword, setShowPassword] = useState(false)
  const [tagDraft, setTagDraft] = useState('')
  const canSave = draft.nickname.trim() !== '' && draft.host.trim() !== '' && draft.database.trim() !== ''

  return (
    <Modal
      title="Add Data Source"
      size="xl"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="button" disabled={!canSave} onClick={() => onSave(draft)} className={primaryButton}>
            Save source
          </button>
        </>
      }
    >
      <CreateSource
        draft={draft}
        onDraft={setDraft}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword((current) => !current)}
        tagDraft={tagDraft}
        onTagDraft={setTagDraft}
      />
    </Modal>
  )
}

export function TableCreateDialog({
  source,
  onClose,
  onSave,
}: {
  source: DataSource
  onClose: () => void
  onSave: (table: SourceTable) => void
}) {
  const tables = discoverableTables(source)
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

  const selected = tables.find((table) => table.id === tableId) ?? null
  const canSave = tableKind === 'data' && Boolean(selected)

  function chooseTable(id: string) {
    setTableId(id)
    const table = tables.find((item) => item.id === id)
    if (!table) return
    const nextDomain = inferDomain(source.name, table.nickname)
    setNickname(table.nickname)
    setDescription(`Quality checks for ${table.nickname}`)
    setDomain(nextDomain)
    setTableTags([source.type, nextDomain])
    setFilterText(table.rowFilter)
  }

  function addTag() {
    const next = tableTagDraft.trim()
    if (!next || tableTags.some((tag) => tag.toLowerCase() === next.toLowerCase())) return
    setTableTags((current) => [...current, next])
    setTableTagDraft('')
  }

  function save() {
    if (!selected) return
    onSave({
      ...selected,
      nickname: nickname.trim() || selected.nickname,
      description,
      rowFilter: filterText,
    })
  }

  return (
    <Modal
      title="Add Table"
      size="xl"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="button" disabled={!canSave} onClick={save} className={primaryButton}>
            Save table
          </button>
        </>
      }
    >
      <TableStep
        connectionType={source.type}
        connectionName={source.name}
        tables={tables}
        tableKind={tableKind}
        onKind={setTableKind}
        tableId={tableId}
        onTable={chooseTable}
        nickname={nickname}
        onNickname={setNickname}
        description={description}
        onDescription={setDescription}
        tags={tableTags}
        tagDraft={tableTagDraft}
        onTagDraft={setTableTagDraft}
        onAddTag={addTag}
        onRemoveTag={(tag) => setTableTags((current) => current.filter((item) => item !== tag))}
        domain={domain}
        onDomain={setDomain}
        schema={selected ? schemaFor(selected) : []}
        advanced={advanced}
        onAdvanced={setAdvanced}
        filterText={filterText}
        onFilterText={setFilterText}
        sqlText={sqlText}
        onSqlText={setSqlText}
        profile={profile}
        onProfile={setProfile}
      />
    </Modal>
  )
}
