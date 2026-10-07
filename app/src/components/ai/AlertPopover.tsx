import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useWorkspaceAi } from '../../ai/WorkspaceAiContext.tsx'
import { headerAlerts } from '../../data/aiMocks.ts'
import { SparkIcon } from '../icons.tsx'

export default function AlertPopover({ onClose }: { onClose: () => void }) {
  const titleId = useId()
  const { openAgent, requestReview, enabled } = useWorkspaceAi()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    function onPointer(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute top-16 right-4 w-[22rem] overflow-hidden rounded-lg border border-line bg-canvas shadow-overlay"
        style={{ animation: 'db-modal-in 200ms ease-out' }}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id={titleId} className="flex items-center gap-1.5 font-sans text-sm font-semibold text-ink">
            <span className="text-indigo">
              <SparkIcon size={14} />
            </span>
            Alerts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-xs font-medium text-indigo hover:text-indigo-hover"
          >
            Close
          </button>
        </div>
        <ul className="db-scroll max-h-[24rem] overflow-auto p-2">
          {headerAlerts.map((alert) => (
            <li key={alert.id}>
              <div className="rounded-md px-3 py-2.5 hover:bg-surface">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-sans text-sm font-medium text-ink">{alert.title}</p>
                  <span
                    className={`mt-1 size-1.5 shrink-0 rounded-full ${
                      alert.tone === 'danger' ? 'bg-danger' : alert.tone === 'warning' ? 'bg-warning' : 'bg-info'
                    }`}
                  />
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{alert.body}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-label text-[0.625rem] tracking-[0.08em] text-muted uppercase">{alert.when}</span>
                  {enabled && alert.action ? (
                    <button
                      type="button"
                      className="font-sans text-xs font-medium text-indigo hover:text-indigo-hover"
                      onClick={() => {
                        if (alert.action?.id === 'review') requestReview('campaigns')
                        else openAgent()
                        onClose()
                      }}
                    >
                      {alert.action.label}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  )
}
