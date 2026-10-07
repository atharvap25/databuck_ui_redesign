import { useMemo, useState } from 'react'
import { dashboardName, dashboards, formatNow, newAdminId, projectLabel, type Report } from '../../data/admin.ts'
import { reportNarrative } from '../../data/aiMocks.ts'
import { useAdmin } from '../../admin/adminStore.ts'
import EmptyState from '../EmptyState.tsx'
import { DashboardIcon } from '../icons.tsx'
import { Field, fieldClass, Modal, primaryButton, secondaryButton } from '../wizard/ui.tsx'
import { KindBadge } from '../jobs/chrome.tsx'
import { dangerButton, ProjectChecks } from './fields.tsx'

export default function ReportsView({
  query,
  creating,
  onCreatingChange,
}: {
  query: string
  creating: boolean
  onCreatingChange: (open: boolean) => void
}) {
  const { reports, upsertReport, removeReport } = useAdmin()
  const [selectedId, setSelectedId] = useState(reports[0]?.id ?? '')
  const [editing, setEditing] = useState<Report | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return reports.filter((report) => {
      if (!needle) return true
      const hay = `${report.name} ${dashboardName(report.dashboardId)} ${report.projectIds.map(projectLabel).join(' ')}`
      return hay.toLowerCase().includes(needle)
    })
  }, [reports, query])

  const selected = reports.find((report) => report.id === selectedId) ?? filtered[0] ?? null
  const dashboard = selected ? dashboards.find((item) => item.id === selected.dashboardId) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <aside className="flex min-h-64 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card lg:w-[360px]">
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-sans text-sm font-semibold text-ink">Reports</h2>
          <p className="mt-0.5 text-xs text-muted">{filtered.length} embedded dashboards</p>
        </div>
        <ul className="db-scroll min-h-0 flex-1 overflow-auto p-2">
          {filtered.map((report) => {
            const on = selected?.id === report.id
            return (
              <li key={report.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(report.id)}
                  className={`flex w-full flex-col rounded-md px-3 py-2.5 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                    on ? 'bg-secondary-fixed' : 'hover:bg-surface'
                  }`}
                >
                  <span className="truncate font-sans text-sm font-medium text-ink">{report.name}</span>
                  <span className="mt-0.5 truncate text-xs text-muted">
                    {dashboardName(report.dashboardId)} · {report.projectIds.map(projectLabel).join(', ')}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <section className="flex min-h-80 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
        {selected && dashboard ? (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-6 py-4">
              <div>
                <h2 className="font-sans text-base font-semibold tracking-[-0.02em] text-ink">{selected.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {dashboard.name} · Published {selected.lastPublished}
                </p>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {selected.projectIds.map((id) => (
                    <KindBadge key={id} label={projectLabel(id)} />
                  ))}
                </span>
              </div>
              <div className="flex gap-2">
                <button type="button" className={secondaryButton} onClick={() => setEditing(selected)}>
                  Edit
                </button>
                <button type="button" className={`inline-flex h-10 items-center ${dangerButton}`} onClick={() => removeReport(selected.id)}>
                  Delete
                </button>
              </div>
            </header>
            <div className="db-scroll min-h-0 flex-1 overflow-auto p-6">
              <p className="mb-4 rounded-lg border border-info/20 bg-info-tint px-4 py-3 text-sm leading-6 text-info-ink">
                {reportNarrative}
              </p>
              <p className="mb-3 font-label text-[10px] tracking-[0.14em] text-muted uppercase">Superset embed</p>
              <div className="overflow-hidden rounded-lg border border-line bg-surface">
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                  <span className="font-sans text-sm font-medium text-ink">{dashboard.name}</span>
                  <span className="font-mono text-[11px] text-muted">superset · live</span>
                </div>
                <p className="px-4 pt-4 text-sm text-muted">{dashboard.description}</p>
                <div className="flex h-40 items-end gap-1.5 px-4 pt-6 pb-4">
                  {[42, 68, 54, 86, 61, 74, 48, 91, 57, 79, 63, 72].map((height, index) => (
                    <div
                      key={index}
                      className={`flex-1 rounded-t-md ${index === 7 ? 'bg-indigo' : 'bg-secondary-fixed'}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
                  <PreviewStat label="Score" value="94.2" />
                  <PreviewStat label="Failed checks" value="6" />
                  <PreviewStat label="Runs (7d)" value="128" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyState icon={<DashboardIcon />} title="No reports" description="Assign a Superset dashboard to a project to publish it." />
        )}
      </section>

      {creating || editing ? (
        <ReportModal
          report={creating ? null : editing}
          onClose={() => {
            onCreatingChange(false)
            setEditing(null)
          }}
          onSave={(report) => {
            upsertReport(report)
            setSelectedId(report.id)
            onCreatingChange(false)
            setEditing(null)
          }}
        />
      ) : null}
    </div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className="mt-1 font-sans text-lg font-semibold tracking-[-0.02em] text-ink">{value}</p>
    </div>
  )
}

function ReportModal({
  report,
  onClose,
  onSave,
}: {
  report: Report | null
  onClose: () => void
  onSave: (report: Report) => void
}) {
  const [name, setName] = useState(report?.name ?? '')
  const [dashboardId, setDashboardId] = useState(report?.dashboardId ?? dashboards[0]?.id ?? '')
  const [projectIds, setProjectIds] = useState<string[]>(report?.projectIds ?? [])

  return (
    <Modal
      title={report ? 'Edit report' : 'New report'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={!name.trim() || !dashboardId || projectIds.length === 0}
            onClick={() =>
              onSave({
                id: report?.id ?? newAdminId('rpt'),
                name: name.trim(),
                dashboardId,
                projectIds,
                lastPublished: formatNow(),
              })
            }
          >
            {report ? 'Save report' : 'Publish report'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Report name" required>
          <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
        </Field>
        <Field label="Dashboard" required>
          <select value={dashboardId} onChange={(event) => setDashboardId(event.target.value)} className={fieldClass}>
            {dashboards.map((dashboard) => (
              <option key={dashboard.id} value={dashboard.id}>
                {dashboard.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Projects" required>
          <ProjectChecks selected={projectIds} onChange={setProjectIds} />
        </Field>
      </div>
    </Modal>
  )
}
