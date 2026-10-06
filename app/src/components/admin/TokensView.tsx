import { useMemo, useState } from 'react'
import {
  currentActor,
  formatNow,
  newAdminId,
  randomSecret,
  tokenPrefix,
  type ApiToken,
} from '../../data/admin.ts'
import { useAdmin } from '../../admin/adminStore.ts'
import EmptyState from '../EmptyState.tsx'
import { AdminIcon } from '../icons.tsx'
import { Field, fieldClass, Modal, primaryButton, secondaryButton } from '../wizard/ui.tsx'
import { headClass } from '../jobs/chrome.tsx'
import { cellClass, dangerButton, rowClass, SecretBox } from './fields.tsx'

export default function TokensView({ query, creating, onCreatingChange }: { query: string; creating: boolean; onCreatingChange: (open: boolean) => void }) {
  const { tokens, mcp, addToken, revokeToken, rotateMcp } = useAdmin()
  const [secret, setSecret] = useState<string | null>(null)
  const [mcpSecret, setMcpSecret] = useState<string | null>(null)
  const [revokeId, setRevokeId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return tokens.filter((token) => !needle || `${token.name} ${token.createdBy} ${token.prefix}`.toLowerCase().includes(needle))
  }, [tokens, query])

  const revoking = tokens.find((token) => token.id === revokeId) ?? null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <section className="rounded-lg border border-line bg-canvas p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">MCP token</p>
            <h2 className="mt-1 font-sans text-base font-semibold tracking-[-0.02em] text-ink">Model context protocol</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
              A single platform token for MCP clients. Rotate it if a connector is compromised; the previous value stops working immediately.
            </p>
          </div>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => {
              const next = randomSecret('mcp')
              rotateMcp(tokenPrefix(next))
              setMcpSecret(next)
            }}
          >
            Rotate token
          </button>
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">Prefix</dt>
            <dd className="mt-1 font-mono text-sm text-ink">{mcp.prefix}…</dd>
          </div>
          <div>
            <dt className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">Last rotated</dt>
            <dd className="mt-1 font-sans text-sm text-ink">{mcp.lastRotated}</dd>
          </div>
        </dl>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-sans text-sm font-semibold text-ink">API tokens</h2>
          <p className="mt-0.5 text-xs text-muted">Use these to call Databuck APIs from jobs, CI, and integrations.</p>
        </div>
        <div className="db-scroll min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className={headClass}>Name</th>
                <th className={headClass}>Created by</th>
                <th className={headClass}>Created</th>
                <th className={headClass}>Last used</th>
                <th className={headClass}>Prefix</th>
                <th className={`${headClass} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((token) => (
                <tr key={token.id} className={rowClass}>
                  <td className={`${cellClass} font-sans font-medium text-ink`}>{token.name}</td>
                  <td className={`${cellClass} text-muted`}>{token.createdBy}</td>
                  <td className={`${cellClass} font-mono text-xs text-ink`}>{token.createdAt}</td>
                  <td className={`${cellClass} font-mono text-xs text-ink`}>{token.lastUsed}</td>
                  <td className={`${cellClass} font-mono text-xs text-ink`}>{token.prefix}…</td>
                  <td className={`${cellClass} text-right`}>
                    <button type="button" className={dangerButton} onClick={() => setRevokeId(token.id)}>
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <EmptyState icon={<AdminIcon />} title="No API tokens" description="Generate a token to call Databuck APIs." />
          ) : null}
        </div>
      </section>

      {creating ? (
        <GenerateTokenModal
          onClose={() => onCreatingChange(false)}
          onCreate={(token, value) => {
            addToken(token)
            setSecret(value)
            onCreatingChange(false)
          }}
        />
      ) : null}

      {secret ? (
        <SecretModal title="API token created" hint="Copy it now. Databuck will not show the full token again." secret={secret} onClose={() => setSecret(null)} />
      ) : null}

      {mcpSecret ? (
        <SecretModal title="MCP token rotated" hint="Update every MCP client with this value. The previous token is revoked." secret={mcpSecret} onClose={() => setMcpSecret(null)} />
      ) : null}

      {revoking ? (
        <Modal
          title="Revoke token"
          onClose={() => setRevokeId(null)}
          footer={
            <>
              <button type="button" className={secondaryButton} onClick={() => setRevokeId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={() => {
                  revokeToken(revoking.id)
                  setRevokeId(null)
                }}
              >
                Revoke
              </button>
            </>
          }
        >
          <p className="text-sm leading-6 text-muted">
            <span className="font-medium text-ink">{revoking.name}</span> will stop authenticating immediately. Jobs using {revoking.prefix}… will fail until they are updated.
          </p>
        </Modal>
      ) : null}
    </div>
  )
}

function GenerateTokenModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (token: ApiToken, secret: string) => void
}) {
  const [name, setName] = useState('')

  return (
    <Modal
      title="New API token"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={!name.trim()}
            onClick={() => {
              const value = randomSecret('live')
              onCreate(
                {
                  id: newAdminId('tok'),
                  name: name.trim(),
                  createdBy: currentActor,
                  createdAt: formatNow(),
                  lastUsed: 'Never',
                  prefix: tokenPrefix(value),
                },
                value,
              )
            }}
          >
            Generate token
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Token name" required>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="CI quality runner" className={fieldClass} />
        </Field>
      </div>
    </Modal>
  )
}

function SecretModal({
  title,
  hint,
  secret,
  onClose,
}: {
  title: string
  hint: string
  secret: string
  onClose: () => void
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <button type="button" className={primaryButton} onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-sm leading-6 text-muted">{hint}</p>
        <SecretBox value={secret} />
      </div>
    </Modal>
  )
}
