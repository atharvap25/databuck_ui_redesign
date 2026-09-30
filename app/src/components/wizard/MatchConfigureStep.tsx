import { isStubMatchType, type MatchFlagState, type WizardMatchType } from './model.ts'
import { cardClass, CheckControl, Field, fieldClass, LaterNote } from './ui.tsx'

export default function MatchConfigureStep({
  matchType,
  name,
  onName,
  description,
  onDescription,
  flags,
  onFlags,
}: {
  matchType: WizardMatchType | ''
  name: string
  onName: (value: string) => void
  description: string
  onDescription: (value: string) => void
  flags: MatchFlagState
  onFlags: (next: MatchFlagState) => void
}) {
  const stub = isStubMatchType(matchType)

  function patch(partial: Partial<MatchFlagState>) {
    onFlags({ ...flags, ...partial })
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={`${cardClass} p-5`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Validation name" required>
            <input value={name} onChange={(event) => onName(event.target.value)} className={fieldClass} />
          </Field>
          <Field label="Description">
            <input value={description} onChange={(event) => onDescription(event.target.value)} className={fieldClass} />
          </Field>
        </div>
      </section>

      {stub ? (
        <LaterNote>This matching type is under development. Choose Aggregate, Migration, or Cell-to-cell to continue.</LaterNote>
      ) : matchType === 'Cell-to-cell' ? null : (
        <section className={`${cardClass} p-5`}>
          <h2 className="font-sans text-sm font-semibold text-ink">Matching options</h2>
          <div className="mt-2 flex flex-col gap-2">
            {matchType === 'Migration' ? (
              <>
                <CheckControl
                  checked={flags.autoMapPrimaryKeys}
                  label="Auto Map Primary Keys"
                  hint="Seed join keys from shared identifier columns."
                  onChange={(checked) => patch({ autoMapPrimaryKeys: checked })}
                />
                <CheckControl
                  checked={flags.autoMapMatchValues}
                  label="Auto Map Match Values"
                  hint="Map target columns that share a source name."
                  onChange={(checked) => patch({ autoMapMatchValues: checked })}
                />
                <CheckControl
                  checked={flags.removeCaseSensitivity}
                  label="Remove Case Sensitivity"
                  hint="Compare values without regard to letter case."
                  onChange={(checked) => patch({ removeCaseSensitivity: checked })}
                />
                <CheckControl
                  checked={flags.applyTrim}
                  label="Apply Trim to Match Fields"
                  hint="Strip leading and trailing whitespace before compare."
                  onChange={(checked) => patch({ applyTrim: checked })}
                />
                <CheckControl
                  checked={flags.addressNulls}
                  label="Address Empty/Null Values Automatically"
                  hint="Treat empty strings and nulls as the same value."
                  onChange={(checked) => patch({ addressNulls: checked })}
                />
                <CheckControl
                  checked={flags.castNumbers}
                  label="Cast All Numbers to Same Decimal Formats"
                  hint="Normalize numeric precision before matching."
                  onChange={(checked) => patch({ castNumbers: checked })}
                />
              </>
            ) : null}
            {matchType === 'Aggregate' ? (
              <>
                <CheckControl
                  checked={flags.autoMapAggregateKeys}
                  label="Auto Map Primary Keys/Segment Keys/Group by"
                  hint="Seed group-by columns from shared keys."
                  onChange={(checked) => patch({ autoMapAggregateKeys: checked })}
                />
                <CheckControl
                  checked={flags.autoMapAggregateField}
                  label="Auto Map Aggregate Match Field"
                  hint="Map numeric fields with the same name."
                  onChange={(checked) => patch({ autoMapAggregateField: checked })}
                />
                <CheckControl
                  checked={flags.removeCaseSensitivity}
                  label="Remove Case Sensitivity"
                  hint="Compare grouped labels without regard to case."
                  onChange={(checked) => patch({ removeCaseSensitivity: checked })}
                />
                <CheckControl
                  checked={flags.matchRecordCount}
                  label="Match Record Count"
                  hint="Flag when source and target row counts diverge."
                  onChange={(checked) => patch({ matchRecordCount: checked })}
                />
              </>
            ) : null}
          </div>
        </section>
      )}
    </div>
  )
}
