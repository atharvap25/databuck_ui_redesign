import { notificationDraft } from '../../data/aiMocks.ts'
import { alertTriggers, severityLevels, type AlertState } from './model.ts'
import { cardClass, Field, fieldClass, Glyph, SendGlyph } from './ui.tsx'
import { GenerateButton, useMockGenerate } from '../ai/AiKit.tsx'

export default function NotificationsStep({
  alerts,
  onChange,
}: {
  alerts: AlertState
  onChange: (alerts: AlertState) => void
}) {
  const { busy, run } = useMockGenerate(600)

  function patch(partial: Partial<AlertState>) {
    onChange({ ...alerts, ...partial })
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={`${cardClass} p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface text-indigo">
              <Glyph>
                <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9" />
                <path d="M10 21a2 2 0 0 0 4 0" />
              </Glyph>
            </span>
            <div>
              <h2 className="font-sans text-sm font-semibold text-ink">Where to Send Alerts</h2>
              <p className="mt-0.5 text-sm text-muted">Enter the details for each channel you want to receive alerts on</p>
            </div>
          </div>
          <span className="rounded-full border border-line bg-surface px-2.5 py-1 font-label text-[10px] tracking-[0.12em] text-muted uppercase">
            Editable
          </span>
        </div>
        <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <ChannelField label="Email" value={alerts.email} placeholder="Enter Email" onChange={(email) => patch({ email })} />
          <ChannelField label="Jira" value={alerts.jira} placeholder="Enter Jira" onChange={(jira) => patch({ jira })} />
          <ChannelField label="Slack" value={alerts.slack} placeholder="Enter Slack" onChange={(slack) => patch({ slack })} />
          <ChannelField
            label="Assign Incident"
            value={alerts.assignIncident}
            placeholder="Enter email to Assign Incident"
            onChange={(assignIncident) => patch({ assignIncident })}
          />
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <Field label="Message">
              <textarea
                value={alerts.message}
                onChange={(event) => patch({ message: event.target.value })}
                placeholder="Optional alert body"
                className={`${fieldClass} h-24 py-2`}
              />
            </Field>
          </div>
          <div className="mt-3">
            <GenerateButton
              busy={busy}
              onClick={() => {
                run(() => {
                  const draft = notificationDraft('This validation', 1)
                  patch({ message: `${draft.subject}. ${draft.body}` })
                })
              }}
            >
              Draft message
            </GenerateButton>
          </div>
        </div>
      </section>

      <section className={`${cardClass} p-5`}>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface text-indigo">
            <Glyph>
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 4.7 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L14.7 4.7a2 2 0 0 0-3.4 0z" />
            </Glyph>
          </span>
          <div>
            <h2 className="font-sans text-sm font-semibold text-ink">When to Alert You</h2>
            <p className="mt-0.5 text-sm text-muted">Control when you get notified and what details to include</p>
          </div>
        </div>
        <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <Field label="Severity Level">
            <select value={alerts.severity} onChange={(event) => patch({ severity: event.target.value })} className={fieldClass}>
              {severityLevels.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Alert Trigger">
            <select value={alerts.trigger} onChange={(event) => patch({ trigger: event.target.value })} className={fieldClass}>
              {alertTriggers.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
        <fieldset className="mt-5">
          <legend className="font-sans text-xs font-medium text-ink">Notification Options</legend>
          <div className="mt-3 flex flex-col gap-2.5">
            <CheckOption
              checked={alerts.showRules}
              label="Show me which specific rules passed or failed"
              onChange={(showRules) => patch({ showRules })}
            />
            <CheckOption
              checked={alerts.includeSummary}
              label="Include an overall summary with key numbers"
              onChange={(includeSummary) => patch({ includeSummary })}
            />
            <CheckOption
              checked={alerts.onlyOnFailure}
              label="Only notify me when something goes wrong"
              onChange={(onlyOnFailure) => patch({ onlyOnFailure })}
            />
          </div>
        </fieldset>
      </section>
    </div>
  )
}

function ChannelField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <span className="flex">
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} rounded-r-none`} />
        <button
          type="button"
          aria-label={`Send test ${label}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-r-md border border-l-0 border-line bg-canvas text-indigo transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        >
          <SendGlyph />
        </button>
      </span>
    </Field>
  )
}

function CheckOption({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-indigo" />
      {label}
    </label>
  )
}
