import { MatchingIcon, QualityIcon } from '../icons.tsx'
import { cardClass } from './ui.tsx'

export type WizardPath = 'quality' | 'matching'

const options: { id: WizardPath; title: string; description: string; icon: typeof QualityIcon }[] = [
  {
    id: 'quality',
    title: 'Data Quality',
    description: 'Profile a table and run quality checks.',
    icon: QualityIcon,
  },
  {
    id: 'matching',
    title: 'Data Matching',
    description: 'Reconcile records across source and target tables.',
    icon: MatchingIcon,
  },
]

export default function PathStep({
  value,
  onChange,
}: {
  value: WizardPath | null
  onChange: (path: WizardPath) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {options.map((option) => {
        const on = value === option.id
        const Icon = option.icon
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.id)}
            className={`${cardClass} flex cursor-pointer flex-col gap-3 p-5 text-left transition-colors duration-150 ease-databuck hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
              on ? 'border-indigo bg-secondary-fixed' : ''
            }`}
          >
            <span className={`inline-flex size-10 items-center justify-center rounded-md text-indigo ${on ? 'bg-secondary-fixed' : 'border border-line bg-surface'}`}>
              <Icon />
            </span>
            <span>
              <span className="block font-sans text-base font-semibold tracking-[-0.02em] text-ink">{option.title}</span>
              <span className="mt-1 block text-sm leading-6 text-muted">{option.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
